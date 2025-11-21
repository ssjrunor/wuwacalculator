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
                                          }) {
    let totalProcessed = 0;
    const topResults = new TopKHeap(resultsLimit);
    const globalBestBySet = new Map();

    // Timing
    const startTime = performance.now();
    let lastUpdateTime = startTime;
    let avgSpeed = 0;
    let speedSamples = 0;

    for (const batch of comboBatchGenerator) {
        const comboCount = batch.length / 5;

        const packedContext = packGpuContext({
            ...ctxObj,
            comboCount
        });

        const r = await runGpuWorkerOnBatch({
            combosBatch: batch,
            packedContext,
            charId,
            resultsLimit
        });

        if (!r || r.cancelled) {
            return {
                cancelled: true,
                results: topResults.sorted().map(({ dmg, ids }) => ({
                    ids,
                    damage: dmg
                }))
            };
        }

        if (r.topK) {
            for (const { dmg, ids } of r.topK) {

                // canonical form of the set (sorted echo IDs)
                const key = ids.slice().sort((a,b)=>a-b).join(',');

                const prev = globalBestBySet.get(key);

                if (!prev || dmg > prev.dmg) {
                    globalBestBySet.set(key, { dmg, ids });

                    // push into global Top-K
                    topResults.push({ dmg, ids });
                }
            }
        }

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
            remainingMs = combosLeft / avgSpeed;
        }

        // --- CALLBACKS ---
        if (onProgress) {
            onProgress({
                progress: totalProcessed / combinations,
                elapsedMs: now - startTime,
                remainingMs,
                processed: totalProcessed,
                speed: avgSpeed,
            });
        }
    }

    return topResults.sorted().map(({ dmg, ids }) => ({
        ids,
        damage: dmg
    }));
}