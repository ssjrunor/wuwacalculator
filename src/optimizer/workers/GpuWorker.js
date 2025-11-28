import { createBindGroup, createPipeline, createBindGroupLayout } from "../gpu/createPipeline.js";
import { runEchoGpuPipeline, readResults } from "../gpu/runPipeline.js";
import { getGpuDevice } from "../gpu/getDevice.js";
import { buildMainEchoBuffsArray } from "../encodeEchoStats.js";

let device = null;
let layout = null;
let pipeline = null;

let statsBuf = null;
let costsBuf = null;
let setsBuf = null;
let mainBuffsBuf = null;
let defaultConstraintBuf = null;

// Reused per-run buffers
let combosBuf = null;
let combosBufSize = 0;

let ctxBuf = null;
let ctxBufSize = 0;

let outBuf = null;
let outBufSize = 0;

let constraintBuf = null;
let constraintBufSize = 0;
let kindBuf = null;

let CANCEL = false;

const defaultConstraints = new Float32Array([
    1, 0,  // atk
    1, 0,  // hp
    1, 0,  // def
    1, 0,  // critRate
    1, 0,  // critDmg
    1, 0,  // ER
    1, 0,  // dmgBonus
    1, 0,  // damage
]);

// Small helpers to ensure capacity
function ensureStorageBuffer(existing, existingSize, neededSize, usage) {
    if (!existing || existingSize < neededSize) {
        if (existing) {
            existing.destroy();
        }
        const buf = device.createBuffer({
            size: neededSize,
            usage
        });
        return { buffer: buf, size: neededSize };
    }
    return { buffer: existing, size: existingSize };
}

async function initStatic(encoded, echoes, charId) {
    try {
        device = await getGpuDevice();
        layout = createBindGroupLayout(device);
        pipeline = createPipeline(device, layout);

        // Stats buffer
        statsBuf = device.createBuffer({
            size: encoded.stats.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        });
        device.queue.writeBuffer(statsBuf, 0, encoded.stats);

        // Costs buffer
        costsBuf = device.createBuffer({
            size: encoded.costs.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        });
        device.queue.writeBuffer(costsBuf, 0, encoded.costs);

        // Sets buffer
        setsBuf = device.createBuffer({
            size: encoded.sets.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        });
        device.queue.writeBuffer(setsBuf, 0, encoded.sets);

        const kindArr = new Int32Array(encoded.count);
        for (let i = 0; i < encoded.count; i++) {
            kindArr[i] = echoes[i]?.id ?? -1;
        }
        kindBuf = device.createBuffer({
            size: kindArr.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
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
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        });
        device.queue.writeBuffer(mainBuffsBuf, 0, mainArr);

        defaultConstraintBuf = device.createBuffer({
            size: defaultConstraints.byteLength,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        device.queue.writeBuffer(defaultConstraintBuf, 0, defaultConstraints);

        self.postMessage({ type: "ready" });

    } catch (err) {
        self.postMessage({ type: "workerError", error: err.message });
    }
}

self.onmessage = async e => {
    const msg = e.data;

    if (msg.type === "cancel") {
        CANCEL = true;
        return;
    }

    if (msg.type === "init") {
        CANCEL = false;
        await initStatic(msg.encoded, msg.echoes, msg.charId);
        return;
    }

    if (msg.type === "run") {
        if (CANCEL) {
            self.postMessage({ cancelled: true });
            return;
        }

        try {
            const combos = msg.combos;  // Int32Array
            const packed = msg.packedContext;
            const comboCount = combos.length / 5;
            const constraints = msg.encodedConstraints; // Float32Array


            // Combos buffer (STORAGE)
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

            // Context buffer (UNIFORM)
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

            // Output buffer (STORAGE | COPY_SRC)
            {
                const neededSize = comboCount * 4; // 1 float (4 bytes) per combo
                const res = ensureStorageBuffer(
                    outBuf,
                    outBufSize,
                    neededSize,
                    GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
                );
                outBuf = res.buffer;
                outBufSize = res.size;
            }

            // Constraints buffer (UNIFORM)
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

            const group = createBindGroup(device, layout, {
                echoStats: statsBuf,
                echoCosts: costsBuf,
                echoSets: setsBuf,
                combos: combosBuf,
                context: ctxBuf,
                outputBuffer: outBuf,
                mainEchoBuffs: mainBuffsBuf,
                statConstraints: constraintBuf,
                echoKindIds: kindBuf
            });

            await runEchoGpuPipeline({
                device,
                pipeline,
                bindGroup: group,
                comboCount
            });

            let results = await readResults(device, outBuf, comboCount);

            // -------------------------------------------------------
            // Local top-K selection as before
            // -------------------------------------------------------
            if (comboCount <= msg.resultsLimit) {
                const topCombos = [];
                for (let i = 0; i < comboCount; i++) {
                    const dmg = results[i];
                    if (dmg <= 0) continue;

                    const base = i * 5;
                    topCombos.push({
                        dmg,
                        ids: [
                            combos[base],
                            combos[base + 1],
                            combos[base + 2],
                            combos[base + 3],
                            combos[base + 4],
                        ],
                    });
                }

                self.postMessage({ type: "done", topK: topCombos });
                return;
            }

            const K = 4;
            let localTop = [];

            for (let i = 0; i < comboCount; i++) {
                const dmg = results[i];

                if (localTop.length < K) {
                    localTop.push({ dmg, localIndex: i });
                    localTop.sort((a, b) => b.dmg - a.dmg);
                    continue;
                }

                if (dmg > localTop[K - 1].dmg) {
                    localTop[K - 1] = { dmg, localIndex: i };
                    localTop.sort((a, b) => b.dmg - a.dmg);
                }
            }

            const bestBySet = new Map();

            for (const entry of localTop) {
                const i = entry.localIndex;
                const dmg = entry.dmg;

                const base = i * 5;
                const ids = [
                    combos[base],
                    combos[base+1],
                    combos[base+2],
                    combos[base+3],
                    combos[base+4],
                ];

                const key = ids.slice().sort((a,b)=>a-b).join(',');

                const prev = bestBySet.get(key);
                if (!prev || dmg > prev.dmg) {
                    bestBySet.set(key, { dmg, ids });
                }
            }

            const topCombos = [...bestBySet.values()];

            results = null;

            self.postMessage({
                type: "done",
                topK: topCombos
            });

            localTop.length = 0;

            await device.queue.onSubmittedWorkDone();

        } catch (err) {
            self.postMessage({ type: "workerError", error: err.message });
        }
    }
};