import {OPTIMIZER_WORKER_COUNT_GPU, WORKER_COUNT} from "../misc/index.js";

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
    for (const w of workers) {
        w.postMessage({ type: "cancel" });
    }
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

export function initWorkerPool({ encoded, mainEchoBuffs, echoKindIds, comboIndexing, backend }) {
    if (initPromise && activeBackend === backend) return initPromise;
    if (initPromise && activeBackend !== backend) {
        resetWorkerPool();
    }

    activeBackend = backend;
    initPromise = new Promise(resolve => {
        const count = WORKER_COUNT[backend] ?? OPTIMIZER_WORKER_COUNT_GPU;
        for (let i = 0; i < count; i++) {
            spawnWorker(i, encoded, mainEchoBuffs, echoKindIds, comboIndexing, backend, resolve);
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

export function runWorkerOnIndexRange({ comboStart, comboCount, packedContext, resultsLimit, encodedConstraints }) {
    if (CANCEL) return Promise.resolve({ cancelled: true });

    return new Promise(resolve => {
        const shouldSendConstraints = encodedConstraints && encodedConstraints !== lastConstraintsRef;
        if (shouldSendConstraints) {
            lastConstraintsRef = encodedConstraints;
        }
        const job = {
            comboStart,
            comboCount,
            packedContext,
            resolve,
            resultsLimit,
            encodedConstraints: shouldSendConstraints ? encodedConstraints : null,
            indexed: true
        };
        const size = comboCount;
        let i = 0;
        while (i < queue.length && (queue[i].comboCount ?? 0) <= size) i++;
        queue.splice(i, 0, job);

        schedule();
    });
}

export function runWorkerOnRotationIndexRange({
    comboStart,
    comboCount,
    packedContext,
    ctxLen,
    ctxCount,
    resultsLimit,
    encodedConstraints
}) {
    if (CANCEL) return Promise.resolve({ cancelled: true });

    return new Promise(resolve => {
        const shouldSendConstraints = encodedConstraints && encodedConstraints !== lastConstraintsRef;
        if (shouldSendConstraints) {
            lastConstraintsRef = encodedConstraints;
        }
        const job = {
            comboStart,
            comboCount,
            packedContext,
            ctxLen,
            ctxCount,
            resolve,
            resultsLimit,
            encodedConstraints: shouldSendConstraints ? encodedConstraints : null,
            rotation: true
        };
        const size = comboCount;
        let i = 0;
        while (i < queue.length && (queue[i].comboCount ?? 0) <= size) i++;
        queue.splice(i, 0, job);

        schedule();
    });
}

export function runWorkerOnRotationBatch({
    combosBatch,
    packedContext,
    ctxLen,
    ctxCount,
    resultsLimit,
    encodedConstraints
}) {
    if (CANCEL) return Promise.resolve({ cancelled: true });

    return new Promise(resolve => {
        const shouldSendConstraints = encodedConstraints && encodedConstraints !== lastConstraintsRef;
        if (shouldSendConstraints) {
            lastConstraintsRef = encodedConstraints;
        }
        const job = {
            combosBatch,
            packedContext,
            ctxLen,
            ctxCount,
            resolve,
            resultsLimit,
            encodedConstraints: shouldSendConstraints ? encodedConstraints : null,
            rotationBatch: true
        };
        const size = combosBatch.length;
        let i = 0;
        while (i < queue.length && (queue[i].combosBatch?.length ?? 0) <= size) i++;
        queue.splice(i, 0, job);

        schedule();
    });
}

function spawnWorker(index, encoded, mainEchoBuffs, echoKindIds, comboIndexing, backend, resolveInit) {
    const w = new Worker(
        new URL("./optimizer.worker.js", import.meta.url),
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
        comboIndexing,
        backend,
    });
}

export function setWorkerRotationContext({ packedContexts, ctxLen, ctxCount, weights }) {
    if (!workers.length) return;
    for (const w of workers) {
        // Do NOT transfer these buffers: the rotation context must be broadcast to every worker.
        // Transferring would detach the ArrayBuffer after the first postMessage().
        w.postMessage({
            type: "setRotationContext",
            ctxsBuf: packedContexts.buffer,
            ctxsOffset: packedContexts.byteOffset,
            ctxsLen: packedContexts.length,
            ctxLen,
            ctxCount,
            weightsBuf: weights.buffer,
            weightsOffset: weights.byteOffset,
            weightsLen: weights.length,
        });
    }
}

export function setWorkerLockedEchoIndex(lockedIndex) {
    if (!workers.length) return;
    for (const w of workers) {
        w.postMessage({ type: "setLockedIndex", lockedIndex });
    }
}

function schedule() {
    if (CANCEL || queue.length === 0) return;

    for (const w of workers) {
        if (!ready.has(w) || busy.has(w)) continue;

        const job = queue.shift();
        if (!job) return;

        busy.add(w);
        w.currentJob = job;

        if (job.indexed) {
            w.postMessage(
                {
                    type: "runIndexed",
                    comboStart: job.comboStart,
                    comboCount: job.comboCount,
                    comboBaseIndex: job.comboStart,

                    ctxBuf: job.packedContext.buffer,
                    ctxOffset: job.packedContext.byteOffset,
                    ctxLen: job.packedContext.length,

                    resultsLimit: job.resultsLimit,
                    encodedConstraints: job.encodedConstraints
                },
                [job.packedContext.buffer]
            );
        } else if (job.rotation) {
            w.postMessage(
                {
                    type: "runRotation",
                    comboStart: job.comboStart,
                    comboCount: job.comboCount,
                    comboBaseIndex: job.comboStart,

                    paramsBuf: job.packedContext.buffer,
                    paramsOffset: job.packedContext.byteOffset,
                    paramsLen: job.packedContext.length,

                    rotationCtxLen: job.ctxLen,
                    rotationCtxCount: job.ctxCount,

                    resultsLimit: job.resultsLimit,
                    encodedConstraints: job.encodedConstraints
                },
                [job.packedContext.buffer]
            );
        } else if (job.rotationBatch) {
            w.postMessage(
                {
                    type: "runRotation",
                    combosBuf: job.combosBatch.buffer,
                    combosOffset: job.combosBatch.byteOffset,
                    combosLen: job.combosBatch.length,

                    paramsBuf: job.packedContext.buffer,
                    paramsOffset: job.packedContext.byteOffset,
                    paramsLen: job.packedContext.length,

                    rotationCtxLen: job.ctxLen,
                    rotationCtxCount: job.ctxCount,

                    resultsLimit: job.resultsLimit,
                    encodedConstraints: job.encodedConstraints,
                    useBatch: true
                },
                [job.combosBatch.buffer, job.packedContext.buffer]
            );
        } else {
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
}
