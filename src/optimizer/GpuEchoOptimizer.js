import { runGpuWorkerOnBatch } from "./gpu/GpuWorkerPool.js";
import { TopKHeap } from "./optimizerUtils.js";
import { packGpuContext } from "./gpu/packContext.js";

export async function runGpuEchoOptimizer({
                                              comboBatchGenerator,
                                              resultsLimit,
                                              onProgress,
                                              combinations,
                                              ctxObj,
                                              charId,
                                              encodedConstraints,
                                              echoes,
                                          }) {
    const TARGET_COMBOS_PER_JOB = 250_000;
    const TARGET_INTS_PER_JOB = TARGET_COMBOS_PER_JOB * 5;

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
        const comboCount = (intsArray.length / 5) | 0;

        const packedContext = packGpuContext({
            ...ctxObj,
            comboCount,
            charId,
        });

        const combosBatch =
            (intsArray.byteOffset === 0 && intsArray.byteLength === intsArray.buffer.byteLength)
                ? intsArray
                : new Int32Array(intsArray);

        const r = await runGpuWorkerOnBatch({
            combosBatch,
            packedContext,
            charId,
            resultsLimit,
            encodedConstraints,
        });

        if (!r || r.cancelled) {
            return { cancelled: true, comboCount: 0 };
        }

        if (r.topK) {
            for (const { dmg, ids } of r.topK) {
                if (dmg <= 0) continue;

                const key = ids.slice().sort((a, b) => a - b).join(",");
                const prev = globalBestBySet.get(key);

                if (!prev || dmg > prev.dmg) {
                    globalBestBySet.set(key, { dmg, ids });
                    topResults.push({ dmg, ids });
                }
            }
        }

        return { cancelled: false, comboCount };
    };

    const flushPending = async () => {
        if (pendingInts <= 0) return { cancelled: false };

        const merged = new Int32Array(pendingInts);
        let off = 0;
        for (const b of pending) {
            merged.set(b, off);
            off += b.length;
        }

        pending = [];
        pendingInts = 0;

        const { cancelled, comboCount } = await runOneJob(merged);
        if (cancelled) return { cancelled: true };

        totalProcessed += comboCount;

        const now = performance.now();
        const elapsedSinceLast = now - lastUpdateTime;

        if (elapsedSinceLast > 0) {
            const speed = comboCount / elapsedSinceLast;
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

        return { cancelled: false };
    };

    for (const batch of comboBatchGenerator) {
        const b =
            (batch instanceof Int32Array) ? batch : new Int32Array(batch);

        pending.push(b);
        pendingInts += b.length;

        if (pendingInts >= TARGET_INTS_PER_JOB) {
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