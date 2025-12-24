import {runWorkerOnBatch} from "./worker/OptimizerWorkerPool.js";
import {TopKHeap} from "./optimizerUtils.js";
import {packOptimizerContext} from "./shared/packContext.js";
import {
    ECHO_OPTIMIZER_JOB_TARGET_COMBOS_GPU,
    OPTIMIZER_ECHOS_PER_COMBO
} from "./optimizerConfig.js";

export async function runEchoOptimizer({
    comboBatchGenerator,
    resultsLimit,
    onProgress,
    combinations,
    ctxObj,
    charId,
    encodedConstraints,
    echoes,
    mainFactor = 1,
    lockedIndex = -1,
    targetCombosPerJob = ECHO_OPTIMIZER_JOB_TARGET_COMBOS_GPU,
    mergeBatches = true,
}) {
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

    const runOneJob = async (intsArray) => {
        const comboCount = (intsArray.length / OPTIMIZER_ECHOS_PER_COMBO) | 0;

        const packedContext = packOptimizerContext({
            ...ctxObj,
            comboCount,
            charId,
            lockedEchoIndex: lockedIndex,
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
            const combosLeft = combinations - totalProcessed;
            remainingMs = combosLeft / avgSpeed; // ms
        }

        if (onProgress) {
            onProgress({
                progress: totalProcessed / combinations,
                elapsedMs: now - startTime,
                remainingMs,
                processed: totalProcessed,
                speed: avgSpeed * 1000,
            });
        }
    };

    const flushPending = async () => {
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

        const { cancelled, comboCount } = await runOneJob(merged);
        if (cancelled) return { cancelled: true };

        applyProgress(comboCount);

        return { cancelled: false };
    };

    for (const batch of comboBatchGenerator) {
        const b =
            (batch instanceof Int32Array) ? batch : new Int32Array(batch);

        if (!mergeBatches) {
            const { cancelled, comboCount } = await runOneJob(b);
            if (cancelled) {
                return { cancelled: true, results: [] };
            }
            applyProgress(comboCount);
            continue;
        }

        pending.push(b);
        pendingInts += b.length;

        if (pendingInts >= targetIntsPerJob) {
            const res = await flushPending();
            if (res.cancelled) {
                return { cancelled: true, results: [] };
            }
        }
    }

    const tail = await flushPending();
    if (tail.cancelled) {
        return { cancelled: true, results: [] };
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
