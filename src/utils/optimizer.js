import {computeSkillDamage, getSkillData} from "./computeSkillDamage.js";
import {getFinalStats} from "./getStatsForLevel.js";
import {removeEchoArrayFromBuffs, useDefaultRNG, useFastRNG} from "./echoGenerator.js";
import {validSubstatRanges} from "./echoHelper.js";
import {
    applySetEffectsToBuffs,
    echoSetBuffs,
    getSetPlanFromEchoes,
    removeSetEffectsFromBuffs,
    setEffectBuffMap
} from "../data/buffs/setEffect.js";

let rand = Math.random;

export function addEchoArrayToBuffs(baseBuffs, echoes) {
    if (!baseBuffs || !Array.isArray(echoes)) return baseBuffs ?? {};

    const buffs = { ...baseBuffs };

    for (let i = 0; i < echoes.length; i++) {
        const echo = echoes[i];
        if (!echo) continue;

        const stats = echo._totalStats || {
            ...echo.mainStats,
            ...echo.subStats
        };

        for (const key in stats) {
            const val = stats[key];
            if (val == null || val === 0) continue;
            buffs[key] = (buffs[key] ?? 0) + val;
        }
    }

    return buffs;
}

export async function findBestEchoSetFromArray(
    context,
    availableEchoes = [],
    iterations = 2000,
    targetEnergyRegen,
    baseCharacterState,
    mergedBuffs,
    equippedEchoes = [],
    statWeight,
    seed = null,
    endEarly = true,
    setId = null,
    mainEchoId = null
) {
    if (seed != null) useFastRNG(seed);
    else useDefaultRNG();
    const seenCombos = new Set();

    const MAX_COST = 12;
    const ELITE_SIZE = 10;

    if (!Array.isArray(availableEchoes) || availableEchoes.length === 0) {
        console.warn("⚠️ No available echoes to evaluate.");
        return null;
    }

    // --- 1️⃣ Handle single/multi-set filter ---
    let filteredEchoes = availableEchoes;
    let multiSetPlan = null;
    let isMultiSet = Array.isArray(setId);

    if (isMultiSet) {
        const totalCount = setId.reduce((sum, s) => sum + (s.count ?? 0), 0);
        if (totalCount > 5 || totalCount <= 0) {
            console.warn("⚠️ Invalid multi-set configuration. Using all sets instead.");
            isMultiSet = false;
        } else {
            multiSetPlan = structuredClone(setId);
            const allowedSetIds = new Set(multiSetPlan.map(s => s.setId));

            filteredEchoes = availableEchoes.filter(e => {
                const sid = e?.selectedSet ?? e?.setId;
                const sets = e?.sets ?? [];
                return allowedSetIds.has(sid) || sets.some(x => allowedSetIds.has(x));
            });

            if (filteredEchoes.length === 0) {
                console.warn(`⚠️ No echoes found for multi-set plan [${[...allowedSetIds].join(", ")}].`);
                filteredEchoes = availableEchoes;
                isMultiSet = false;
            } else {
                console.log(
                    `🎯 Multi-set plan: ${multiSetPlan
                        .map(s => `${s.setId}×${s.count}`)
                        .join(", ")} (${filteredEchoes.length} echoes kept)`
                );
            }
        }
    }

    if (!isMultiSet && setId != null) {
        filteredEchoes = availableEchoes.filter(
            e => e?.selectedSet === setId || e?.setId === setId
        );
        if (filteredEchoes.length === 0) {
            console.warn(`⚠️ No echoes found for setId=${setId}, using full pool.`);
            filteredEchoes = availableEchoes;
        }
    }


    let mainEcho = null;
    if (mainEchoId != null) {
        mainEcho = filteredEchoes.find(e => e.id === String(mainEchoId));

        if (!mainEcho) {
            console.error(`❌ Main Echo with id=${mainEchoId} not found in the current filtered pool.`);
            return {
                success: false,
                message: `Main Echo ID ${mainEchoId} not found in the current filtered pool.`,
                echoes: [],
                totalCost: 0,
                damage: 0,
                achievedER: 0,
            };
        }
    }

    let clonedMergedBuffs = structuredClone(mergedBuffs);
    clonedMergedBuffs = removeEchoArrayFromBuffs(clonedMergedBuffs, equippedEchoes);
    const runtime = context.characterRuntimeStates?.[context.charId];
    //const activeStates = runtime?.activeStates ?? {};
    const currentSetPlan = getSetPlanFromEchoes(equippedEchoes);
    clonedMergedBuffs = removeSetEffectsFromBuffs(clonedMergedBuffs, currentSetPlan, runtime);
    const frozenMergedBuffs = Object.freeze(structuredClone(clonedMergedBuffs));

    const baselineDamage =
        context.characterRuntimeStates?.[context.charId]?.allSkillResults
            ?.find(skill => skill.name === context.levelData?.Name)?.avg ?? 0;

    const elitePool = [];
    let temperature = 1.0;
    let noImprovement = 0;

    const validEchoes = filteredEchoes
        .map(e => {
            if (!e) return null;
            const totalStats = { ...(e.mainStats || {}) };
            for (const [k, v] of Object.entries(e.subStats || {})) {
                totalStats[k] = (totalStats[k] ?? 0) + v;
            }
            return { ...e, _totalStats: totalStats };
        })
        .filter(e => e && e.cost && Object.keys(e._totalStats).length);

    function isValidMultiSetComposition(echoes, plan) {
        if (!isMultiSet || !Array.isArray(plan)) return true;

        const counts = {};
        for (const e of echoes) {
            const sid = e?.selectedSet ?? e?.setId;
            if (!sid) continue;
            counts[sid] = (counts[sid] ?? 0) + 1;
        }

        for (const req of plan) {
            const have = counts[req.setId] ?? 0;
            if (have !== req.count) return false;
        }

        const allowed = new Set(plan.map(p => p.setId));
        for (const sid of Object.keys(counts)) {
            if (!allowed.has(Number(sid))) return false;
        }

        return true;
    }



    const { combos, bestPlans } = getTopEchoesByStatWeight(
        validEchoes,
        statWeight,
        MAX_COST,
        5
    );
    const topEchoes = combos[0].echoes;
    const bestScore = Array.isArray(topEchoes)
        ? topEchoes.reduce((sum, e) => sum + (e._score ?? 0), 0)
        : 0;
    const similarPool = validEchoes.filter(
        e => e._score >= 0.9 * Math.max(...validEchoes.map(v => v._score ?? 0))
    );

    function randomEchoSet(bestPlans) {
        const chosenPlan =
            bestPlans[Math.floor(rand() * bestPlans.length)] ?? null;

        const plan = chosenPlan ? structuredClone(chosenPlan.sets) : null;
        const pool = [...validEchoes];
        const result = [];
        const usedIds = new Set();
        let totalCost = 0;

        if (mainEcho && mainEcho.cost <= MAX_COST) {
            result.push(mainEcho);
            usedIds.add(mainEcho.id);
            totalCost += mainEcho.cost;
            if (isMultiSet) {
                const match = plan.find(p =>
                    p.setId === (mainEcho.selectedSet ?? mainEcho.setId)
                );
                if (match) match.count = Math.max(0, match.count - 1);
            }
        }

        while (result.length < 5 && totalCost < MAX_COST && pool.length) {
            let validCandidates = pool.filter(
                e => !usedIds.has(e.id) && totalCost + e.cost <= MAX_COST
            );

            if (isMultiSet) {
                const remainingSets = plan.filter(p => p.count > 0).map(p => p.setId);
                if (remainingSets.length)
                    validCandidates = validCandidates.filter(e =>
                        remainingSets.includes(e.selectedSet ?? e.setId)
                    );
            }

            if (validCandidates.length === 0) break;

            const weights = validCandidates.map(e => {
                const sid = e.selectedSet ?? e.setId;
                const existing = result.filter(x => (x.selectedSet ?? x.setId) === sid).length;

                let base = e._score ?? 0.1;
                let bias = 1.0;

                const targetPlan = plan.find(p => p.setId === sid);
                if (targetPlan) {
                    const remaining = Math.max(targetPlan.count, 0);
                    bias *= 1.5 + remaining * 0.6;
                } else {
                    bias *= 0.8;
                }

                // --- within-plan, also reward completing near-full sets
                if (existing >= 3) bias *= 3.5;     // big reward for 4→5
                else if (existing === 2) bias *= 1.8;
                else if (existing === 1) bias *= 1.3;

                // --- small penalty for introducing too many unique sets
                const uniqueSets = new Set(result.map(x => x.selectedSet ?? x.setId));
                if (uniqueSets.size >= 2 && !uniqueSets.has(sid)) bias *= 0.06;

                return base * bias;
            });

            // --- weighted random pick
            const totalWeight = weights.reduce((a, b) => a + b, 0);
            let roll = rand() * totalWeight;
            let echo = null;
            for (let i = 0; i < validCandidates.length; i++) {
                roll -= weights[i];
                if (roll <= 0) {
                    echo = validCandidates[i];
                    break;
                }
            }
            if (!echo) break;

            result.push(echo);
            usedIds.add(echo.id);
            totalCost += echo.cost;

            if (isMultiSet) {
                const match = plan.find(
                    p => p.setId === (echo.selectedSet ?? echo.setId)
                );
                if (match) match.count = Math.max(0, match.count - 1);
            }

            if (isMultiSet && plan.every(p => p.count <= 0)) break;
        }

        // --- ensure mainEcho first
        if (mainEcho) {
            const idx = result.findIndex(e => e.id === mainEcho.id);
            if (idx === -1 && totalCost + mainEcho.cost <= MAX_COST) result.unshift(mainEcho);
            else if (idx > 0) {
                const [main] = result.splice(idx, 1);
                result.unshift(main);
            }
        }

        // --- validate and trim
        if (isMultiSet && !isValidMultiSetComposition(result, multiSetPlan))
            return randomEchoSet();

        return result.slice(0, 5);
    }

    function mutateEchoSet(prevSet) {
        const plan = isMultiSet ? structuredClone(multiSetPlan) : null;
        const mutated = [...prevSet];
        const usedIds = new Set(mutated.map(e => e.id));
        const pool = validEchoes.filter(e => !usedIds.has(e.id));

        if (mutated.length === 0 || pool.length === 0) return randomEchoSet(bestPlans);

        let total = mutated.reduce((a, e) => a + e.cost, 0);
        let idx = Math.floor(rand() * mutated.length);
        if (mainEcho && mutated[idx]?.id === mainEcho.id) idx = (idx + 1) % mutated.length;

        let replacement = null;
        for (let t = 0; t < 30 && !replacement; t++) {
            const candidate = pool[Math.floor(rand() * pool.length)];
            const nextSet = isMultiSet ? plan.find(p => p.count > 0)?.setId : null;
            if (
                total + candidate.cost <= MAX_COST &&
                (!isMultiSet ||
                    (nextSet &&
                        (candidate.selectedSet === nextSet ||
                            candidate.setId === nextSet)))
            ) {
                replacement = candidate;
            }
        }

        if (replacement) {
            total = total - mutated[idx].cost + replacement.cost;
            mutated[idx] = replacement;
        }

        while (total > MAX_COST && mutated.length > 1) total -= mutated.pop().cost;

        if (isMultiSet && !isValidMultiSetComposition(mutated, multiSetPlan)) {
            const attempt = randomEchoSet(bestPlans);
            if (isValidMultiSetComposition(attempt, multiSetPlan)) return attempt;
        }

        if (mainEcho) {
            const idxMain = mutated.findIndex(e => e.id === mainEcho.id);
            if (idxMain === -1 && total + mainEcho.cost <= MAX_COST) mutated.unshift(mainEcho);
            else if (idxMain > 0) {
                const [main] = mutated.splice(idxMain, 1);
                mutated.unshift(main);
            }
        }

        return mutated.slice(0, 5);
    }

    function selectParent() {
        if (!elitePool.length || rand() < 0.25) return randomEchoSet(bestPlans);
        const idx = Math.floor(Math.pow(rand(), 2) * elitePool.length);
        return structuredClone(elitePool[idx].echoes);
    }

    // --- Evaluation ---
    const evaluateSet = (echoes) => {
        const totalCost = echoes.reduce((a, e) => a + e.cost, 0);
        if (totalCost > MAX_COST) return null;
        if (isMultiSet && !isValidMultiSetComposition(echoes, multiSetPlan)) return null;

        // 🧱 1️⃣ Add echo stats to buffs
        const buffsWithEchoes = addEchoArrayToBuffs(frozenMergedBuffs, echoes);

        // 🧩 2️⃣ Derive set composition automatically
        const sets = getSetPlanFromEchoes(echoes);

        // 🪄 3️⃣ Apply set effects to buffs
        const buffsWithSetEffects = applySetEffectsToBuffs(
            structuredClone(buffsWithEchoes),
            sets,
            context.characterRuntimeStates?.[context.charId]
        );

        // 🧮 4️⃣ Compute final stats
        const withEchoStats = getFinalStats(
            context.activeCharacter,
            baseCharacterState,
            context.characterRuntimeStates?.[context.charId]?.CharacterLevel,
            buffsWithSetEffects,
            context.characterRuntimeStates?.[context.charId]?.CombatState
        );

        //if (sets === 11) console.log(withEchoStats, buffsWithSetEffects, sets);

        // ⚔️ 5️⃣ Calculate damage using buffs + set effects
        const totalDamage = computeSkillDamage({
            entry: context.entry,
            levelData: context.levelData,
            activeCharacter: context.activeCharacter,
            characterRuntimeStates: context.characterRuntimeStates,
            finalStats: withEchoStats,
            combatState: context.characterRuntimeStates?.[context.charId]?.CombatState,
            mergedBuffs: buffsWithSetEffects,
            sliderValues: context.characterRuntimeStates?.[context.charId]?.SkillLevels,
            characterLevel: context.characterRuntimeStates?.[context.charId]?.CharacterLevel,
            getSkillData,
        });

        // ⚡ 6️⃣ Compute total Energy Regen contribution
        const achievedER = echoes.reduce(
            (sum, e) =>
                sum +
                (e.mainStats?.energyRegen ?? 0) +
                (e.subStats?.energyRegen ?? 0),
            0
        );

        if (targetEnergyRegen && achievedER < targetEnergyRegen - 1) return null;

        return {
            echoes,
            totalCost,
            totalDamage,
            achievedER,
            withEchoStats,
            damage: totalDamage?.avg ?? 0,
            success: true,
        };
    };

    // --- Weighted seed ---
    let best = evaluateSet(topEchoes);
    const topResults = [];

    if (best && best.damage !== -Infinity) {
        const sig = best.echoes.map(e => e.id).join("-");
        topResults.push({ ...best, signature: sig, rank: 1 });
    } else best = { damage: -Infinity };

    // --- Optimization loop ---
    for (let i = 0; i < iterations; i++) {
        const parent = selectParent();
        const candidateSet = rand() < temperature
            ? randomEchoSet(bestPlans)
            : mutateEchoSet(parent);

        const sig = candidateSet.map(e => e.id).sort().join("-");
        if (seenCombos.has(sig)) {
            continue;
        }
        seenCombos.add(sig);

        const candidate = evaluateSet(candidateSet);
        if (!candidate) continue;

        const dmg = candidate.damage ?? 0;

        const existing = topResults.findIndex(t => t.signature === sig);
        if (existing !== -1) {
            if (dmg > (topResults[existing].damage ?? 0))
                topResults[existing] = { ...candidate, signature: sig };
        } else {
            topResults.push({ ...candidate, signature: sig });
        }
        topResults.sort((a, b) => b.damage - a.damage);
        if (topResults.length > 5) topResults.length = 5;

        if (dmg > best.damage) {
            best = candidate;
            best.iterationFound = i + 1;
            elitePool.unshift(best);
            if (elitePool.length > ELITE_SIZE) elitePool.pop();
            noImprovement = 0;
            //console.log(`🔥 New best at iteration ${i + 1}: ${dmg.toFixed(1)} dmg`);
        } else noImprovement++;

        temperature *= 0.995;
        if (noImprovement > iterations * 0.2 && elitePool.length > 2) {
            temperature = 1.0;
            noImprovement = 0;
            elitePool.splice(Math.floor(elitePool.length / 2));
        }

        if (endEarly && i > iterations * 0.2 && best.damage === -Infinity) {
            console.warn(`🛑 Early stop — no valid set after ${i} iterations`);
            break;
        }
    }

    if (topResults.length === 0) {
        return {
            success: false,
            echoes: [],
            totalCost: 0,
            damage: baselineDamage,
            achievedER: 0,
            message: "No valid prebuilt echo set met ER target",
        };
    }

    // Ensure mainEcho always first
    for (const combo of topResults) {
        if (mainEcho && combo.echoes?.length) {
            const idx = combo.echoes.findIndex(e => e.id === mainEcho.id);
            if (idx === -1 && combo.totalCost + mainEcho.cost <= MAX_COST) {
                combo.echoes.unshift(mainEcho);
            } else if (idx > 0) {
                const [main] = combo.echoes.splice(idx, 1);
                combo.echoes.unshift(main);
            }
        }
    }

    topResults.sort((a, b) => b.damage - a.damage);
    topResults.forEach((res, i) => {
        res.prevDamage = baselineDamage;
        res.gain = ((res.damage - baselineDamage) / (baselineDamage || 1)) * 100;
        res.success = true;
        res.rank = i + 1;
    });

    return {
        success: true,
        topResults,
        best: topResults[0],
    };
}

const MAINSTAT_MAX = 44;
const MAX_COMBOS = 200;

export function getTopEchoesByStatWeight(
    availableEchoes = [],
    statWeight = {},
    maxCost = 12,
    maxCount = 5,
    numSets = 1,
) {
    if (!Array.isArray(availableEchoes) || availableEchoes.length === 0) {
        console.warn("⚠️ No echoes available for ranking.");
        return [];
    }

    // --- Normalization helpers ---
    const normalizeMain = (s, v) => (s.endsWith("Flat") ? 0 : v / MAINSTAT_MAX);
    const normalizeSub = (s, v) => {
        const r = validSubstatRanges[s];
        return r ? v / r.max : 0;
    };

    const weighted = (s, v, { normalize = true } = {}) => {
        const w = statWeight[s] ?? 0;
        if (!w) return 0;
        const val = normalize
            ? (validSubstatRanges[s] ? normalizeSub(s, v) : normalizeMain(s, v))
            : v;
        return val * w;
    };

    // --- Evaluate each set’s weighted potential ---
    function getSetWeightedValue(setId) {
        const setData = echoSetBuffs[setId];
        const effData = setEffectBuffMap[setId];
        let twoPiece = 0, threePiece = 0, fivePiece = 0;

        if (setData?.twoPiece)
            for (const [s, v] of Object.entries(setData.twoPiece))
                twoPiece += weighted(s, v, { normalize: false });
        if (setData?.fivePiece)
            for (const [s, v] of Object.entries(setData.fivePiece))
                fivePiece += weighted(s, v, { normalize: false });

        if (effData) {
            const maxPieces = effData.setMax ?? 5;
            for (const [key, buffs] of Object.entries(effData)) {
                if (key === "setMax") continue;
                const maxB = buffs.max ?? buffs;
                for (const [s, v] of Object.entries(maxB)) {
                    if (maxPieces === 3)
                        threePiece += weighted(s, v, { normalize: false });
                    else
                        fivePiece += weighted(s, v, { normalize: false });
                }
            }
        }

        return { setId, twoPiece, threePiece, fivePiece, setMax: effData?.setMax ?? 5 };
    }

    // --- Find the best feasible set combinations ---
    function getBestSetPlans() {
        const avail = {};
        for (const e of availableEchoes) {
            const sid = e?.selectedSet ?? e?.setId;
            if (!sid) continue;
            avail[sid] = (avail[sid] ?? 0) + 1;
        }

        const allSetIds = [
            ...new Set([
                ...Object.keys(echoSetBuffs).map(Number),
                ...Object.keys(setEffectBuffMap).map(Number),
            ]),
        ];

        const sets = allSetIds
            .map(id => getSetWeightedValue(id))
            .sort(
                (a, b) =>
                    b.twoPiece + b.threePiece + b.fivePiece -
                    (a.twoPiece + a.threePiece + a.fivePiece)
            );

        const plans = [];
        const pushPlan = (type, setsArr, score) =>
            plans.push({ type, sets: setsArr, score });

        // Full 5pc and 3pc
        for (const s of sets) {
            const have = avail[s.setId] ?? 0;
            if (s.setMax === 5 && have >= 5)
                pushPlan("5pc", [{ setId: s.setId, count: 5 }], s.twoPiece + s.fivePiece);
            if (s.setMax === 3 && have >= 3)
                pushPlan("3pc", [{ setId: s.setId, count: 3 }], s.twoPiece + s.threePiece);
        }

        // 2 + 3 combo
        const fives = sets.filter(s => s.setMax === 5);
        const threes = sets.filter(s => s.setMax === 3);

        for (const s5 of fives) {
            const have5 = avail[s5.setId] ?? 0;
            if (have5 < 2) continue;
            const best3 = threes
                .filter(s3 => (avail[s3.setId] ?? 0) >= 3)
                .sort((a, b) => b.threePiece - a.threePiece)[0];
            if (best3)
                pushPlan(
                    "2+3",
                    [
                        { setId: s5.setId, count: 2 },
                        { setId: best3.setId, count: 3 },
                    ],
                    s5.twoPiece + best3.threePiece
                );
        }

        // 2 + 2 combo
        for (let i = 0; i < sets.length; i++) {
            const A = sets[i];
            if ((avail[A.setId] ?? 0) < 2) continue;
            for (let j = i + 1; j < sets.length; j++) {
                const B = sets[j];
                if ((avail[B.setId] ?? 0) < 2) continue;
                pushPlan(
                    "2+2",
                    [
                        { setId: A.setId, count: 2 },
                        { setId: B.setId, count: 2 },
                    ],
                    A.twoPiece + B.twoPiece
                );
            }
        }

        // Single 2pc fallback
        for (const s of sets)
            if ((avail[s.setId] ?? 0) >= 2)
                pushPlan("2pc", [{ setId: s.setId, count: 2 }], s.twoPiece);

        const desirability = { "5pc": 5, "2+3": 5, "3pc": 4, "2+2": 4, "2pc": 3 };
        return plans
            .sort(
                (a, b) =>
                    (desirability[b.type] ?? 0) - (desirability[a.type] ?? 0) ||
                    b.score - a.score
            )
            .slice(0, 20);
    }

    const bestPlans = getBestSetPlans();

    /*console.groupCollapsed("🎯 Best Set Plans (Ranked)");
    for (const p of bestPlans) {
        const label = p.sets
            .map(s => `${s.setId}×${s.count}`)
            .join(" + ");
        console.log(
            `[${p.type}] → ${label} | score=${p.score.toFixed(2)}`
        );
    }
    console.groupEnd();*/

    // --- Score each echo individually ---
    const scored = availableEchoes
        .map(e => {
            const mains = Object.entries(e.mainStats ?? {});
            const subs = Object.entries(e.subStats ?? {});
            const setId = e.selectedSet;
            let base = 0;
            for (const [s, v] of mains) base += weighted(s, v);
            for (const [s, v] of subs) base += weighted(s, v);

            let potential = 0;
            const setData = echoSetBuffs[setId];
            const eff = setEffectBuffMap[setId];
            if (setData)
                for (const buffs of Object.values(setData))
                    for (const [s, v] of Object.entries(buffs))
                        potential += weighted(s, v, { normalize: false });
            if (eff)
                for (const [key, buffs] of Object.entries(eff)) {
                    if (key === "setMax") continue;
                    const maxB = buffs.max ?? buffs;
                    for (const [s, v] of Object.entries(maxB))
                        potential += weighted(s, v, { normalize: false });
                }

            return {
                ...e,
                _baseScore: base * 10,
                _potentialSetScore: potential,
                _rankingScore: base + potential,
            };
        })
        .filter(e => e.cost && !isNaN(e._baseScore))
        .sort((a, b) => b._rankingScore - a._rankingScore);

    const pool = scored.slice(0, 30);

    // --- Random combo biased toward set plans ---
    function pickRandomCombo() {
        const plan = bestPlans[Math.floor(Math.random() * bestPlans.length)];
        const chosen = [];
        const used = new Set();
        let totalCost = 0;

        for (const { setId, count } of plan.sets) {
            const candidates = pool.filter(e => e.selectedSet === setId);
            for (let i = 0; i < count && candidates.length; i++) {
                const c = candidates[Math.floor(Math.random() * candidates.length)];
                if (!used.has(c.id) && totalCost + c.cost <= maxCost) {
                    chosen.push(c);
                    used.add(c.id);
                    totalCost += c.cost;
                }
            }
        }

        for (const e of pool) {
            if (chosen.length >= maxCount) break;
            if (used.has(e.id)) continue;
            if (totalCost + e.cost > maxCost) continue;
            chosen.push(e);
            used.add(e.id);
            totalCost += e.cost;
        }

        return chosen.length === maxCount ? chosen : null;
    }

    // --- Evaluate a combination ---
    function evaluateCombo(echoes) {
        const baseSum = echoes.reduce((a, e) => a + e._baseScore, 0);
        const counts = {};
        for (const e of echoes) {
            const sid = e.selectedSet;
            if (!sid) continue;
            counts[sid] = (counts[sid] ?? 0) + 1;
        }

        let setScore = 0;
        for (const [sidStr, count] of Object.entries(counts)) {
            const sid = Number(sidStr);
            const data = echoSetBuffs[sid];
            const eff = setEffectBuffMap[sid];
            if (data) {
                if (count >= 2 && data.twoPiece)
                    for (const [s, v] of Object.entries(data.twoPiece))
                        setScore += weighted(s, v, { normalize: false });
                if (count >= 5 && data.fivePiece)
                    for (const [s, v] of Object.entries(data.fivePiece))
                        setScore += weighted(s, v, { normalize: false });
            }
            if (eff) {
                const req = count >= (eff.setMax ?? 5);
                if (req)
                    for (const [key, buffs] of Object.entries(eff)) {
                        if (key === "setMax") continue;
                        const maxB = buffs.max ?? buffs;
                        for (const [s, v] of Object.entries(maxB))
                            setScore += weighted(s, v, { normalize: false });
                    }
            }
        }

        return { echoes, baseSum, setScore, totalScore: baseSum + setScore };
    }

    const combos = [];

    for (let i = 0; i < MAX_COMBOS; i++) {
        const combo = pickRandomCombo();
        if (!combo) continue;
        const res = evaluateCombo(combo);

        const comboKey = res.echoes.map(e => e.id).sort().join("-");
        if (!combos.some(c => c.key === comboKey)) {
            combos.push({ ...res, key: comboKey });
        }
    }

    const sortedCombos = combos.sort((a, b) => b.totalScore - a.totalScore);

    const topCombos = sortedCombos.slice(0, Math.min(numSets, sortedCombos.length));

    const formatted = topCombos.map(res => ({
        echoes: res.echoes.map(e => ({
            ...e,
            _baseScore: e._baseScore,
            _potentialSetScore: e._potentialSetScore,
            _rankingScore: e._rankingScore,
            _activeSetScore: res.setScore,
            _totalScore: res.totalScore,
        })),
        totalScore: res.totalScore,
        setScore: res.setScore,
    }));

    return { combos: formatted, bestPlans };
}