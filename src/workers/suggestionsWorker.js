import {runSetSuggestor} from "../suggestions/setPlan-suggestion/suggestSetPlan.js";
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