import {prepareGpuContext} from "@/features/optimizer/core/prepareGpuContext.js";
import {getDefaultMainStatFilter} from "@/features/optimizer/core/optimizerUtils.js";
import {applyFixedSecondMainStat, getValidMainStats, removeMainStatsFromBuffs} from "@/utils/echoHelper.js";
import {removeSpecialBuffs} from "@/features/optimizer/core/echoOptimizerContext.js";

export function generateMainStatsContext(form) {
    const charId = form.charId;
    const runtime = form.characterRuntimeStates[charId];
    const withoutMainStats = removeMainStatsFromBuffs(
        removeSpecialBuffs(form.mergedBuffs, structuredClone(form.mergedBuffs), charId, runtime.activeStates, form.sequence, form.skillType),
        form.equippedEchoes
    );

    const raw = {
        charId,
        activeCharacter: form.activeCharacter,
        baseCharacterState: form.baseCharacterState,
        characterLevel: form.characterRuntimeStates?.[charId]?.CharacterLevel,
        characterRuntimeStates: form.characterRuntimeStates,
        combatState: form.characterRuntimeStates?.[charId]?.CombatState,
        entry: form.entry,
        levelData: form.levelData,
        sliderValues: form.characterRuntimeStates?.[charId]?.SkillLevels,
        getSkillData: form.getSkillData,
        mergedBuffs: withoutMainStats,
    };

    return {...prepareGpuContext({
              ...raw,
              mergedBuffsWithoutEchoes: raw.mergedBuffs,
          }), charId: Number(charId)
    };
}

export function buildMainStatPoolForSuggestor({ statWeight = {}, charId = null, mainStatFilter = null }) {
    const costs = [1, 3, 4];
    const pool = [];

    const filter = mainStatFilter ?? getDefaultMainStatFilter(statWeight, charId);

    for (const cost of costs) {
        const valid = getValidMainStats(cost);

        for (const [key, value] of Object.entries(valid)) {
            if (filter && !filter[key]) continue;

            const mainStats = applyFixedSecondMainStat({ [key]: value }, cost);

            pool.push({
                cost,
                key,
                value,
                stats: mainStats,
            });
        }
    }

    return pool;
}