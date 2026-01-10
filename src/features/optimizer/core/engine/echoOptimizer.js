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
const ENCODED_CACHE_MAX = 5;
let encodedCacheRef = { key: null, entry: null };

function stringifyStats(obj) {
    if (!obj) return "";
    const entries = Object.entries(obj).sort(([a], [b]) => a.localeCompare(b));
    return entries.map(([k, v]) => `${k}:${v}`).join(",");
}

function hashEcho(echo) {
    if (!echo) return "null";
    const parts = [
        echo.uid ?? "",
        echo.id ?? "",
        echo.cost ?? "",
        echo.selectedSet ?? "",
        stringifyStats(echo.mainStats),
        stringifyStats(echo.subStats)
    ];
    return parts.join("|");
}

function djb2(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i);
    }
    return (hash >>> 0).toString(16);
}

function buildOptimizerCacheKey({
    echoes,
    charId,
    tab,
    levelLabel,
    rotationMode,
    lockedEchoId
}) {
    const echoSig = echoes.map(hashEcho).join("~");
    const meta = [
        charId ?? "",
        tab ?? "",
        levelLabel ?? "",
        rotationMode ? 1 : 0,
        lockedEchoId ?? ""
    ].join("|");
    return `${meta}|${djb2(echoSig)}`;
}

function getCachedEncoded(cacheKey) {
    if (encodedCacheRef.key === cacheKey) {
        return encodedCacheRef.entry;
    }

    const cached = encodedCacheByKey.get(cacheKey) ?? null;
    if (cached) {
        encodedCacheByKey.delete(cacheKey);
        encodedCacheByKey.set(cacheKey, cached);
    }
    encodedCacheRef = { key: cacheKey, entry: cached };
    return cached;
}

function setCachedEncoded(cacheKey, entry) {
    if (encodedCacheByKey.has(cacheKey)) {
        encodedCacheByKey.delete(cacheKey);
    }
    encodedCacheByKey.set(cacheKey, entry);
    if (encodedCacheByKey.size > ENCODED_CACHE_MAX) {
        const firstKey = encodedCacheByKey.keys().next().value;
        encodedCacheByKey.delete(firstKey);
    }
    encodedCacheRef = { key: cacheKey, entry };
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

        const cacheKey = buildOptimizerCacheKey({
            echoes: filtered,
            charId: form.charId,
            tab: form.tab ?? form.entry?.tab ?? form.levelData?.Type ?? form.levelData?.tab,
            levelLabel: form.levelData?.Name ?? form.levelData?.label ?? form.level?.Name ?? form.level?.label,
            rotationMode: !!form.rotationMode,
            lockedEchoId: form.lockedEchoId
        });

        // Shared setup for both modes
        let entry = getCachedEncoded(cacheKey);
        if (entry) {
            console.log("[optimizer-cache] hit", cacheKey);
        } else {
            console.log("[optimizer-cache] miss", cacheKey);
        }
        if (!entry) {
            const encoded = encodeEchoStats(filtered);
            const mainEchoBuffs = buildMainEchoBuffsArray(
                Array.from({ length: encoded.count }, (_, i) => i),
                filtered,
                form.charId
            );
            const echoKindIds = buildEchoKindIdArray(filtered);
            entry = { encoded, mainEchoBuffs, echoKindIds };
            setCachedEncoded(cacheKey, entry);
        }
        const { encoded, mainEchoBuffs, echoKindIds } = entry;

        const { lockedRequested, lockedIndices, lockedIndex, runCount, notFound } =
            resolveLockedEcho(form.lockedEchoId, filtered);
        if (notFound) return [];

        const statConstraints = buildStatConstraintArray(form.constraints);

        let comboIndexing = entry.comboIndexing ?? null;
        if (!comboIndexing) {
            comboIndexing = buildCombinadicIndexing({
                echoes: filtered,
                maxSize: ECHO_OPTIMIZER_MAX_SIZE,
                lockedEchoIndex: lockedRequested ? lockedIndex : null,
                lockedEchoId: lockedRequested ? form.lockedEchoId : null,
            });
            entry.comboIndexing = comboIndexing;
            setCachedEncoded(cacheKey, entry);
        }
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
