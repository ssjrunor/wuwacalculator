import {
    runWorkerOnBatch,
    runWorkerOnIndexRange,
    setWorkerLockedEchoIndex
} from "../workers/pool.js";
import { packOptimizerContext } from "../context/pack.js";
import {
    ECHO_OPTIMIZER_JOB_TARGET_COMBOS_GPU,
    OPTIMIZER_ECHOS_PER_COMBO,
    OPTIMIZER_ENABLE_TIMING_LOGS
} from "../misc/index.js";
import {
    createProgressTracker,
    createResultCollector,
    flushPendingBatches,
} from "./shared.js";

export async function runEchoOptimizer({
    comboBatchGenerator,
    comboBatchGeneratorFactory,
    comboIndexing,
    resultsLimit,
    onProgress,
    combinations,
    progressCombinations,
    comboMaxCost = 0,
    ctxObj,
    charId,
    encodedConstraints,
    echoes,
    mainFactor = 1,
    lockedIndex = -1,
    lockedIndices,
    targetCombosPerJob = ECHO_OPTIMIZER_JOB_TARGET_COMBOS_GPU,
    mergeBatches = true,
    useComboIndexing = false,
    setRuntimeMask,
}) {
    const totalForProgress = progressCombinations ?? combinations;
    const targetIntsPerJob = targetCombosPerJob * OPTIMIZER_ECHOS_PER_COMBO;

    const applyProgress = createProgressTracker({
        totalForProgress,
        mainFactor,
        onProgress,
    });
    const oversample = 8;
    const jobResultsLimit = Math.min(Math.max(resultsLimit * 2, resultsLimit), 65536);
    const collector = createResultCollector({ resultsLimit, oversample });

    let pending = [];
    let pendingInts = 0;

    const lockedRuns =
        Array.isArray(lockedIndices) && lockedIndices.length
            ? lockedIndices
            : [lockedIndex];

    const runOneJob = async (intsArray, runLockedIndex) => {
        const t0 = OPTIMIZER_ENABLE_TIMING_LOGS ? performance.now() : 0;
        const comboCount = (intsArray.length / OPTIMIZER_ECHOS_PER_COMBO) | 0;

        const packedContext = packOptimizerContext({
            ...ctxObj,
            comboCount,
            charId,
            setRuntimeMask,
            lockedEchoIndex: runLockedIndex,
            comboMode: 0,
            comboN: 0,
            comboMaxCost: 0,
            comboK: 0,
            comboBaseIndex: 0,
        });

        const combosBatch =
            (intsArray.byteOffset === 0 && intsArray.byteLength === intsArray.buffer.byteLength)
                ? intsArray
                : new Int32Array(intsArray);

        const r = await runWorkerOnBatch({
            combosBatch,
            packedContext,
            resultsLimit: jobResultsLimit,
            encodedConstraints,
        });
        if (OPTIMIZER_ENABLE_TIMING_LOGS) {
            const t1 = performance.now();
            console.log(`[optimizer] cpu-batch ${comboCount.toLocaleString()} combos in ${(t1 - t0).toFixed(2)}ms`);
        }

        if (!r || r.cancelled) {
            return { cancelled: true, comboCount: 0 };
        }

        if (r.topK) {
            for (const { dmg, ids } of r.topK) {
                collector.push({ dmg, ids });
            }
        }

        return { cancelled: false, comboCount };
    };

    const runIndexedJob = async (comboStart, comboCount, comboIndexingData, runLockedIndex) => {
        const t0 = OPTIMIZER_ENABLE_TIMING_LOGS ? performance.now() : 0;
        const packedContext = packOptimizerContext({
            ...ctxObj,
            comboCount,
            charId,
            setRuntimeMask,
            lockedEchoIndex: runLockedIndex,
            comboMode: 2,
            comboN: comboIndexingData.comboN,
            comboMaxCost,
            comboK: comboIndexingData.comboK,
            comboBaseIndex: comboStart,
        });

        const r = await runWorkerOnIndexRange({
            comboStart,
            comboCount,
            packedContext,
            resultsLimit: jobResultsLimit,
            encodedConstraints,
        });
        if (OPTIMIZER_ENABLE_TIMING_LOGS) {
            const t1 = performance.now();
            console.log(`[optimizer] gpu-index ${comboCount.toLocaleString()} combos in ${(t1 - t0).toFixed(2)}ms`);
        }

        if (!r || r.cancelled) {
            return { cancelled: true, comboCount: 0 };
        }

        if (r.topK) {
            for (const { dmg, ids } of r.topK) {
                collector.push({ dmg, ids });
            }
        }

        return { cancelled: false, comboCount };
    };

    const flushPending = async (runLockedIndex) => {
        const { cancelled, pending: newPending, pendingInts: newPendingInts } =
            await flushPendingBatches({
                pending,
                pendingInts,
                runJob: (merged) => runOneJob(merged, runLockedIndex),
                applyProgress,
            });

        pending = newPending;
        pendingInts = newPendingInts;

        return { cancelled };
    };

    if (useComboIndexing && comboIndexing) {
        for (const runLockedIndex of lockedRuns) {
            if (runLockedIndex >= 0) {
                setWorkerLockedEchoIndex(runLockedIndex);
            }

            let start = 0;
            while (start < combinations) {
                const count = Math.min(targetCombosPerJob, combinations - start);
                const { cancelled, comboCount } = await runIndexedJob(start, count, comboIndexing, runLockedIndex);
                if (cancelled) {
                    return { cancelled: true, results: [] };
                }
                applyProgress(comboCount);
                start += count;
            }
        }

        return collector.toResults({ echoes, limit: resultsLimit });
    }

    if (lockedRuns.length > 1 && !comboBatchGeneratorFactory) {
        throw new Error("runEchoOptimizer: comboBatchGeneratorFactory is required when lockedIndices has multiple entries.");
    }

    for (const runLockedIndex of lockedRuns) {
        const gen = comboBatchGeneratorFactory
            ? comboBatchGeneratorFactory(runLockedIndex)
            : comboBatchGenerator;

        for (const batch of gen) {
            const b =
                (batch instanceof Int32Array) ? batch : new Int32Array(batch);

            if (!mergeBatches) {
                const { cancelled, comboCount } = await runOneJob(b, runLockedIndex);
                if (cancelled) {
                    return { cancelled: true, results: [] };
                }
                applyProgress(comboCount);
                continue;
            }

            pending.push(b);
            pendingInts += b.length;

            if (pendingInts >= targetIntsPerJob) {
                const res = await flushPending(runLockedIndex);
                if (res.cancelled) {
                    return { cancelled: true, results: [] };
                }
            }
        }

        const tail = await flushPending(runLockedIndex);
        if (tail.cancelled) {
            return { cancelled: true, results: [] };
        }
    }

    return collector.toResults({ echoes, limit: resultsLimit });
}

export { makeSortedKey5BigInt } from "./shared.js";
