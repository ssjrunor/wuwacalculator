import { runMainStatSuggestor } from "../mainStat-suggestion/suggestMainStat.js";
import { runSetSuggestor } from "../setPlan-suggestion/suggestSetPlan.js";
import { runEchoGenerator } from "../randomEchoes/compute.js";

self.onmessage = async (e) => {
    const msg = e?.data ?? {};
    const id = msg.id;
    const type = msg.type;
    const payload = msg.payload ?? {};

    try {
        let result = null;

        switch (type) {
        case "mainStats":
            result = runMainStatSuggestor(payload.form, payload.options ?? {});
            break;
        case "setPlans":
            result = runSetSuggestor(payload.form, payload.options ?? {});
            break;
        case "random":
            result = await runEchoGenerator(payload.params ?? {});
            break;
        default:
            throw new Error(`suggestions.worker: unknown job type "${String(type)}".`);
        }

        self.postMessage({ id, ok: true, result });
    } catch (err) {
        self.postMessage({
            id,
            ok: false,
            error: err?.message ?? String(err),
        });
    }
};

