import {generateSetPlanContext} from "./ctx-builder.js";
import {computeSetPlanDamage} from "./compute.js";
import {DEFAULT_FIVE_PIECE_SETS, DEFAULT_THREE_PIECE_SETS} from "../../constants/echoSetData.jsx";
import {isSetPlanFeasible} from "./utils.js";

export function suggestSetPlans({
                                    ctx,
                                    fivePieceSets = [],
                                    threePieceSets = [],
                                    topK = 10,
                                    exhaustive = false,
                                }) {
    const results = [];

    const baseDmg = computeSetPlanDamage(ctx, {}, null);
    const baseAvg =
        baseDmg && typeof baseDmg.avgDamage === "number"
            ? baseDmg.avgDamage
            : 0;

    const EPS = Math.max(1e-6, Math.abs(baseAvg) * 1e-6);

    const allSets = [
        ...fivePieceSets.map(id => ({ id, type: "5pc" })),
        ...threePieceSets.map(id => ({ id, type: "3pc" })),
    ];

    const pieceBaselines = new Map();

    for (const { id, type } of allSets) {
        if (type === "5pc") {
            const plan2 = { [id]: 2 };
            const dmg2 = computeSetPlanDamage(ctx, plan2, null);
            if (dmg2 && typeof dmg2.avgDamage === "number") {
                pieceBaselines.set(`${id}:2`, dmg2.avgDamage);
            }
        } else if (type === "3pc") {
            const plan3 = { [id]: 3 };
            const dmg3 = computeSetPlanDamage(ctx, plan3, null);
            if (dmg3 && typeof dmg3.avgDamage === "number") {
                pieceBaselines.set(`${id}:3`, dmg3.avgDamage);
            }
        }
    }

    function maybeInsert(setPlan, totalPieces) {
        const dmg = computeSetPlanDamage(ctx, setPlan, null);
        if (!dmg || typeof dmg.avgDamage !== "number") return;

        const avg = dmg.avgDamage;

        if (Math.abs(avg - baseAvg) <= EPS) {
            return;
        }

        const entries = Object.entries(setPlan);

        for (const [setIdStr, pieces] of entries) {
            if (pieces === 2 || pieces === 3) {
                const key = `${setIdStr}:${pieces}`;
                const baseline = pieceBaselines.get(key);

                if (typeof baseline === "number") {
                    const localEPS = Math.max(
                        EPS,
                        Math.abs(baseline) * 1e-6
                    );

                    if (Math.abs(avg - baseline) <= localEPS) {
                        const isStandalone =
                            entries.length === 1 && totalPieces === pieces;

                        if (!isStandalone) {
                            return;
                        }
                    }
                }
            }
        }

        results.push({
            avgDamage: avg,
            totalPieces,
            setPlan: entries.map(([setId, pieces]) => ({
                setId: Number(setId),
                pieces,
            })),
        });

        if (!exhaustive && topK > 0) {
            results.sort((a, b) => b.avgDamage - a.avgDamage);
            if (results.length > topK) results.length = topK;
        }
    }

    function dfs(index, usedPieces, plan) {
        if (usedPieces > 5) return;

        if (index === allSets.length) {
            if (usedPieces > 0) {
                maybeInsert(plan, usedPieces);
            }
            return;
        }

        const { id, type } = allSets[index];
        dfs(index + 1, usedPieces, plan);

        if (type === "5pc") {
            if (usedPieces + 2 <= 5) {
                plan[id] = 2;
                dfs(index + 1, usedPieces + 2, plan);
                delete plan[id];
            }
            if (usedPieces + 5 <= 5) {
                plan[id] = 5;
                dfs(index + 1, usedPieces + 5, plan);
                delete plan[id];
            }
        } else {
            if (usedPieces + 3 <= 5) {
                plan[id] = 3;
                dfs(index + 1, usedPieces + 3, plan);
                delete plan[id];
            }
        }
    }

    dfs(0, 0, {});

    if (exhaustive) {
        results.sort((a, b) => b.avgDamage - a.avgDamage);
    }

    return {
        baseAvg,
        results: results.map(r => ({
            setPlan: r.setPlan,
            totalPieces: r.totalPieces,
            avgDamage: r.avgDamage,
        })),
    };
}

export function runSetSuggestor(form, options = {}) {
    const ctx      = generateSetPlanContext(form);
    const current  = form.equippedEchoes ?? [];

    const fivePieceSets  = options.fivePieceSets  ?? DEFAULT_FIVE_PIECE_SETS;
    const threePieceSets = options.threePieceSets ?? DEFAULT_THREE_PIECE_SETS;
    const topK           = options.topK          ?? 10;

    const nonNullCount = current.reduce(
        (count, e) => (e != null ? count + 1 : count),
        0
    );

    const { baseAvg, results } = suggestSetPlans({
        ctx,
        fivePieceSets,
        threePieceSets,
        topK,
        exhaustive: true,
    });

    const filtered = results.filter(r =>
        r.totalPieces <= nonNullCount &&
        isSetPlanFeasible(r.setPlan, current)
    );

    return {
        baseAvg,
        results: filtered,
    };
}