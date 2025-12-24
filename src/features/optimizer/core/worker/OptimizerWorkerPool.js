import {
    OPTIMIZER_WORKER_COUNT_CPU,
    OPTIMIZER_WORKER_COUNT_GPU
} from "../optimizerConfig.js";

const WORKER_COUNT = {
    cpu: OPTIMIZER_WORKER_COUNT_CPU,
    gpu: OPTIMIZER_WORKER_COUNT_GPU
};

let workers = [];
let ready = new Set();
let busy = new Set();
let queue = [];
let CANCEL = false;
let activeBackend = null;
let lastConstraintsRef = null;

let initPromise = null;

export function cancelWorkers() {
    CANCEL = true;
    queue.length = 0;
}

export function resetCancel() {
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
    activeBackend = null;
    lastConstraintsRef = null;
}

export function initWorkerPool({ encoded, mainEchoBuffs, echoKindIds, backend }) {
    if (initPromise && activeBackend === backend) return initPromise;
    if (initPromise && activeBackend !== backend) {
        resetWorkerPool();
    }

    activeBackend = backend;
    initPromise = new Promise(resolve => {
        const count = WORKER_COUNT[backend] ?? OPTIMIZER_WORKER_COUNT_GPU;
        for (let i = 0; i < count; i++) {
            spawnWorker(i, encoded, mainEchoBuffs, echoKindIds, backend, resolve);
        }
    });

    return initPromise;
}

export function runWorkerOnBatch({ combosBatch, packedContext, resultsLimit, encodedConstraints }) {
    if (CANCEL) return Promise.resolve({ cancelled: true });

    return new Promise(resolve => {
        const shouldSendConstraints = encodedConstraints && encodedConstraints !== lastConstraintsRef;
        if (shouldSendConstraints) {
            lastConstraintsRef = encodedConstraints;
        }
        const job = {
            combosBatch,
            packedContext,
            resolve,
            resultsLimit,
            encodedConstraints: shouldSendConstraints ? encodedConstraints : null
        };
        const size = combosBatch.length;
        let i = 0;
        while (i < queue.length && queue[i].combosBatch.length <= size) i++;
        queue.splice(i, 0, job);

        schedule();
    });
}

function spawnWorker(index, encoded, mainEchoBuffs, echoKindIds, backend, resolveInit) {
    const w = new Worker(
        new URL("../workers/OptimizerWorker.js", import.meta.url),
        { type: "module" }
    );

    workers[index] = w;

    w.onmessage = e => {
        const msg = e.data;

        if (msg.type === "ready") {
            ready.add(w);
            if (ready.size === workers.length) resolveInit();
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

        if (msg.type === "workerError") {
            busy.delete(w);
            ready.add(w);

            const job = w.currentJob;
            w.currentJob = null;
            if (job) job.resolve({ cancelled: true, error: msg.error });

            schedule();
        }
    };

    w.postMessage({
        type: "init",
        encoded,
        mainEchoBuffs,
        echoKindIds,
        backend,
    });
}

function schedule() {
    if (CANCEL || queue.length === 0) return;

    for (const w of workers) {
        if (!ready.has(w) || busy.has(w)) continue;

        const job = queue.shift();
        if (!job) return;

        busy.add(w);
        w.currentJob = job;

        w.postMessage(
            {
                type: "run",
                combosBuf: job.combosBatch.buffer,
                combosOffset: job.combosBatch.byteOffset,
                combosLen: job.combosBatch.length,

                ctxBuf: job.packedContext.buffer,
                ctxOffset: job.packedContext.byteOffset,
                ctxLen: job.packedContext.length,

                resultsLimit: job.resultsLimit,
                encodedConstraints: job.encodedConstraints
            },
            [job.combosBatch.buffer, job.packedContext.buffer]
        );
    }
}
