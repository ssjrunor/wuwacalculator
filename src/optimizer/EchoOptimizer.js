import {runGpuEchoOptimizer} from "./GpuEchoOptimizer.js";
import {generateEchoContext} from "./echoOptimizerContext.js";
import {cancelGpuWorkers, initWorkerPool, resetGpuCancel, resetWorkerPool,} from "./gpu/GpuWorkerPool.js";
import {generateEchoComboBatches, generateEchoPermutationBatches} from "./generateEchoCombos.js";
import {encodeEchoStats} from "./encodeEchoStats.js";
import {prepareGpuContext} from "./prepareGpuContext.js";

let CANCEL = false;
export let ctxObj = {};

export const EchoOptimizer = {
    cancel() {
        CANCEL = true;
        cancelGpuWorkers();
    },

    async optimize(form) {
        CANCEL = false;
        resetGpuCancel();
        resetWorkerPool();

        const filtered = form.filtered;
        if (!filtered || !filtered.length) {
            return [];
        }

        ctxObj = prepareGpuContext(generateEchoContext(form));
        const encoded = encodeEchoStats(filtered);
        await initWorkerPool(encoded, filtered, form.charId);

        const batchSize = Math.min(form.combinations, 120000);

        if (form.onBatchSize) {
            form.onBatchSize(batchSize);
        }

        if (form.onContext) {
            form.onContext(ctxObj);
        }

        const batchGen = generateEchoPermutationBatches({
            echoes: filtered,
            maxCost: 12,
            maxSize: 5,
            batchSize,
            lockedEchoId: form.lockedEchoId,
        });

        return await runGpuEchoOptimizer({
            echoes: filtered,
            comboBatchGenerator: batchGen,
            resultsLimit: form.resultsLimit,
            onProgress: form.onProgress,
            combinations: form.combinations,
            encoded,
            ctxObj,
            charId: form.charId,
        });
    }
};

function tuneBatchSize(ctxObj, combinations) {
    return Math.min(combinations, 120000);
}