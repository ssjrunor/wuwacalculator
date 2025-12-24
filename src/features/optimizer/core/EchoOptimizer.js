import {runEchoOptimizer} from "./runEchoOptimizer.js";
import {generateEchoContext} from "./echoOptimizerContext.js";
import {cancelWorkers, initWorkerPool, resetCancel, resetWorkerPool,} from "./worker/OptimizerWorkerPool.js";
import {
    generateEchoCombinationBatches,
    generateEchoPermutationBatches2
} from "./generateEchoCombos.js";
import {
    buildEchoKindIdArray,
    buildMainEchoBuffsArray,
    buildStatConstraintArray,
    encodeEchoStats
} from "./encodeEchoStats.js";
import {prepareGpuContext} from "./prepareGpuContext.js";
import {
    ECHO_OPTIMIZER_BATCH_SIZE_CAP,
    ECHO_OPTIMIZER_JOB_TARGET_COMBOS_CPU,
    ECHO_OPTIMIZER_JOB_TARGET_COMBOS_GPU,
    ECHO_OPTIMIZER_MAX_COST,
    ECHO_OPTIMIZER_MAX_SIZE
} from "./optimizerConfig.js";

let CANCEL = false;
export let ctxObj = {};
const encodedCacheByKey = new Map();
const ENCODED_CACHE_MAX = 3;
let encodedCacheRef = {
    echoesRef: null,
    charId: null,
    entry: null,
};

function getEchoesCacheKey(echoes, charId) {
    const parts = new Array(echoes.length);
    for (let i = 0; i < echoes.length; i++) {
        const e = echoes[i];
        parts[i] = e?.uid ?? e?.id ?? "";
    }
    return `${charId}|${parts.join("|")}`;
}

function getCachedEncoded(echoes, charId) {
    if (encodedCacheRef.echoesRef === echoes && encodedCacheRef.charId === charId) {
        return encodedCacheRef.entry;
    }

    const key = getEchoesCacheKey(echoes, charId);
    const cached = encodedCacheByKey.get(key) ?? null;
    if (cached) {
        encodedCacheByKey.delete(key);
        encodedCacheByKey.set(key, cached);
    }
    encodedCacheRef = {
        echoesRef: echoes,
        charId,
        entry: cached,
    };
    return cached;
}

function setCachedEncoded(echoes, charId, entry) {
    const key = getEchoesCacheKey(echoes, charId);
    if (encodedCacheByKey.has(key)) {
        encodedCacheByKey.delete(key);
    }
    encodedCacheByKey.set(key, entry);
    if (encodedCacheByKey.size > ENCODED_CACHE_MAX) {
        const firstKey = encodedCacheByKey.keys().next().value;
        encodedCacheByKey.delete(firstKey);
    }
    encodedCacheRef = {
        echoesRef: echoes,
        charId,
        entry,
    };
}

export const EchoOptimizer = {
    cancel() {
        CANCEL = true;
        cancelWorkers();
    },

    async optimize(form) {
        CANCEL = false;
        resetCancel();
        resetWorkerPool();

        const filtered = form.filtered;
        if (!filtered || !filtered.length) {
            return [];
        }

        const enableGpu = form.enableGpu ?? true;
        const backend = enableGpu ? "gpu" : "cpu";
        const targetCombosPerJob = enableGpu
            ? ECHO_OPTIMIZER_JOB_TARGET_COMBOS_GPU
            : ECHO_OPTIMIZER_JOB_TARGET_COMBOS_CPU;

        ctxObj = prepareGpuContext(generateEchoContext(form));

        let entry = getCachedEncoded(filtered, form.charId);
        if (!entry) {
            const encoded = encodeEchoStats(filtered);
            const mainEchoBuffs = buildMainEchoBuffsArray(
                Array.from({ length: encoded.count }, (_, i) => i),
                filtered,
                form.charId
            );
            const echoKindIds = buildEchoKindIdArray(filtered);
            entry = { encoded, mainEchoBuffs, echoKindIds };
            setCachedEncoded(filtered, form.charId, entry);
        }

        const { encoded, mainEchoBuffs, echoKindIds } = entry;

        const lockedRequested = form.lockedEchoId != null;
        const lockedIndex = !lockedRequested
            ? -1
            : filtered.findIndex(e => e.id === form.lockedEchoId);
        if (lockedRequested && lockedIndex === -1) {
            return [];
        }
        const mainFactor = lockedIndex === -1 ? 5 : 1;
        const batchSize = Math.min(
            Math.ceil(form.combinations / mainFactor),
            ECHO_OPTIMIZER_BATCH_SIZE_CAP,
            targetCombosPerJob
        );

        if (form.onBatchSize) {
            form.onBatchSize(batchSize);
        }

        if (form.onContext) {
            form.onContext(ctxObj);
        }

        const batchGen = lockedIndex === -1
            ? generateEchoCombinationBatches({
                echoes: filtered,
                maxCost: ECHO_OPTIMIZER_MAX_COST,
                maxSize: ECHO_OPTIMIZER_MAX_SIZE,
                batchSize,
                lockedEchoId: null,
            })
            : generateEchoPermutationBatches2({
            echoes: filtered,
            maxCost: ECHO_OPTIMIZER_MAX_COST,
            maxSize: ECHO_OPTIMIZER_MAX_SIZE,
                batchSize,
                lockedEchoId: form.lockedEchoId,
        });

        const statConstraints = buildStatConstraintArray(form.constraints);

        await initWorkerPool({
            encoded,
            mainEchoBuffs,
            echoKindIds,
            backend
        });

        return await runEchoOptimizer({
            echoes: filtered,
            comboBatchGenerator: batchGen,
            resultsLimit: form.resultsLimit,
            onProgress: form.onProgress,
            combinations: form.combinations,
            ctxObj,
            charId: form.charId,
            encodedConstraints: statConstraints,
            mainFactor,
            lockedIndex,
            targetCombosPerJob,
            mergeBatches: enableGpu,
        });
    }
};

function tuneBatchSize(ctxObj, combinations) {
    return Math.min(combinations, ECHO_OPTIMIZER_BATCH_SIZE_CAP);
}
