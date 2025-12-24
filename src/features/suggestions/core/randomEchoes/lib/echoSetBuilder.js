import {
    applyFixedSecondMainStat,
    getValidMainStats,
} from "@/utils/echoHelper.js";
import { getRandomSubstat, randomSubValue } from "./substats.js";

export function buildEchoSetForCombination({
    combination,
    costPlan,
    bias,
    rollQuality,
    statWeight,
}) {
    const echoes = [];

    for (let i = 0; i < costPlan.length; i++) {
        const cost = costPlan[i];
        const statKey = combination[i];

        const valid = getValidMainStats(cost);
        const value = valid?.[statKey] ?? 0;

        const mainStats = applyFixedSecondMainStat({ [statKey]: value }, cost);

        const subStats = Object.create(null);
        const maxSubs = 5;
        while (Object.keys(subStats).length < maxSubs) {
            const key = getRandomSubstat(bias, false, statWeight);
            if (!subStats[key]) {
                subStats[key] = randomSubValue(key, rollQuality);
            }
        }

        echoes.push({
            id: i,
            cost,
            mainStats,
            subStats,
            selectedSet: -1,
            sets: [],
        });
    }

    return echoes;
}
