import {
    runWorkerOnBatch,
    runWorkerOnIndexRange,
    setWorkerLockedEchoIndex
} from "../workers/pool.js";
import { TopKHeap } from "../misc/utils.js";
import { packOptimizerContext } from "../context/pack.js";
import {
    ECHO_OPTIMIZER_JOB_TARGET_COMBOS_GPU,
    OPTIMIZER_ECHOS_PER_COMBO,
    OPTIMIZER_ENABLE_TIMING_LOGS
} from "../misc/index.js";

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
}) {
    const totalForProgress = progressCombinations ?? combinations;
    const targetIntsPerJob = targetCombosPerJob * OPTIMIZER_ECHOS_PER_COMBO;

    let totalProcessed = 0;
    const topResults = new TopKHeap(resultsLimit);
    const globalBestBySet = new Map();

    const startTime = performance.now();
    let lastUpdateTime = startTime;
    let avgSpeed = 0;
    let speedSamples = 0;

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
            resultsLimit,
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
                if (dmg <= 0) continue;

                const key = makeSortedKey5BigInt(ids[0], ids[1], ids[2], ids[3], ids[4]);
                const prev = globalBestBySet.get(key);

                if (prev == null || dmg > prev) {
                    globalBestBySet.set(key, dmg);
                    topResults.push({ dmg, ids });
                }
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
            resultsLimit,
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
                if (dmg <= 0) continue;

                const key = makeSortedKey5BigInt(ids[0], ids[1], ids[2], ids[3], ids[4]);
                const prev = globalBestBySet.get(key);

                if (prev == null || dmg > prev) {
                    globalBestBySet.set(key, dmg);
                    topResults.push({ dmg, ids });
                }
            }
        }

        return { cancelled: false, comboCount };
    };

    const applyProgress = (comboCount) => {
        totalProcessed += comboCount * mainFactor;

        const now = performance.now();
        const elapsedSinceLast = now - lastUpdateTime;

        if (elapsedSinceLast > 0) {
            const speed = (comboCount * mainFactor) / elapsedSinceLast;
            avgSpeed = (avgSpeed * speedSamples + speed) / (speedSamples + 1);
            speedSamples++;
            lastUpdateTime = now;
        }

        let remainingMs = Infinity;
        if (avgSpeed > 0) {
            const combosLeft = totalForProgress - totalProcessed;
            remainingMs = combosLeft / avgSpeed; // ms
        }

        if (onProgress) {
            onProgress({
                progress: totalProcessed / totalForProgress,
                elapsedMs: now - startTime,
                remainingMs,
                processed: totalProcessed,
                speed: avgSpeed * 1000,
            });
        }
    };

    const flushPending = async (runLockedIndex) => {
        if (pendingInts <= 0) return { cancelled: false };

        let merged;
        if (pending.length === 1) {
            merged = pending[0];
        } else {
            merged = new Int32Array(pendingInts);
            let off = 0;
            for (const b of pending) {
                merged.set(b, off);
                off += b.length;
            }
        }

        pending = [];
        pendingInts = 0;

        const { cancelled, comboCount } = await runOneJob(merged, runLockedIndex);
        if (cancelled) return { cancelled: true };

        applyProgress(comboCount);

        return { cancelled: false };
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

        return topResults.sorted().map(({ dmg, ids }) => {
            const uids = ids.map((idx) => {
                if (idx < 0) return null;
                const echo = echoes?.[idx];
                return echo?.uid ?? null;
            });

            return { ids, uids, damage: dmg };
        });
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

    return topResults.sorted().map(({ dmg, ids }) => {
        const uids = ids.map((idx) => {
            if (idx < 0) return null;
            const echo = echoes?.[idx];
            return echo?.uid ?? null;
        });

        return { ids, uids, damage: dmg };
    });
}

export function makeSortedKey5BigInt(a, b, c, d, e) {
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
