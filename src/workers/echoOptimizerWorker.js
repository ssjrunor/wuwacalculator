// EchoWorker.js
import { computeSkillDamage } from "../utils/computeSkillDamage.js";
import { addEchoArrayToBuffs } from "../utils/optimizer.js";
import { getFinalStats } from "../utils/getStatsForLevel.js";
import {decodePermutation} from "../optimizer/echoDecode.js";

self.onmessage = function (event) {
    const {
        context,
        echoes,
        skip,
        runSize,
        size,
    } = event.data;

    const results = [];

    for (let idx = skip; idx < skip + runSize; idx++) {
        if (idx >= size ** 5) break;  // safety check

        // 1) Decode into 5 virtual slots
        const [i1, i2, i3, i4, i5] = decodePermutation(idx, size);

        const chosen = [
            echoes[i1],
            echoes[i2],
            echoes[i3],
            echoes[i4],
            echoes[i5],
        ];

        // 2) Cost check (must be ≤ 12)
        const cost = chosen.reduce((sum, e) => sum + e.cost, 0);
        if (cost > 12) continue;

        // 3) Compute damage exactly
        const dmg = computeDamage(context, chosen);

        results.push({
            echoes: chosen,
            cost,
            dmg,
        });
    }

    // Return this block’s results to main thread
    self.postMessage(results);
};


// Helper — compute damage EXACTLY like EchoOptimizer does
function computeDamage(context, chosen) {
    const buffsWithEchoes = addEchoArrayToBuffs(context.mergedBuffs, chosen);

    const finalStats = getFinalStats(
        context.activeCharacter,
        context.baseCharacterState,
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
    });
}