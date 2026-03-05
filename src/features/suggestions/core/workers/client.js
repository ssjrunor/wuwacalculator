let worker = null;
let nextJobId = 1;
const pendingJobs = new Map();

function ensureWorker() {
    if (worker) return worker;

    worker = new Worker(
        new URL("./suggestions.worker.js", import.meta.url),
        { type: "module" }
    );

    worker.onmessage = (e) => {
        const msg = e?.data ?? {};
        const id = msg.id;
        const pending = pendingJobs.get(id);
        if (!pending) return;

        pendingJobs.delete(id);
        if (msg.ok) {
            pending.resolve(msg.result);
            return;
        }

        pending.reject(new Error(msg.error ?? "suggestions.worker: unknown error"));
    };

    worker.onerror = (err) => {
        const error = new Error(err?.message ?? "suggestions.worker: worker error");
        for (const pending of pendingJobs.values()) {
            pending.reject(error);
        }
        pendingJobs.clear();
    };

    return worker;
}

export function runSuggestionsWorkerJob(type, payload = {}) {
    const w = ensureWorker();
    const id = nextJobId++;

    return new Promise((resolve, reject) => {
        pendingJobs.set(id, { resolve, reject });
        w.postMessage({ id, type, payload });
    });
}

