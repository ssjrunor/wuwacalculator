import {runSetSuggestor} from "../suggestions/setPlain-suggestion/suggestSetPlan.js";
import {runMainStatSuggestor} from "../suggestions/mainStat-suggestion/suggestMainStat.js";

self.onmessage = (event) => {
    const { type, payload, options } = event.data;

    try {
        if (type === 'setPlans') {
            const suggestions = runSetSuggestor(payload, options);
            self.postMessage({
                type,
                suggestions,
                error: null,
            });
        } else if (type === 'mainStats') {
            const suggestions = runMainStatSuggestor(payload, options);
            self.postMessage({
                type,
                suggestions,
                error: null,
            });
        } else {
            self.postMessage({
                type,
                suggestions: null,
                error: `Unknown suggestions type: ${type}`,
            });
        }
    } catch (err) {
        self.postMessage({
            type,
            suggestions: null,
            error: err?.message || String(err),
        });
    }
};

// catch uncaught script errors in the worker
self.addEventListener('error', (e) => {
    // optional: e.preventDefault();
    self.postMessage({
        type: 'workerFatalError',
        suggestions: null,
        error: {
            message: e.message,
            filename: e.filename,
            lineno: e.lineno,
            colno: e.colno,
        },
    });
});

// also catch unhandled promise rejections just in case
self.addEventListener('unhandledrejection', (e) => {
    self.postMessage({
        type: 'workerFatalError',
        suggestions: null,
        error: {
            message: e.reason?.message || String(e.reason),
        },
    });
});