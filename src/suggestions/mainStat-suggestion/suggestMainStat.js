import {computeMainStatDamage} from "./compute.js";
import {buildMainStatPoolForSuggestor, generateMainStatsContext} from "./ctx-builder.js";


export function suggestMainStats({
                                     ctx,
                                     charId,
                                     statWeight = {},
                                     mainStatFilter = null,
                                     maxSlots = 5,
                                     minSlots = 1,
                                     maxCost = 12,
                                     topK = 5,
                                 }) {
    const pool = buildMainStatPoolForSuggestor({ statWeight, charId, mainStatFilter });
    const results = [];

    // running aggregate of all chosen main stats for the current path
    const currentStats = {};
    // indices into `pool` for the current path
    const currentIndices = [];

    function maybeInsertResult(costUsed) {
        const avgDamage = computeMainStatDamage(ctx, currentStats, null, true);

        const echoes = currentIndices.map(idx => {
            const opt = pool[idx];
            return {
                cost: opt.cost,
                mainStats: opt.stats,
            };
        });

        results.push({
            damage: avgDamage,
            totalCost: costUsed,
            echoes,
        });

        results.sort((a, b) => b.damage - a.damage);
        if (results.length > topK) results.length = topK;
    }

    function dfs(startIndex, slotsUsed, costUsed) {
        if (slotsUsed >= minSlots) {
            maybeInsertResult(costUsed);
        }
        if (slotsUsed === maxSlots) return;

        for (let i = startIndex; i < pool.length; i++) {
            const opt = pool[i];
            const newCost = costUsed + opt.cost;
            if (newCost > maxCost) continue;

            // apply this option's stats in-place
            const deltas = [];
            for (const [k, v] of Object.entries(opt.stats)) {
                const prev = currentStats[k] ?? 0;
                currentStats[k] = prev + v;
                deltas.push([k, prev]);
            }

            currentIndices.push(i);
            dfs(i, slotsUsed + 1, newCost);
            currentIndices.pop();

            for (const [k, prev] of deltas) {
                if (prev === 0) delete currentStats[k];
                else currentStats[k] = prev;
            }
        }
    }

    dfs(0, 0, 0);

    return results;
}

export function runMainStatSuggestor(form, options = {}) {
    const ctx = generateMainStatsContext(form);

    const statWeight =
        form.statWeight ??
        form.skill?.statWeight ??
        form.skill?.custSkillMeta?.statWeight ??
        {};

    return suggestMainStats({
        ctx,
        charId: form.charId,
        statWeight,
        mainStatFilter: form.mainStatFilter,
        maxSlots: options.maxSlots ?? 5,
        minSlots: options.minSlots ?? 1,
        maxCost: options.maxCost ?? 12,
        topK: options.topK ?? 10,
    });
}