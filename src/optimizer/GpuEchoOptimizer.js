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
                                              echoes,              // <-- add this
                                          }) {
    let totalProcessed = 0;
    const topResults = new TopKHeap(resultsLimit);
    const globalBestBySet = new Map();

    const startTime = performance.now();
    let lastUpdateTime = startTime;
    let avgSpeed = 0;
    let speedSamples = 0;

    for (const batch of comboBatchGenerator) {
        const comboCount = batch.length / 5;

        const packedContext = packGpuContext({
            ...ctxObj,
            comboCount,
            charId
        });

        const r = await runGpuWorkerOnBatch({
            combosBatch: batch,
            packedContext,
            charId,
            resultsLimit,
            encodedConstraints
        });

        if (!r || r.cancelled) {
            return {
                cancelled: true,
                results: []
            };
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

        if (onProgress) {
            onProgress({
                progress: totalProcessed / combinations,
                elapsedMs: now - startTime,
                remainingMs,
                processed: totalProcessed,
                speed: avgSpeed * 1000,
            });
        }
    }

    return topResults.sorted().map(({ dmg, ids }) => {
        const uids = ids.map(idx => {
            if (idx < 0) return null;
            const echo = echoes[idx];
            return echo?.uid ?? null;
        });

        return {
            ids,
            uids,
            damage: dmg
        };
    });
}