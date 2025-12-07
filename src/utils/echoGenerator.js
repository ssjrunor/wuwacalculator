import {
    applyFixedSecondMainStat,
    getValidMainStats,
    validSubstatRanges,
    snapToNearestSubstatValue,
    normalizeLegacyEchoStats
} from "./echoHelper.js";
import {computeSkillDamage, getSkillData} from "./computeSkillDamage.js";
import {getFinalStats} from "./getStatsForLevel.js";
import {initWorkerPool} from "../optimizer/gpu/GpuWorkerPool.js";
import {encodeEchoStats} from "../optimizer/encodeEchoStats.js";
import {countEchoCombos, generateEchoPermutationBatches2} from "../optimizer/generateEchoCombos.js";
import {runGpuEchoOptimizer} from "../optimizer/GpuEchoOptimizer.js";
import {prepareGpuContext} from "../optimizer/prepareGpuContext.js";
import {generateEchoContext} from "../optimizer/echoOptimizerContext.js";
import {applyStatToMerged} from "../data/buffs/setEffect.js";

let rand = Math.random;

export function makeFastRNG(seed = Date.now()) {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

export function useFastRNG(seed) {
    rand = makeFastRNG(seed);
}

export function useDefaultRNG() {
    rand = Math.random;
}


const ER_RANGE = validSubstatRanges.energyRegen;
const ER_POSSIBLE_ROLLS = (() => {
    const step = (ER_RANGE.max - ER_RANGE.min) / (ER_RANGE.divisions - 1);
    const arr = new Float32Array(ER_RANGE.divisions);
    for (let i = 0; i < ER_RANGE.divisions; i++) {
        arr[i] = Math.round((ER_RANGE.min + step * i) * 10) / 10;
    }
    return arr;
})();

const round1 = n => Math.round(n * 10) / 10;

export function randomSubValue(statKey, rollQuality = 0) {
    const range = validSubstatRanges[statKey];
    if (!range) return 0;

    const step = (range.max - range.min) / (range.divisions - 1);
    const targetIndex = Math.round(rollQuality * (range.divisions - 1));
    const windowStart = Math.max(0, targetIndex - 1);
    const windowEnd = Math.min(range.divisions - 1, targetIndex + 1);

    const randomIndex =
        Math.floor(rand() * (windowEnd - windowStart + 1)) + windowStart;
    const value = range.min + step * randomIndex;

    return snapToNearestSubstatValue(statKey, round1(value));
}

export function generateMainStats(cost, charId, bias = 1, targetEnergyRegen = null, statWeight) {
    const valid = getValidMainStats(cost);
    const keys = Object.keys(valid);
    if (keys.length === 0) return applyFixedSecondMainStat({}, cost);

    const weights = statWeight;

    const filteredKeys =
        (targetEnergyRegen ?? 0) < (valid.energyRegen ?? Infinity)
            ? keys.filter(k => k !== "energyRegen")
            : keys;

    let total = 0, count = 0;
    for (const k in weights) {
        total += weights[k];
        count++;
    }
    const avgWeight = total / (count || 1);

    let totalWeight = 0;
    const adjusted = new Array(filteredKeys.length);
    for (let i = 0; i < filteredKeys.length; i++) {
        const k = filteredKeys[i];
        const base = weights[k] ?? 1e-5;
        const w = avgWeight + (base - avgWeight) * bias + 0.00001;
        adjusted[i] = { key: k, w: Math.max(w, 0.00001) };
        totalWeight += adjusted[i].w;
    }

    let roll = rand() * totalWeight;
    let chosen = adjusted[0].key;
    for (let i = 0; i < adjusted.length; i++) {
        roll -= adjusted[i].w;
        if (roll <= 0) {
            chosen = adjusted[i].key;
            break;
        }
    }

    const mainStats = { [chosen]: valid[chosen] };
    return applyFixedSecondMainStat(mainStats, cost);
}

export function findBestERSplit(target, maxEchoes = 5, rollQuality = 0.5) {
    if (!ER_RANGE) return { sum: 0, combo: [] };

    const targetIndex = Math.round(rollQuality * (ER_RANGE.divisions - 1));
    const windowStart = Math.max(0, targetIndex - 1);
    const windowEnd = Math.min(ER_RANGE.divisions - 1, targetIndex + 1);
    const ER = ER_POSSIBLE_ROLLS.subarray(windowStart, windowEnd + 1);

    const maxPossible = ER[ER.length - 1] * maxEchoes;
    const clampedTarget = Math.min(target, maxPossible);

    let bestSum = Infinity;
    let bestCombo = new Array(maxEchoes);

    const stack = [{ i: 0, combo: [], sum: 0 }];
    const n = ER.length;

    while (stack.length) {
        const node = stack.pop();
        const { combo, sum } = node;

        if (combo.length === maxEchoes) {
            if (sum >= clampedTarget && sum < bestSum) {
                bestSum = sum;
                bestCombo = combo.slice();
            }
            continue;
        }

        for (let j = 0; j < n; j++) {
            const nextSum = sum + ER[j];
            if (nextSum > clampedTarget + ER[n - 1]) continue;
            const nextCombo = combo.concat(ER[j]);
            stack.push({ combo: nextCombo, sum: nextSum });
        }
    }

    if (!isFinite(bestSum) || !bestCombo.length) {
        bestCombo = Array(maxEchoes).fill(ER[0]);
        bestSum = ER[0] * maxEchoes;
    }

    return { sum: bestSum, combo: bestCombo };
}

export function getRandomSubstat(charId, bias = 0.5, includeEnergyRegen = false, statWeight) {
    const weights = statWeight ?? {};
    const allKeys = Object.keys(validSubstatRanges);

    // Filter out ER if not allowed
    const filteredKeys = allKeys.filter(k => includeEnergyRegen || k !== "energyRegen");

    const nonZeroKeys = filteredKeys.filter(k => (weights[k] ?? 0) > 0);
    const zeroKeys = filteredKeys.filter(k => (weights[k] ?? 0) <= 0);

    // Always treat ER as desirable if allowed
    if (includeEnergyRegen && !nonZeroKeys.includes("energyRegen") && filteredKeys.includes("energyRegen")) {
        nonZeroKeys.push("energyRegen");
        const idx = zeroKeys.indexOf("energyRegen");
        if (idx !== -1) zeroKeys.splice(idx, 1);
    }

    const baseChance = 0.6;
    const scaledChance = baseChance * (0.5 + bias);
    const pickNonZero = Math.random() < scaledChance;

    let chosenPool;
    if (pickNonZero && nonZeroKeys.length) {
        chosenPool = nonZeroKeys;
    } else {
        chosenPool = filteredKeys;
    }

    let total = 0, count = 0;
    for (const k of chosenPool) {
        total += weights[k] ?? 0;
        count++;
    }
    const avg = total / (count || 1);

    const adjusted = new Array(chosenPool.length);
    let totalWeight = 0;

    for (let i = 0; i < chosenPool.length; i++) {
        const k = chosenPool[i];
        const base = weights[k] ?? 0;
        const w = avg + (base - avg) * bias + 0.001;
        adjusted[i] = [k, Math.max(w, 0.001)];
        totalWeight += adjusted[i][1];
    }

    let roll = Math.random() * totalWeight;
    for (let i = 0; i < adjusted.length; i++) {
        roll -= adjusted[i][1];
        if (roll <= 0) return adjusted[i][0];
    }

    return adjusted[adjusted.length - 1][0];
}

export function generateRandomEcho(
    charId,
    cost = 4,
    bias = 0,
    erValue = null,
    rollQuality = 0.5,
    mainEr = false,
    statWeight
) {
    const subStats = Object.create(null);
    const maxSubs = 5;

    let mainStats;
    if (mainEr) {
        const valid = getValidMainStats(cost);
        if (!valid.energyRegen) {
            mainStats = generateMainStats(cost, charId, 1, null, statWeight);
        } else {
            mainStats = { energyRegen: valid.energyRegen };
            mainStats = applyFixedSecondMainStat(mainStats, cost);
        }
    } else {
        mainStats = generateMainStats(cost, charId, 1, null, statWeight);
    }

    while (Object.keys(subStats).length < maxSubs) {
        const key = getRandomSubstat(charId, bias, erValue !== null && erValue > 0, statWeight);
        if (!subStats[key]) subStats[key] = randomSubValue(key, rollQuality);
    }

    if (erValue != null && erValue > 0) {
        if (!("energyRegen" in subStats)) {
            const weights = statWeight;
            let weakestKey = null;
            let minWeight = Infinity;
            for (const k in subStats) {
                const w = weights[k] ?? 0;
                if (w < minWeight) {
                    minWeight = w;
                    weakestKey = k;
                }
            }
            if (weakestKey) delete subStats[weakestKey];
        }
        subStats.energyRegen = snapToNearestSubstatValue("energyRegen", Math.max(0, erValue));
    }

    const totalStats = Object.create(null);
    for (const k in mainStats) totalStats[k] = mainStats[k];
    for (const k in subStats) totalStats[k] = (totalStats[k] ?? 0) + subStats[k];

    Object.defineProperty(totalStats, "_cached", { value: true, enumerable: false });

    return { cost, mainStats, subStats, _totalStats: totalStats };
}

export function evaluateFullEchoSetDamage({
                                              characterRuntimeStates,
                                              charId,
                                              activeCharacter,
                                              entry,
                                              levelData,
                                              mergedBuffs,
                                              bias = 0,
                                              cost = [4, 3, 3, 1, 1],
                                              targetEnergyRegen = null,
                                              baseCharacterState,
                                              rollQuality,
                                              statWeight
                                          }) {
    const runtime = characterRuntimeStates?.[charId];
    if (!runtime) return null;

    const wantER = targetEnergyRegen != null && targetEnergyRegen > 0;
    const echoes = [];

    let accumulatedER = 0;
    const totalCost = cost.length > 1 ? cost.reduce((a, b) => a + b, 0) : cost[0];

    const erPlan = wantER
        ? findBestERSplit(targetEnergyRegen, cost.length, rollQuality)
        : { combo: [], sum: 0 };
    const combo = erPlan.combo;
    const maxCost = cost.length;
    const erThreshold = 32;
    let useMainER = false;

    for (let i = 0; i < maxCost; i++) {
        const thisCost = cost[i];
        let erValue = 0;

        if (wantER && accumulatedER < targetEnergyRegen) {
            erValue = combo[i] != null ? combo[i] : 0;
            useMainER = (targetEnergyRegen - accumulatedER) > erThreshold;
        }

        const echo = generateRandomEcho(
            charId,
            thisCost,
            bias,
            erValue,
            rollQuality,
            useMainER,
            statWeight
        );

        const mainER = echo.mainStats.energyRegen || 0;
        const subER = echo.subStats.energyRegen || 0;
        accumulatedER += mainER + subER;
        echoes.push(echo);

        if (accumulatedER >= targetEnergyRegen) useMainER = false;
    }

    const buffsWithEchoes = { ...mergedBuffs };
    for (let i = 0; i < echoes.length; i++) {
        const stats = echoes[i]._totalStats;
        for (const k in stats) {
            buffsWithEchoes[k] = (buffsWithEchoes[k] ?? 0) + stats[k];
        }
    }

    const erTargetReached = !wantER || accumulatedER >= targetEnergyRegen - 1;

    const withEchoStats = getFinalStats(
        activeCharacter,
        baseCharacterState,
        runtime.CharacterLevel,
        buffsWithEchoes,
        runtime.CombatState
    );

    const totalDamage = computeSkillDamage({
        entry,
        levelData,
        activeCharacter,
        characterRuntimeStates,
        finalStats: withEchoStats,
        combatState: runtime.CombatState,
        mergedBuffs: buffsWithEchoes,
        sliderValues: runtime.SkillLevels,
        characterLevel: runtime.CharacterLevel,
        getSkillData,
    });

    let achievedER = 0;
    for (let i = 0; i < echoes.length; i++) {
        const e = echoes[i];
        achievedER += (e.mainStats.energyRegen || 0) + (e.subStats.energyRegen || 0);
    }

    return {
        echoes,
        totalDamage,
        buffsWithEchoes,
        withEchoStats,
        achievedER,
        totalCost,
        erTargetReached,
    };
}

export async function findBestFullEchoSetMonteCarlo(
    context,
    iterations = 500,
    bias = 0.5,
    targetEnergyRegen,
    baseCharacterState,
    rollQuality,
    mergedBuffs,
    equippedEchoes = [],
    statWeight,
    seed = null,
    requiredCost = null,
    onProgress
) {
    if (seed != null) useFastRNG(seed);
    else useDefaultRNG();

    const allowedCosts = [1, 3, 4];
    const MAX_COST = 12;
    const ELITE_SIZE = 10;

    let clonedMergedBuffs = structuredClone(mergedBuffs);
    clonedMergedBuffs = removeEchoArrayFromBuffs(clonedMergedBuffs, equippedEchoes);
    const frozenMergedBuffs = Object.freeze(structuredClone(clonedMergedBuffs));

    let best = { damage: -Infinity };
    const elitePool = [];

    let temperature = 1.0;
    let noImprovement = 0;

    function randomCostCombo() {
        const combo = [];
        let total = 0;

        // Always include requiredCost first if specified
        if (requiredCost != null && allowedCosts.includes(requiredCost)) {
            combo.push(requiredCost);
            total += requiredCost;
        }

        // keep adding until full or cost limit
        while (combo.length < 5 && total < MAX_COST) {
            const options = allowedCosts.filter(c => total + c <= MAX_COST);
            if (!options.length) break;

            // Bias toward higher cost when fewer slots remain
            const biasExp = 2.0; // larger = stronger bias for expensive picks
            const r = Math.pow(rand(), biasExp);
            const cost = options[Math.floor(r * options.length)];
            combo.push(cost);
            total += cost;

            // If we're not full yet, very low chance to stop early
            if (combo.length < 5 && rand() < 0.05) break;
        }

        // cleanup
        while (combo.reduce((a, b) => a + b, 0) > MAX_COST) combo.pop();
        if (combo.length > 5) combo.splice(5);

        // If still short of 5 slots, pad with lowest costs possible
        while (combo.length < 5) {
            const minCost = Math.min(...allowedCosts);
            if (combo.reduce((a,b)=>a+b,0) + minCost <= MAX_COST) combo.push(minCost);
            else break;
        }

        return combo;
    }

    function mutateCostCombo(parentCombo) {
        let mutated = [...parentCombo];

        // Replace one random cost
        const idx = Math.floor(rand() * mutated.length);
        const currentTotal = mutated.reduce((a, b) => a + b, 0);

        const options = allowedCosts.filter(
            c => c !== mutated[idx] && currentTotal - mutated[idx] + c <= MAX_COST
        );

        if (options.length > 0) {
            mutated[idx] = options[Math.floor(rand() * options.length)];
        }

        // Ensure requiredCost is present
        if (requiredCost != null && !mutated.includes(requiredCost)) {
            const total = mutated.reduce((a, b) => a + b, 0);
            if (total + requiredCost <= MAX_COST && mutated.length < 5) {
                mutated.push(requiredCost);
            } else {
                // Replace smallest cost with requiredCost if room is full
                const minIdx = mutated.indexOf(Math.min(...mutated));
                mutated[minIdx] = requiredCost;
            }
        }

        // Trim overflow
        while (mutated.reduce((a, b) => a + b, 0) > MAX_COST && mutated.length > 0) mutated.pop();
        if (mutated.length > 5) mutated.splice(5);

        // Ensure we never return empty
        if (mutated.length === 0) return randomCostCombo();

        return mutated;
    }

    function selectParent() {
        if (!elitePool.length || rand() < 0.25) return randomCostCombo();
        const idx = Math.floor(Math.pow(rand(), 2) * elitePool.length);
        return structuredClone(elitePool[idx].costCombo);
    }

    const evaluateCombo = (costCombo) => {
        const result = evaluateFullEchoSetDamage({
            ...context,
            mergedBuffs: frozenMergedBuffs,
            bias,
            targetEnergyRegen,
            baseCharacterState,
            rollQuality,
            cost: costCombo,
            statWeight
        });
        if (!result?.erTargetReached) return null;
        const damage = result.totalDamage?.avg ?? 0;
        return { ...result, damage, costCombo };
    };

    for (let i = 0; i < iterations; i++) {
        const parent = selectParent();
        const costCombo =
            rand() < temperature ? randomCostCombo() : mutateCostCombo(parent);

        const candidate = evaluateCombo(costCombo);
        if (!candidate) continue;

        const dmg = candidate.damage;

        // accept new best
        if (dmg > best.damage) {
            best = { ...candidate, success: true };
            elitePool.unshift(best);
            if (elitePool.length > ELITE_SIZE) elitePool.pop();
            noImprovement = 0;
        } else {
            noImprovement++;
        }

        // Simulated annealing cooling
        temperature *= 0.995;

        // Stagnation handling
        if (noImprovement > iterations * 0.1 && elitePool.length > 2) {
            temperature = 1.0;
            noImprovement = 0;
            elitePool.splice(Math.floor(elitePool.length / 2));
        }

        if (onProgress && i % Math.ceil(iterations / 100) === 0) {
            onProgress(Math.round((i / iterations) * 100));
        }
    }

    if (onProgress) onProgress(100);

    if (best.damage === -Infinity || best.achievedER < targetEnergyRegen - 1) {
        return {
            success: false,
            echoes: [],
            totalCost: 0,
            achievedER: best.achievedER ?? 0,
            costCombo: [],
            message: "No valid echo set met ER target",
        };
    }

    best.success = true;
    return best;
}

// assumes applyStatToMerged and elementMap etc are already imported in this file

export function removeEchoArrayFromBuffs(mergedBuffs, echoes) {
    if (!mergedBuffs || !Array.isArray(echoes)) return mergedBuffs ?? {};

    // deep clone so we don't mutate the original object
    const newBuffs = structuredClone(mergedBuffs);

    // accumulate everything we want to remove
    const totalEchoStats = {};

    for (const echo of echoes) {
        if (!echo) continue;

        // main stats
        for (const [key, rawVal] of Object.entries(echo.mainStats ?? {})) {
            const value = Number(rawVal ?? 0);
            if (!value) continue;
            totalEchoStats[key] = (totalEchoStats[key] ?? 0) + value;
        }

        // sub stats
        for (const [key, rawVal] of Object.entries(echo.subStats ?? {})) {
            const value = Number(rawVal ?? 0);
            if (!value) continue;
            totalEchoStats[key] = (totalEchoStats[key] ?? 0) + value;
        }
    }

    // now subtract them using the same normalization logic as "apply"
    for (const [key, total] of Object.entries(totalEchoStats)) {
        if (!total) continue;

        switch (key) {
            // flat main stats: map to {stat}.flat
            case 'atkFlat': {
                newBuffs.atk = newBuffs.atk ?? { percent: 0, flat: 0 };
                newBuffs.atk.flat = (newBuffs.atk.flat ?? 0) - total;
                break;
            }
            case 'hpFlat': {
                newBuffs.hp = newBuffs.hp ?? { percent: 0, flat: 0 };
                newBuffs.hp.flat = (newBuffs.hp.flat ?? 0) - total;
                break;
            }
            case 'defFlat': {
                newBuffs.def = newBuffs.def ?? { percent: 0, flat: 0 };
                newBuffs.def.flat = (newBuffs.def.flat ?? 0) - total;
                break;
            }

            // everything else: let the shared normalizer handle it
            // (atkPercent, hpPercent, critRate, critDmg, glacio, aero,
            // resonanceSkill, resonanceLiberation, etc.)
            default: {
                applyStatToMerged(newBuffs, key, -total);
                break;
            }
        }
    }

    return newBuffs;
}

export let ctxObj = {};

export function buildVirtualEchoPool({
                                         charId,
                                         poolSize = 50,
                                         bias = 0.5,
                                         rollQuality = 0.5,
                                         statWeight,
                                         allowedCosts = [1, 3, 4],
                                     }) {
    const echoes = [];
    const kinds = allowedCosts.length;
    if (kinds === 0) return echoes;

    const basePerCost = Math.floor(poolSize / kinds);
    let remainder = poolSize % kinds;

    const perCostCounts = allowedCosts.map(() => basePerCost);

    for (let i = 0; i < perCostCounts.length && remainder > 0; i++, remainder--) {
        perCostCounts[i]++;
    }

    let idCounter = 0;

    for (let idx = 0; idx < allowedCosts.length; idx++) {
        const cost = allowedCosts[idx];
        const countForThisCost = perCostCounts[idx];

        for (let j = 0; j < countForThisCost; j++) {
            const echo = generateRandomEcho(
                charId,
                cost,
                bias,
                null,
                rollQuality,
                false,
                statWeight
            );

            echoes.push({
                id: idCounter++,
                cost,
                mainStats: echo.mainStats,
                subStats: echo.subStats,
                _totalStats: echo._totalStats,
            });
        }
    }

/*
    for (let i = echoes.length - 1; i > 0; i--) {
        const r = Math.floor(Math.random() * (i + 1));
        const tmp = echoes[i];
        echoes[i] = echoes[r];
        echoes[r] = tmp;
    }
*/

    return echoes;
}

export async function runVirtualEchoOptimizer({
                                                  form,
                                                  poolSize = 70,
                                                  resultsLimit = 5,
                                                  onProgress,
                                                  bias,
                                                  rollQuality,
                                                  targetEnergyRegen= 0
                                              }) {
    const virtualEchoes = buildVirtualEchoPool({
        charId: form.charId,
        poolSize,
        bias: bias,
        rollQuality: rollQuality,
        statWeight: form.statWeight,
    });

    ctxObj = prepareGpuContext(generateEchoContext(form));

    const combinations = await countEchoCombos({
        echoes: virtualEchoes,
        maxCost: 12,
        maxSize: 5,
    });

    const batchSize = Math.min(Number(combinations), 120000);

    const encoded = encodeEchoStats(virtualEchoes, form.charId);

    await initWorkerPool(encoded, virtualEchoes, form.charId);

    const comboBatchGenerator = generateEchoPermutationBatches2({
        echoes: virtualEchoes,
        maxCost: 12,
        maxSize: 5,
        batchSize,
        lockedEchoId: null,
    });

    const results = await runGpuEchoOptimizer({
        comboBatchGenerator,
        resultsLimit,
        onProgress,
        combinations,
        ctxObj,
        charId: form.charId,
        encodedConstraints: null,
    });

    return {
        echoes: virtualEchoes,
        results,
    };
}