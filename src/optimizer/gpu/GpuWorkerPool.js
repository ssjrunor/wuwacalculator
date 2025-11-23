const WORKER_COUNT = 2

let workers = [];
let ready = new Set();
let busy = new Set();
let queue = [];
let CANCEL = false;

let initPromise = null;

export function cancelGpuWorkers() {
    CANCEL = true;
    queue.length = 0;
}

export function resetGpuCancel() {
    CANCEL = false;
}

export function resetWorkerPool() {
    for (const w of workers) {
        w.terminate();
    }
    workers = [];
    ready.clear();
    busy.clear();
    queue = [];
    initPromise = null;
}

export function initWorkerPool(encoded, echoes, charId) {
    if (initPromise) return initPromise;

    initPromise = new Promise(resolve => {
        for (let i = 0; i < WORKER_COUNT; i++) {
            spawnWorker(i, encoded, echoes, charId, resolve);
        }
    });

    return initPromise;
}

export function runGpuWorkerOnBatch({ combosBatch, packedContext, charId, resultsLimit, encodedConstraints }) {
    if (CANCEL) return Promise.resolve({ cancelled: true });

    return new Promise(resolve => {
        queue.push({ combosBatch, packedContext, charId, resolve, resultsLimit, encodedConstraints });
        schedule();
    });
}

function spawnWorker(index, encoded, echoes, charId, resolveInit) {
    const w = new Worker(
        new URL("../workers/GpuWorker.js", import.meta.url),
        { type: "module" }
    );

    workers[index] = w;

    w.onmessage = e => {
        const msg = e.data;

        if (msg.type === "ready") {
            ready.add(w);
            if (ready.size === WORKER_COUNT) resolveInit();
            return;
        }

        if (msg.type === "done") {
            busy.delete(w);

            const job = w.currentJob;
            if (job) {
                const resolver = job.resolve;
                w.currentJob = null;
                resolver(msg);
            } else {
                w.currentJob = null;
            }

            schedule();
        }
    };

    w.postMessage({ type: "init", encoded, echoes, charId });
}

function schedule() {
    if (CANCEL || queue.length === 0) return;

    for (const w of workers) {
        if (!ready.has(w) || busy.has(w)) continue;

        const job = queue.shift();
        if (!job) return;

        busy.add(w);
        w.currentJob = job;

        w.postMessage({
            type: "run",
            combos: job.combosBatch,
            packedContext: job.packedContext,
            charId: job.charId,
            resultsLimit: job.resultsLimit,
            encodedConstraints: job.encodedConstraints
        });
    }
}