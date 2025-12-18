// workers/GpuWorker.js

import {createBindGroup, createBindGroupLayout, createPipeline} from "../gpu/createPipeline.js";
import {runEchoGpuPipeline} from "../gpu/runPipeline.js";
import {getGpuDevice} from "../gpu/getDevice.js";
import {buildMainEchoBuffsArray} from "../encodeEchoStats.js";

let device = null;
let layout = null;
let pipelineMain = null;

let statsBuf = null;
let setsBuf = null;
let mainBuffsBuf = null;
let defaultConstraintBuf = null;

let combosBuf = null;
let combosBufSize = 0;

let ctxBuf = null;
let ctxBufSize = 0;

let constraintBuf = null;
let constraintBufSize = 0;

let kindBuf = null;

let candBuf = null;
let candBufSize = 0;

let bindGroup = null;
let bindGroupBuffers = null;

// Reusable MAP_READ buffer for candidate readback
let candReadback = { buffer: null, size: 0 };

let CANCEL = false;

const defaultConstraints = new Float32Array([
    1, 0, // atk
    1, 0, // hp
    1, 0, // def
    1, 0, // critRate
    1, 0, // critDmg
    1, 0, // ER
    1, 0, // dmgBonus
    1, 0, // damage
]);

// Must match WGSL
const WORKGROUP_SIZE = 512;
const CYCLES_PER_INVOCATION = 8;
const REDUCE_K = 4;

// Ensure capacity helper
function ensureStorageBuffer(existing, existingSize, neededSize, usage) {
    if (!existing || existingSize < neededSize) {
        if (existing) existing.destroy();
        const buf = device.createBuffer({ size: neededSize, usage });
        return { buffer: buf, size: neededSize };
    }
    return { buffer: existing, size: existingSize };
}

function getBindGroup(buffers) {
    if (!bindGroupBuffers) {
        bindGroup = createBindGroup(device, layout, buffers);
        bindGroupBuffers = { ...buffers };
        return bindGroup;
    }

    const keys = Object.keys(buffers);
    for (const key of keys) {
        if (bindGroupBuffers[key] !== buffers[key]) {
            bindGroup = createBindGroup(device, layout, buffers);
            bindGroupBuffers = { ...buffers };
            break;
        }
    }

    return bindGroup;
}

async function initStatic(encoded, echoes, charId) {
    device = await getGpuDevice();
    layout = createBindGroupLayout(device);
    bindGroup = null;
    bindGroupBuffers = null;

    pipelineMain = createPipeline(device, layout, "main");

    // Stats buffer
    statsBuf = device.createBuffer({
        size: encoded.stats.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(statsBuf, 0, encoded.stats);

    // Sets buffer
    setsBuf = device.createBuffer({
        size: encoded.sets.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(setsBuf, 0, encoded.sets);

    // Kind/id buffer (for constraints / filtering)
    const kindArr = new Int32Array(encoded.count);
    for (let i = 0; i < encoded.count; i++) {
        kindArr[i] = echoes[i]?.id ?? -1;
    }
    kindBuf = device.createBuffer({
        size: kindArr.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(kindBuf, 0, kindArr);

    // Main echo buffs
    const mainArr = buildMainEchoBuffsArray(
        Array.from({ length: encoded.count }, (_, i) => i),
        echoes,
        charId
    );

    mainBuffsBuf = device.createBuffer({
        size: mainArr.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(mainBuffsBuf, 0, mainArr);

    // Default constraints buffer
    defaultConstraintBuf = device.createBuffer({
        size: defaultConstraints.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(defaultConstraintBuf, 0, defaultConstraints);
}

async function readCandidates(device, candidateBuf, candidateCount, reuse) {
    const byteSize = candidateCount * 8; // Candidate = 8 bytes

    let readBuffer = reuse.buffer;
    let size = reuse.size;

    if (!readBuffer || size < byteSize) {
        if (readBuffer) readBuffer.destroy();
        readBuffer = device.createBuffer({
            size: byteSize,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
        });
        size = byteSize;
    }

    const encoder = device.createCommandEncoder();
    encoder.copyBufferToBuffer(candidateBuf, 0, readBuffer, 0, byteSize);
    device.queue.submit([encoder.finish()]);

    await readBuffer.mapAsync(GPUMapMode.READ);
    const ab = readBuffer.getMappedRange();
    const f32 = new Float32Array(ab);
    const u32 = new Uint32Array(ab);

    const out = [];
    for (let i = 0; i < candidateCount; i++) {
        const base = i * 2;
        const dmg = f32[base];
        if (dmg <= 0) continue;

        const packed = u32[base + 1];
        const mainPos = packed >>> 29;
        const index = packed & 0x1fffffff;
        out.push({ dmg, index, mainPos });
    }

    readBuffer.unmap();
    return { out, reuse: { buffer: readBuffer, size } };
}

self.onmessage = async (e) => {
    const msg = e.data;

    if (msg.type === "cancel") {
        CANCEL = true;
        return;
    }

    if (msg.type === "init") {
        CANCEL = false;
        try {
            await initStatic(msg.encoded, msg.echoes, msg.charId);
            self.postMessage({ type: "ready" });
        } catch (err) {
            self.postMessage({ type: "workerError", error: err?.message ?? String(err) });
        }
        return;
    }

    if (msg.type !== "run") return;

    // IMPORTANT: always resolve job promises with a type:"done" message
    if (CANCEL) {
        self.postMessage({ type: "done", cancelled: true, topK: [] });
        return;
    }

    try {
        const combos = new Int32Array(msg.combosBuf, msg.combosOffset ?? 0, msg.combosLen);
        const packed = new Float32Array(msg.ctxBuf, msg.ctxOffset ?? 0, msg.ctxLen);
        const comboCount = (combos.length / 5) | 0;
        const constraints = msg.encodedConstraints;

        const combosPerWorkgroup = WORKGROUP_SIZE * CYCLES_PER_INVOCATION;
        const workgroupsTotal = Math.ceil(comboCount / combosPerWorkgroup);
        const candidateCount = workgroupsTotal * REDUCE_K;

        // Candidates buffer (STORAGE | COPY_SRC)
        {
            const res = ensureStorageBuffer(
                candBuf,
                candBufSize,
                candidateCount * 8,
                GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
            );
            candBuf = res.buffer;
            candBufSize = res.size;
        }

        // Combos buffer (STORAGE | COPY_DST)
        {
            const neededSize = combos.byteLength;
            const res = ensureStorageBuffer(
                combosBuf,
                combosBufSize,
                neededSize,
                GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
            );
            combosBuf = res.buffer;
            combosBufSize = res.size;

            device.queue.writeBuffer(combosBuf, 0, combos);
        }

        // Context buffer (UNIFORM | COPY_DST)
        {
            const neededSize = packed.byteLength;
            const res = ensureStorageBuffer(
                ctxBuf,
                ctxBufSize,
                neededSize,
                GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
            );
            ctxBuf = res.buffer;
            ctxBufSize = res.size;

            device.queue.writeBuffer(ctxBuf, 0, packed);
        }

        // Constraints buffer (UNIFORM | COPY_DST) or default
        if (constraints) {
            const neededSize = constraints.byteLength;
            const res = ensureStorageBuffer(
                constraintBuf,
                constraintBufSize,
                neededSize,
                GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
            );
            constraintBuf = res.buffer;
            constraintBufSize = res.size;
            device.queue.writeBuffer(constraintBuf, 0, constraints);
        } else {
            constraintBuf = defaultConstraintBuf;
        }

        // Bind group (must include binding 9 = candidates)
        const group = getBindGroup({
            echoStats: statsBuf,
            echoSets: setsBuf,
            combos: combosBuf,
            context: ctxBuf,
            mainEchoBuffs: mainBuffsBuf,
            statConstraints: constraintBuf,
            echoKindIds: kindBuf,
            candidates: candBuf,
        });

        // Main compute pass (includes reduction)
        await runEchoGpuPipeline({
            device,
            pipeline: pipelineMain,
            bindGroup: group,
            comboCount,
        });

        const { out: cand, reuse } = await readCandidates(
            device,
            candBuf,
            workgroupsTotal * REDUCE_K,
            candReadback
        );
        candReadback = reuse;

        // Build topK from candidates
        cand.sort((a, b) => b.dmg - a.dmg);

        const bestBySet = new Map();

        for (const { dmg, index, mainPos } of cand) {
            if (bestBySet.size >= msg.resultsLimit * 8) break;

            const base = index * 5;
            const ids = new Array(5);
            ids[0] = combos[base + mainPos];
            let outPos = 1;
            for (let j = 0; j < 5; j++) {
                if (j === mainPos) continue;
                ids[outPos] = combos[base + j];
                outPos++;
            }

            const key = ids.slice().sort((x, y) => x - y).join(",");
            const prev = bestBySet.get(key);
            if (!prev || dmg > prev.dmg) bestBySet.set(key, { dmg, ids });
        }

        const topK = [...bestBySet.values()]
            .sort((a, b) => b.dmg - a.dmg)
            .slice(0, msg.resultsLimit);

        self.postMessage({ type: "done", cancelled: false, topK });
    } catch (err) {
        self.postMessage({ type: "workerError", error: err?.message ?? String(err) });
    }
};
