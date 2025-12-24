// workers/OptimizerWorker.js

import { createBindGroup, createBindGroupLayout, createPipeline } from "../gpu/createPipeline.js";
import { runEchoGpuPipeline } from "../gpu/runPipeline.js";
import { getGpuDevice } from "../gpu/getDevice.js";
import { computeDamageForCombo } from "../cpu/computeDamage.js";
import { createCpuScratch } from "../cpu/scratch.js";
import {
    OPTIMIZER_CYCLES_PER_INVOCATION,
    OPTIMIZER_DEFAULT_CONSTRAINTS,
    OPTIMIZER_ECHOS_PER_COMBO,
    OPTIMIZER_REDUCE_K,
    OPTIMIZER_WORKGROUP_SIZE
} from "../optimizerConfig.js";

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
let backend = "gpu";
let activeConstraints = null;

let encodedData = null;
let mainEchoBuffs = null;
let echoKindIds = null;
let cpuScratch = null;

const defaultConstraints = OPTIMIZER_DEFAULT_CONSTRAINTS;

// Must match WGSL
const WORKGROUP_SIZE = OPTIMIZER_WORKGROUP_SIZE;
const CYCLES_PER_INVOCATION = OPTIMIZER_CYCLES_PER_INVOCATION;
const REDUCE_K = OPTIMIZER_REDUCE_K;

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

async function initGpu(encoded, mainEchoBuffsArray, echoKindIdsArray) {
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

    // Kind/id buffer
    kindBuf = device.createBuffer({
        size: echoKindIdsArray.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(kindBuf, 0, echoKindIdsArray);

    // Main echo buffs buffer
    mainBuffsBuf = device.createBuffer({
        size: mainEchoBuffsArray.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(mainBuffsBuf, 0, mainEchoBuffsArray);

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
            backend = msg.backend ?? "gpu";
            encodedData = msg.encoded;
            mainEchoBuffs = msg.mainEchoBuffs;
            echoKindIds = msg.echoKindIds;

            if (backend === "gpu") {
                await initGpu(encodedData, mainEchoBuffs, echoKindIds);
            } else {
                cpuScratch = createCpuScratch();
            }
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
        const comboCount = (combos.length / OPTIMIZER_ECHOS_PER_COMBO) | 0;
        if (msg.encodedConstraints) {
            activeConstraints = msg.encodedConstraints;
        }
        const constraints = activeConstraints ?? defaultConstraints;

        if (backend !== "gpu") {
            const bestBySet = new Map();

            for (let index = 0; index < comboCount; index++) {
                if (CANCEL) {
                    self.postMessage({ type: "done", cancelled: true, topK: [] });
                    return;
                }

                const { dmg, mainPos } = computeDamageForCombo({
                    index,
                    combos,
                    packedContext: packed,
                    encoded: encodedData,
                    mainEchoBuffs,
                    echoKindIds,
                    statConstraints: constraints,
                    scratch: cpuScratch,
                });

                if (dmg <= 0) continue;

                const base = index * OPTIMIZER_ECHOS_PER_COMBO;
                const mainId = combos[base + mainPos];
                let a;
                let b;
                let c;
                let d;
                switch (mainPos) {
                    case 0:
                        a = combos[base + 1];
                        b = combos[base + 2];
                        c = combos[base + 3];
                        d = combos[base + 4];
                        break;
                    case 1:
                        a = combos[base + 0];
                        b = combos[base + 2];
                        c = combos[base + 3];
                        d = combos[base + 4];
                        break;
                    case 2:
                        a = combos[base + 0];
                        b = combos[base + 1];
                        c = combos[base + 3];
                        d = combos[base + 4];
                        break;
                    case 3:
                        a = combos[base + 0];
                        b = combos[base + 1];
                        c = combos[base + 2];
                        d = combos[base + 4];
                        break;
                    default:
                        a = combos[base + 0];
                        b = combos[base + 1];
                        c = combos[base + 2];
                        d = combos[base + 3];
                        break;
                }
                const key = makeSortedKey5BigInt(mainId, a, b, c, d);
                const prev = bestBySet.get(key);
                if (!prev || dmg > prev.dmg) {
                    const ids = buildIds(mainId, a, b, c, d);
                    bestBySet.set(key, { dmg, ids });
                }
            }

            const topK = [...bestBySet.values()]
                .sort((a, b) => b.dmg - a.dmg)
                .slice(0, msg.resultsLimit);

            self.postMessage({ type: "done", cancelled: false, topK });
            return;
        }

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

            const base = index * OPTIMIZER_ECHOS_PER_COMBO;
            const mainId = combos[base + mainPos];
            let a;
            let b;
            let c;
            let d;
            switch (mainPos) {
                case 0:
                    a = combos[base + 1];
                    b = combos[base + 2];
                    c = combos[base + 3];
                    d = combos[base + 4];
                    break;
                case 1:
                    a = combos[base + 0];
                    b = combos[base + 2];
                    c = combos[base + 3];
                    d = combos[base + 4];
                    break;
                case 2:
                    a = combos[base + 0];
                    b = combos[base + 1];
                    c = combos[base + 3];
                    d = combos[base + 4];
                    break;
                case 3:
                    a = combos[base + 0];
                    b = combos[base + 1];
                    c = combos[base + 2];
                    d = combos[base + 4];
                    break;
                default:
                    a = combos[base + 0];
                    b = combos[base + 1];
                    c = combos[base + 2];
                    d = combos[base + 3];
                    break;
            }
            const key = makeSortedKey5BigInt(mainId, a, b, c, d);
            const prev = bestBySet.get(key);
            if (!prev || dmg > prev.dmg) {
                const ids = buildIds(mainId, a, b, c, d);
                bestBySet.set(key, { dmg, ids });
            }
        }

        const topK = [...bestBySet.values()]
            .sort((a, b) => b.dmg - a.dmg)
            .slice(0, msg.resultsLimit);

        self.postMessage({ type: "done", cancelled: false, topK });
    } catch (err) {
        self.postMessage({ type: "workerError", error: err?.message ?? String(err) });
    }
};

function buildIds(mainId, a, b, c, d) {
    return [mainId, a, b, c, d];
}

function makeSortedKey5BigInt(a, b, c, d, e) {
    if (a > b) [a, b] = [b, a];
    if (c > d) [c, d] = [d, c];
    if (a > c) [a, c] = [c, a];
    if (b > d) [b, d] = [d, b];
    if (b > c) [b, c] = [c, b];
    let e0 = e;
    if (e0 < b) {
        if (e0 < a) {
            return packKey(e0, a, b, c, d);
        }
        return packKey(a, e0, b, c, d);
    }
    if (e0 < d) {
        if (e0 < c) {
            return packKey(a, b, e0, c, d);
        }
        return packKey(a, b, c, e0, d);
    }
    return packKey(a, b, c, d, e0);
}

function packKey(a, b, c, d, e) {
    const A = BigInt(a >>> 0);
    const B = BigInt(b >>> 0);
    const C = BigInt(c >>> 0);
    const D = BigInt(d >>> 0);
    const E = BigInt(e >>> 0);
    return (((((A << 32n) | B) << 32n | C) << 32n | D) << 32n) | E;
}
