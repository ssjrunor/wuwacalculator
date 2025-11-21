// findBestEchoSetFromArray.js

import { computeSkillDamage } from "./computeSkillDamage.js";
import { addEchoArrayToBuffs } from "./optimizer.js";
import { getFinalStats } from "./getStatsForLevel.js";

// Fast approximation to rank echoes early (for pruning)
function approxEchoValue(echo, statWeight) {
    let total = 0;

    if (echo.mainStats) {
        for (const [stat, val] of Object.entries(echo.mainStats)) {
            total += (statWeight[stat] ?? 0) * val;
        }
    }
    if (echo.subStats) {
        for (const [stat, val] of Object.entries(echo.subStats)) {
            total += (statWeight[stat] ?? 0) * val;
        }
    }

    return total;
}

export async function findBestEchoSetFromArray(
    context,
    availableEchoes = [],
    iterations = 2000,
    targetEnergyRegen,
    baseCharacterState,
    mergedBuffs,
    equippedEchoes = [],
    statWeight = {},
    seed = null,
    endEarly = true,
    setId = null,
    mainEchoId = null
) {
    let echoes = [...availableEchoes];

    // Optional restrictions (if you later support locking sets)
    if (setId != null) {
        echoes = echoes.filter(e => e.setId === setId);
    }

    // Precompute heuristic score + density
    for (const e of echoes) {
        e._approx = approxEchoValue(e, statWeight);
        e._density = e._approx / e.cost;
    }

    // Sort echoes by best value-per-cost (good ones explored earlier)
    echoes.sort((a, b) => b._density - a._density);

    let bestSet = null;
    let bestDamage = -Infinity;
    let bestCost = -1;

    // Real damage evaluator
    const evaluateDamage = (chosen) => {
        const buffsWithEchoes = addEchoArrayToBuffs(mergedBuffs, chosen);

        const finalStats = getFinalStats(
            context.activeCharacter,
            baseCharacterState,
            context.characterRuntimeStates?.[context.charId]?.CharacterLevel,
            buffsWithEchoes,
            context.characterRuntimeStates?.[context.charId]?.CombatState
        );

        return computeSkillDamage({
            entry: context.entry,
            levelData: context.levelData,
            activeCharacter: context.activeCharacter,
            characterRuntimeStates: context.characterRuntimeStates,
            finalStats,
            combatState: context.characterRuntimeStates?.[context.charId]?.CombatState,
            mergedBuffs: buffsWithEchoes,
            sliderValues: context.characterRuntimeStates?.[context.charId]?.SkillLevels,
            characterLevel: context.characterRuntimeStates?.[context.charId]?.CharacterLevel,
            getSkillData: context.getSkillData,
        });
    };

    // Depth-first search with pruning
    const search = (index, chosen, cost, approxScore) => {
        if (cost > 12) return;
        if (chosen.length > 0) {
            const dmg = evaluateDamage(chosen);

            // max damage first, then max cost
            if (dmg > bestDamage || (dmg === bestDamage && cost > bestCost)) {
                bestDamage = dmg;
                bestCost = cost;
                bestSet = [...chosen];
            }
        }

        if (chosen.length === 5) return;
        if (index >= echoes.length) return;

        // Upper bound prune using approx values
        const remainingSlots = 5 - chosen.length;
        let upperBound = approxScore;

        let taken = 0;
        for (let i = index; i < echoes.length && taken < remainingSlots; i++) {
            upperBound += echoes[i]._approx;
            taken++;
        }

        if (upperBound < bestDamage) {
            return;
        }

        const cur = echoes[index];

        // Option 1: take current echo
        search(
            index + 1,
            [...chosen, cur],
            cost + cur.cost,
            approxScore + cur._approx
        );

        // Option 2: skip it
        search(index + 1, chosen, cost, approxScore);
    };

    search(0, [], 0, 0);

    return {
        best: bestSet,
        bestDamage,
        bestCost,
    };
}