import {runEchoOptimizer} from "./run.js";
import {runRotationOptimizer} from "./rotationOptimizer.js";
import {generateEchoContext} from "../context/echoContext.js";
import {cancelWorkers, initWorkerPool, resetCancel, resetWorkerPool,} from "../workers/pool.js";
import {generateEchoCombinationBatches} from "../combos/batches.js";
import {
    buildEchoKindIdArray,
    buildMainEchoBuffsArray,
    buildStatConstraintArray,
    ECHO_OPTIMIZER_BATCH_SIZE_CAP,
    ECHO_OPTIMIZER_JOB_TARGET_COMBOS_CPU,
    ECHO_OPTIMIZER_JOB_TARGET_COMBOS_GPU,
    ECHO_OPTIMIZER_MAX_COST,
    ECHO_OPTIMIZER_MAX_SIZE,
    encodeEchoStats,
    resolveLockedEcho,
} from "../misc/index.js";
import {prepareGpuContext} from "../context/gpuContext.js";
import {buildCombinadicIndexing} from "../combos/combinadic.js";

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

        // Shared setup for both modes
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

        const { lockedRequested, lockedIndices, lockedIndex, runCount, notFound } =
            resolveLockedEcho(form.lockedEchoId, filtered);
        if (notFound) return [];

        const statConstraints = buildStatConstraintArray(form.constraints);

        const comboIndexing = buildCombinadicIndexing({
            echoes: filtered,
            maxSize: ECHO_OPTIMIZER_MAX_SIZE,
            lockedEchoIndex: lockedRequested ? lockedIndex : null,
            lockedEchoId: lockedRequested ? form.lockedEchoId : null,
        });
        const comboCountPerRun = comboIndexing?.totalCombos ?? 0;
        if (comboCountPerRun <= 0) return [];

        const mainFactor = lockedRequested ? 1 : 5;
        const enableGpu = form.enableGpu ?? true;
        const backend = enableGpu ? "gpu" : "cpu";

        // Handle rotation mode
        if (form.rotationMode) {
            const batchSize = Math.min(
                Math.ceil(form.combinations / (mainFactor * runCount)),
                ECHO_OPTIMIZER_BATCH_SIZE_CAP,
                enableGpu ? ECHO_OPTIMIZER_JOB_TARGET_COMBOS_GPU : ECHO_OPTIMIZER_JOB_TARGET_COMBOS_CPU
            );

            const comboBatchGeneratorFactory = !enableGpu
                ? (runLockedIndex) => generateEchoCombinationBatches({
                    echoes: filtered,
                    maxCost: ECHO_OPTIMIZER_MAX_COST,
                    maxSize: ECHO_OPTIMIZER_MAX_SIZE,
                    batchSize,
                    lockedEchoIndex: runLockedIndex,
                    lockedEchoId: null,
                })
                : null;

            return await runRotationOptimizer({
                form,
                echoes: filtered,
                encoded,
                mainEchoBuffs,
                echoKindIds,
                comboIndexing,
                lockedIndices,
                lockedIndex,
                runCount,
                mainFactor,
                statConstraints: null,
                rotationEntries: form.rotationEntries,
                skillResults: form.skillResults,
                allSkillLevels: form.allSkillLevels,
                resultsLimit: form.resultsLimit,
                combinations: form.combinations,
                onProgress: form.onProgress,
                onContext: form.onContext,
                backend,
                comboBatchGeneratorFactory,
            });
        }

        // Normal mode setup
        const targetCombosPerJob = enableGpu
            ? ECHO_OPTIMIZER_JOB_TARGET_COMBOS_GPU
            : ECHO_OPTIMIZER_JOB_TARGET_COMBOS_CPU;

        ctxObj = prepareGpuContext(generateEchoContext(form));

        const batchSize = Math.min(
            Math.ceil(form.combinations / (mainFactor * runCount)),
            ECHO_OPTIMIZER_BATCH_SIZE_CAP,
            targetCombosPerJob
        );

        if (form.onBatchSize) {
            form.onBatchSize(batchSize);
        }

        if (form.onContext) {
            form.onContext(ctxObj);
        }

        const comboBatchGeneratorFactory = !enableGpu
            ? (runLockedIndex) => generateEchoCombinationBatches({
                echoes: filtered,
                maxCost: ECHO_OPTIMIZER_MAX_COST,
                maxSize: ECHO_OPTIMIZER_MAX_SIZE,
                batchSize,
                lockedEchoIndex: runLockedIndex,
                lockedEchoId: null,
            })
            : null;

        await initWorkerPool({
            encoded,
            mainEchoBuffs,
            echoKindIds,
            comboIndexing,
            backend
        });

        return await runEchoOptimizer({
            echoes: filtered,
            comboBatchGeneratorFactory,
            comboIndexing,
            resultsLimit: form.resultsLimit,
            onProgress: form.onProgress,
            combinations: enableGpu ? comboCountPerRun : form.combinations,
            progressCombinations: enableGpu ? form.combinations : form.combinations,
            comboMaxCost: ECHO_OPTIMIZER_MAX_COST,
            ctxObj,
            charId: form.charId,
            encodedConstraints: statConstraints,
            mainFactor,
            lockedIndex,
            lockedIndices,
            targetCombosPerJob,
            mergeBatches: enableGpu,
            useComboIndexing: enableGpu,
        });
    }
};
