import { getValidMainStats } from "@/utils/echoHelper.js";
import { ALL_COST_COMBOS, COST_PLAN_DEFAULT } from "./constants.js";

export function buildCostPlans(requiredCost) {
    if (!requiredCost) return ALL_COST_COMBOS.slice();
    const filtered = ALL_COST_COMBOS.filter((plan) =>
        plan.includes(requiredCost),
    );
    return filtered.length ? filtered : ALL_COST_COMBOS.slice();
}

export function buildMainStatCombinations(costPlan, mainStatFilter) {
    const slots = costPlan.map((cost) => {
        const valid = getValidMainStats(cost);
        const keys = Object.keys(valid);
        const weightedKeys = Object.entries(mainStatFilter ?? {})
            .filter(([, value]) => Boolean(value))
            .map(([key]) => key);

        const filtered = weightedKeys.filter((key) => key in valid);
        return filtered.length ? filtered : keys;
    });

    let combos = [[]];
    for (const options of slots) {
        const next = [];
        for (const combo of combos) {
            for (const key of options) {
                next.push(combo.concat(key));
            }
        }
        combos = next;
    }

    return combos;
}
