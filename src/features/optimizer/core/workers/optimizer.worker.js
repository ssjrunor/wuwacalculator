import {
    createBindGroup,
    createBindGroupLayout,
    createPipeline,
    createReduceBindGroup,
    createReducePipeline,
    createRotationBindGroup,
    createRotationBindGroupLayout,
    createRotationPipeline
} from "../gpu/createPipeline.js";
import { runEchoGpuPipeline } from "../gpu/runPipeline.js";
import { getGpuDevice } from "../gpu/getDevice.js";
import { computeDamageForCombo } from "../cpu/computeDamage.js";
import { createCpuScratch } from "../cpu/scratch.js";
import { unrankCombinadic } from "../combos/combinadic.js";
import {
    OPTIMIZER_CYCLES_PER_INVOCATION,
    OPTIMIZER_DEFAULT_CONSTRAINTS,
    OPTIMIZER_ECHOS_PER_COMBO,
    OPTIMIZER_ROTATION_CYCLES_PER_INVOCATION,
    OPTIMIZER_ROTATION_REDUCE_K,
    OPTIMIZER_ROTATION_WORKGROUP_SIZE,
    OPTIMIZER_REDUCE_K,
    OPTIMIZER_ENABLE_TIMING_LOGS,
    OPTIMIZER_WORKGROUP_SIZE, makeSortedKey5BigInt,
} from "../misc/index.js";

let device = null;
let layout = null;
let pipelineMain = null;
let rotationLayout = null;
let pipelineRotation = null;
let pipelineReduce = null;
let reduceLayout = null;

let statsBuf = null;
let setsBuf = null;
let mainBuffsBuf = null;
let defaultConstraintBuf = null;

let ctxBuf = null;
let ctxBufSize = 0;

let constraintBuf = null;
let constraintBufSize = 0;

let kindBuf = null;
let comboIndexMapBuf = null;
let comboBinomBuf = null;
let echoCostsBuf = null;

let candBuf = null;
let candBufSize = 0;
let candReduceBuf = null;
let candReduceBufSize = 0;
let reduceParamsBuf = null;
let rotationCtxBuf = null;
let rotationCtxBufSize = 0;
let rotationWeightsBuf = null;
let rotationWeightsBufSize = 0;
let rotationMetaBuf = null;

let bindGroup = null;
let bindGroupBuffers = null;
let rotationBindGroup = null;
let rotationBindGroupBuffers = null;

// Reusable MAP_READ buffer for candidate readback
let candReadback = { buffer: null, size: 0 };

let CANCEL = false;
let backend = "gpu";
let activeConstraints = null;

let encodedData = null;
let mainEchoBuffs = null;
let echoKindIds = null;
let comboIndexing = null;
let cpuScratch = null;
let rotationCtxCount = 0;
let rotationCtxLen = 0;

// CPU rotation context storage
let cpuRotationContexts = null;  // Array of Float32Array packed contexts
let cpuRotationWeights = null;   // Float32Array of weights

const defaultConstraints = OPTIMIZER_DEFAULT_CONSTRAINTS;

// Must match WGSL
const WORKGROUP_SIZE = OPTIMIZER_WORKGROUP_SIZE;
const CYCLES_PER_INVOCATION = OPTIMIZER_CYCLES_PER_INVOCATION;
const REDUCE_K = OPTIMIZER_REDUCE_K;
const ROTATION_WORKGROUP_SIZE = OPTIMIZER_ROTATION_WORKGROUP_SIZE;
const ROTATION_CYCLES_PER_INVOCATION = OPTIMIZER_ROTATION_CYCLES_PER_INVOCATION;
const ROTATION_REDUCE_K = OPTIMIZER_ROTATION_REDUCE_K;

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

function getRotationBindGroup(buffers) {
    if (!rotationBindGroupBuffers) {
        rotationBindGroup = createRotationBindGroup(device, rotationLayout, buffers);
        rotationBindGroupBuffers = { ...buffers };
        return rotationBindGroup;
    }

    const keys = Object.keys(buffers);
    for (const key of keys) {
        if (rotationBindGroupBuffers[key] !== buffers[key]) {
            rotationBindGroup = createRotationBindGroup(device, rotationLayout, buffers);
            rotationBindGroupBuffers = { ...buffers };
            break;
        }
    }

    return rotationBindGroup;
}

async function initGpu(encoded, mainEchoBuffsArray, echoKindIdsArray, comboIndexingData) {
    device = await getGpuDevice();
    layout = createBindGroupLayout(device);
    rotationLayout = createRotationBindGroupLayout(device);
    bindGroup = null;
    bindGroupBuffers = null;
    rotationBindGroup = null;
    rotationBindGroupBuffers = null;

    pipelineMain = createPipeline(device, layout, "main");
    pipelineRotation = createRotationPipeline(device, rotationLayout, "mainRotation");
    const reduce = createReducePipeline(device);
    pipelineReduce = reduce.pipeline;
    reduceLayout = reduce.layout;

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

    // Echo costs buffer
    echoCostsBuf = device.createBuffer({
        size: encoded.costs.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(echoCostsBuf, 0, encoded.costs);

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

    if (comboIndexingData) {
        comboIndexMapBuf = device.createBuffer({
            size: comboIndexingData.indexMap.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });
        device.queue.writeBuffer(comboIndexMapBuf, 0, comboIndexingData.indexMap);

        comboBinomBuf = device.createBuffer({
            size: comboIndexingData.binom.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });
        device.queue.writeBuffer(comboBinomBuf, 0, comboIndexingData.binom);
    }
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

// beginReadCandidates removed; using readCandidates directly.

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
            comboIndexing = msg.comboIndexing ?? null;

            if (backend === "gpu") {
                await initGpu(encodedData, mainEchoBuffs, echoKindIds, comboIndexing);
            } else {
                cpuScratch = createCpuScratch();
            }
            self.postMessage({ type: "ready" });
        } catch (err) {
            self.postMessage({ type: "workerError", error: err?.message ?? String(err) });
        }
        return;
    }

    if (msg.type === "setLockedIndex") {
        if (backend !== "gpu") return;
        if (!comboIndexing || !comboIndexMapBuf || !encodedData) return;

        const lockedIndex = msg.lockedIndex ?? -1;
        const n = encodedData.count ?? 0;
        if (!n || lockedIndex < 0 || lockedIndex >= n) return;

        const indexMap = new Int32Array(n - 1);
        let cursor = 0;
        for (let i = 0; i < n; i++) {
            if (i === lockedIndex) continue;
            indexMap[cursor++] = i;
        }

        comboIndexing = {
            ...comboIndexing,
            lockedIndex,
            comboN: indexMap.length,
            indexMap,
        };

        device.queue.writeBuffer(comboIndexMapBuf, 0, indexMap);
        return;
    }

    if (msg.type === "setRotationContext") {
        const packedContexts = new Float32Array(msg.ctxsBuf, msg.ctxsOffset ?? 0, msg.ctxsLen);
        const weights = new Float32Array(msg.weightsBuf, msg.weightsOffset ?? 0, msg.weightsLen);
        const ctxLen = msg.ctxLen ?? 0;
        const ctxCount = msg.ctxCount ?? 0;

        if (!ctxLen || !ctxCount) return;

        // Store for CPU (as array of sliced contexts)
        cpuRotationContexts = [];
        for (let i = 0; i < ctxCount; i++) {
            cpuRotationContexts.push(packedContexts.slice(i * ctxLen, (i + 1) * ctxLen));
        }
        cpuRotationWeights = weights.slice(0, ctxCount);
        rotationCtxCount = ctxCount;
        rotationCtxLen = ctxLen;

        // GPU-specific buffer setup
        if (backend === "gpu") {
            {
                const neededSize = packedContexts.byteLength;
                const res = ensureStorageBuffer(
                    rotationCtxBuf,
                    rotationCtxBufSize,
                    neededSize,
                    GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
                );
                rotationCtxBuf = res.buffer;
                rotationCtxBufSize = res.size;
                device.queue.writeBuffer(rotationCtxBuf, 0, packedContexts);
            }

            {
                const neededSize = weights.byteLength;
                const res = ensureStorageBuffer(
                    rotationWeightsBuf,
                    rotationWeightsBufSize,
                    neededSize,
                    GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
                );
                rotationWeightsBuf = res.buffer;
                rotationWeightsBufSize = res.size;
                device.queue.writeBuffer(rotationWeightsBuf, 0, weights);
            }

            if (!rotationMetaBuf) {
                rotationMetaBuf = device.createBuffer({
                    size: 16,
                    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
                });
            }
            device.queue.writeBuffer(rotationMetaBuf, 0, new Uint32Array([ctxCount, ctxLen, 0, 0]));
        }
        return;
    }

    if (msg.type === "runRotation") {
        // IMPORTANT: always resolve job promises with a type:"done" message
        if (CANCEL) {
            self.postMessage({ type: "done", cancelled: true, topK: [] });
            return;
        }

        // CPU batch path for rotation
        if (backend !== "gpu" || msg.useBatch) {
            if (!cpuRotationContexts?.length) {
                self.postMessage({ type: "workerError", error: "Missing rotation contexts for CPU." });
                return;
            }

            try {
                const combos = new Int32Array(msg.combosBuf, msg.combosOffset ?? 0, msg.combosLen);
                const cpuComboCount = (combos.length / OPTIMIZER_ECHOS_PER_COMBO) | 0;
                const constraints = activeConstraints ?? defaultConstraints;
                const bestBySet = new Map();

                for (let index = 0; index < cpuComboCount; index++) {
                    if (CANCEL) {
                        self.postMessage({ type: "done", cancelled: true, topK: [] });
                        return;
                    }

                    // Sum weighted damage across all rotation contexts
                    let totalDmg = 0;
                    let bestMainPos = 0;
                    let bestSingleDmg = 0;

                    for (let c = 0; c < cpuRotationContexts.length; c++) {
                        const { dmg, mainPos } = computeDamageForCombo({
                            index,
                            combos,
                            packedContext: cpuRotationContexts[c],
                            encoded: encodedData,
                            mainEchoBuffs,
                            echoKindIds,
                            statConstraints: constraints,
                            scratch: cpuScratch,
                        });
                        totalDmg += dmg * (cpuRotationWeights[c] ?? 1);
                        if (dmg > bestSingleDmg) {
                            bestSingleDmg = dmg;
                            bestMainPos = mainPos;
                        }
                    }

                    if (totalDmg <= 0) continue;

                    // Dedup & track best
                    const base = index * OPTIMIZER_ECHOS_PER_COMBO;
                    const ids = [combos[base], combos[base + 1], combos[base + 2], combos[base + 3], combos[base + 4]];
                    const { mainId, a, b, c: c2, d } = extractMainAndRest(ids, bestMainPos);
                    const key = makeSortedKey5BigInt(mainId, a, b, c2, d);

                    const prev = bestBySet.get(key);
                    if (!prev || totalDmg > prev.dmg) {
                        bestBySet.set(key, { dmg: totalDmg, ids: [mainId, a, b, c2, d] });
                    }
                }

                const topK = [...bestBySet.values()]
                    .sort((a, b) => b.dmg - a.dmg)
                    .slice(0, msg.resultsLimit);

                self.postMessage({ type: "done", cancelled: false, topK });
                return;
            } catch (err) {
                self.postMessage({ type: "workerError", error: err?.message ?? String(err) });
                return;
            }
        }

        // GPU indexed path for rotation
        if (!comboIndexing) {
            self.postMessage({ type: "workerError", error: "Missing combo indexing data." });
            return;
        }

        try {
            if (msg.encodedConstraints) {
                activeConstraints = msg.encodedConstraints;
            }
            const constraints = activeConstraints ?? defaultConstraints;

            const packed = new Float32Array(msg.paramsBuf, msg.paramsOffset ?? 0, msg.paramsLen);
            const ctxLen   = msg.rotationCtxLen ?? msg.ctxLen ?? 0;
            const ctxCount = msg.rotationCtxCount ?? msg.ctxCount ?? 0;
            const comboCount = msg.comboCount ?? 0;
            const comboBaseIndex = msg.comboBaseIndex ?? 0;
            if (!ctxLen || !ctxCount) {
                self.postMessage({ type: "done", cancelled: false, topK: [] });
                return;
            }

            const combosPerWorkgroup = ROTATION_WORKGROUP_SIZE * ROTATION_CYCLES_PER_INVOCATION;
            const workgroupsTotal = Math.ceil(comboCount / combosPerWorkgroup);
            const candidateCount = workgroupsTotal * ROTATION_REDUCE_K;

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

            if (!rotationCtxBuf || rotationCtxCount !== ctxCount || rotationCtxLen !== ctxLen) {
                self.postMessage({ type: "workerError", error: "Missing rotation context buffers." });
                return;
            }

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

            const group = getRotationBindGroup({
                echoStats: statsBuf,
                echoSets: setsBuf,
                comboIndexMap: comboIndexMapBuf,
                context: ctxBuf,
                mainEchoBuffs: mainBuffsBuf,
                statConstraints: constraintBuf,
                echoKindIds: kindBuf,
                candidates: candBuf,
                comboBinom: comboBinomBuf,
                echoCosts: echoCostsBuf,
                rotationContexts: rotationCtxBuf,
                rotationWeights: rotationWeightsBuf,
                rotationMeta: rotationMetaBuf,
            });

            await runEchoGpuPipeline({
                device,
                pipeline: pipelineRotation,
                bindGroup: group,
                comboCount,
                workgroupSize: ROTATION_WORKGROUP_SIZE,
                cyclesPerInvocation: ROTATION_CYCLES_PER_INVOCATION,
            });

            const initialCandCount = workgroupsTotal * ROTATION_REDUCE_K;
            const reduced = await runReducePassIfNeeded(candBuf, initialCandCount, ROTATION_REDUCE_K);

            const { out: cand, reuse } = await readCandidates(
                device,
                reduced.buffer,
                reduced.count,
                candReadback
            );
            candReadback = reuse;

            const topK = processCandidatesToTopK(cand, comboBaseIndex, comboIndexing, msg.resultsLimit);

            self.postMessage({ type: "done", cancelled: false, topK });
            return;
        } catch (err) {
            self.postMessage({ type: "workerError", error: err?.message ?? String(err) });
            return;
        }
    }

    if (msg.type !== "run" && msg.type !== "runIndexed") return;

    // IMPORTANT: always resolve job promises with a type:"done" message
    if (CANCEL) {
        self.postMessage({ type: "done", cancelled: true, topK: [] });
        return;
    }

    try {
        const packed = new Float32Array(msg.ctxBuf, msg.ctxOffset ?? 0, msg.ctxLen);
        const comboCount = msg.comboCount ?? 0;
        const comboBaseIndex = msg.comboBaseIndex ?? 0;
        const tStart = OPTIMIZER_ENABLE_TIMING_LOGS ? performance.now() : 0;
        if (msg.encodedConstraints) {
            activeConstraints = msg.encodedConstraints;
        }
        const constraints = activeConstraints ?? defaultConstraints;

        if (backend !== "gpu") {
            const combos = new Int32Array(msg.combosBuf, msg.combosOffset ?? 0, msg.combosLen);
            const cpuComboCount = (combos.length / OPTIMIZER_ECHOS_PER_COMBO) | 0;
            const bestBySet = new Map();

            for (let index = 0; index < cpuComboCount; index++) {
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
                const ids = [combos[base], combos[base + 1], combos[base + 2], combos[base + 3], combos[base + 4]];
                const { mainId, a, b, c, d } = extractMainAndRest(ids, mainPos);

                const key = makeSortedKey5BigInt(mainId, a, b, c, d);
                const prev = bestBySet.get(key);
                if (!prev || dmg > prev.dmg) {
                    bestBySet.set(key, { dmg, ids: [mainId, a, b, c, d] });
                }
            }

            const topK = [...bestBySet.values()]
                .sort((a, b) => b.dmg - a.dmg)
                .slice(0, msg.resultsLimit);

            self.postMessage({ type: "done", cancelled: false, topK });
            return;
        }

        if (!comboIndexing) {
            self.postMessage({ type: "workerError", error: "Missing combo indexing data." });
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
            comboIndexMap: comboIndexMapBuf,
            context: ctxBuf,
            mainEchoBuffs: mainBuffsBuf,
            statConstraints: constraintBuf,
            echoKindIds: kindBuf,
            candidates: candBuf,
            comboBinom: comboBinomBuf,
            echoCosts: echoCostsBuf,
        });

        // Main compute pass (includes reduction)
        await runEchoGpuPipeline({
            device,
            pipeline: pipelineMain,
            bindGroup: group,
            comboCount,
        });
        const tComputeDone = OPTIMIZER_ENABLE_TIMING_LOGS ? performance.now() : 0;

        const initialCandCount = workgroupsTotal * REDUCE_K;
        const reduced = await runReducePassIfNeeded(candBuf, initialCandCount, REDUCE_K);

        const { out: cand, reuse } = await readCandidates(
            device,
            reduced.buffer,
            reduced.count,
            candReadback
        );
        candReadback = reuse;
        const tReadDone = OPTIMIZER_ENABLE_TIMING_LOGS ? performance.now() : 0;

        const topK = processCandidatesToTopK(cand, comboBaseIndex, comboIndexing, msg.resultsLimit);

        if (OPTIMIZER_ENABLE_TIMING_LOGS) {
            const tEnd = performance.now();
            console.log(
                `[optimizer-worker] gpu batch start=${comboBaseIndex.toLocaleString()} count=${comboCount.toLocaleString()} ` +
                `compute=${(tComputeDone - tStart).toFixed(2)}ms readback=${(tReadDone - tComputeDone).toFixed(2)}ms ` +
                `post=${(tEnd - tReadDone).toFixed(2)}ms total=${(tEnd - tStart).toFixed(2)}ms`
            );
        }

        self.postMessage({ type: "done", cancelled: false, topK });
    } catch (err) {
        self.postMessage({ type: "workerError", error: err?.message ?? String(err) });
    }
};

// Extract main echo and remaining 4 echoes based on mainPos
function extractMainAndRest(ids, mainPos) {
    const mainId = ids[mainPos];
    let a, b, c, d;
    switch (mainPos) {
        case 0: a = ids[1]; b = ids[2]; c = ids[3]; d = ids[4]; break;
        case 1: a = ids[0]; b = ids[2]; c = ids[3]; d = ids[4]; break;
        case 2: a = ids[0]; b = ids[1]; c = ids[3]; d = ids[4]; break;
        case 3: a = ids[0]; b = ids[1]; c = ids[2]; d = ids[4]; break;
        default: a = ids[0]; b = ids[1]; c = ids[2]; d = ids[3]; break;
    }
    return { mainId, a, b, c, d };
}

// Run reduce pass if needed, returns { buffer, count }
async function runReducePassIfNeeded(candBuf, candCount, reduceK) {
    if (candCount <= reduceK) {
        return { buffer: candBuf, count: candCount };
    }

    const reduceGroups = Math.ceil(candCount / 256);
    const reduceOutCount = reduceGroups * reduceK;
    const reduceOutBytes = reduceOutCount * 8;

    if (!candReduceBuf || candReduceBufSize < reduceOutBytes) {
        if (candReduceBuf) candReduceBuf.destroy();
        candReduceBuf = device.createBuffer({
            size: reduceOutBytes,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
        });
        candReduceBufSize = reduceOutBytes;
    }

    if (!reduceParamsBuf) {
        reduceParamsBuf = device.createBuffer({
            size: 16,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
    }
    device.queue.writeBuffer(reduceParamsBuf, 0, new Uint32Array([candCount, 0, 0, 0]));

    const reduceGroup = createReduceBindGroup(device, reduceLayout, {
        input: candBuf,
        output: candReduceBuf,
        params: reduceParamsBuf,
    });

    const encoder = device.createCommandEncoder();
    const pass = encoder.beginComputePass();
    pass.setPipeline(pipelineReduce);
    pass.setBindGroup(0, reduceGroup);
    pass.dispatchWorkgroups(reduceGroups);
    pass.end();
    device.queue.submit([encoder.finish()]);

    return { buffer: candReduceBuf, count: reduceOutCount };
}

// Process candidates into deduplicated topK results
function processCandidatesToTopK(cand, comboBaseIndex, comboIndexing, resultsLimit) {
    cand.sort((a, b) => b.dmg - a.dmg);

    const bestBySet = new Map();
    const maxCandidates = resultsLimit * REDUCE_K;

    for (const { dmg, index, mainPos } of cand) {
        if (bestBySet.size >= maxCandidates) break;

        const globalIndex = index + comboBaseIndex;
        const ids = unrankCombinadic(globalIndex, comboIndexing, OPTIMIZER_ECHOS_PER_COMBO);
        const { mainId, a, b, c, d } = extractMainAndRest(ids, mainPos);

        if (mainId == null || a == null || b == null || c == null || d == null) {
            continue;
        }

        const key = makeSortedKey5BigInt(mainId, a, b, c, d);
        const prev = bestBySet.get(key);
        if (!prev || dmg > prev.dmg) {
            bestBySet.set(key, { dmg, ids: [mainId, a, b, c, d] });
        }
    }

    return [...bestBySet.values()]
        .sort((a, b) => b.dmg - a.dmg)
        .slice(0, resultsLimit);
}
