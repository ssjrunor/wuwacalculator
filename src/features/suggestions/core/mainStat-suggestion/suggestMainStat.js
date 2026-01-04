import {computeMainStatDamage, computeRotationMainStatDamage} from "./compute.js";
import {buildMainStatPoolForSuggestor, generateMainStatsContext, generateRotationContexts} from "./ctx-builder.js";


export function suggestMainStats({
                                     ctx,
                                     rotationContexts = null,
                                     charId,
                                     statWeight = {},
                                     mainStatFilter = null,
                                     maxSlots = 5,
                                     minSlots = 1,
                                     maxCost = 12,
                                     topK = 5,
                                     sequence
                                 }) {
    const pool = buildMainStatPoolForSuggestor({ statWeight, charId, mainStatFilter });
    const results = [];

    const isRotationMode = rotationContexts && rotationContexts.length > 0;

    // running aggregate of all chosen main stats for the current path
    const currentStats = {};
    // indices into `pool` for the current path
    const currentIndices = [];

    function maybeInsertResult(costUsed) {
        let avgDamage;
        if (isRotationMode) {
            // Rotation mode: evaluate against all rotation contexts
            avgDamage = computeRotationMainStatDamage(
                rotationContexts.map(({ ctx, weight }) => ({ ctx: { ...ctx, sequence }, weight })),
                currentStats,
            );
        } else {
            // Single skill mode
            avgDamage = computeMainStatDamage({...ctx, sequence}, currentStats);
        }

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
            isRotation: isRotationMode,
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
    const rotationMode = form.rotationMode && form.rotationEntries?.length > 0;

    let ctx = null;
    let rotationContexts = null;

    if (rotationMode) {
        rotationContexts = generateRotationContexts(form);
        // If rotation context building failed, fall back to single skill
        if (!rotationContexts || rotationContexts.length === 0) {
            ctx = generateMainStatsContext(form);
            rotationContexts = null;
        }
    } else {
        ctx = generateMainStatsContext(form);
    }

    const statWeight =
        form.statWeight ??
        form.skill?.statWeight ??
        form.skill?.custSkillMeta?.statWeight ??
        {};

    return suggestMainStats({
        ctx,
        rotationContexts,
        charId: form.charId,
        statWeight,
        mainStatFilter: form.mainStatFilter,
        maxSlots: options.maxSlots ?? 5,
        minSlots: options.minSlots ?? 1,
        maxCost: options.maxCost ?? 12,
        topK: options.topK ?? 10,
        sequence: form.sequence,
    });
}