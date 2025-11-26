import {prepareGpuContext} from "../../optimizer/prepareGpuContext.js";
import {getSetPlanFromEchoes, removeSetEffectsFromBuffs} from "../../data/buffs/setEffect.js";
import {removeSpecialBuffs} from "../../optimizer/echoOptimizerContext.js";

export function generateSetPlanContext(form) {
    const charId = form.charId;
    const runtime = form.characterRuntimeStates[charId];
    const currentSetPlan = getSetPlanFromEchoes(form.equippedEchoes);
    const withoutSetEffects = removeSetEffectsFromBuffs(
        removeSpecialBuffs(form.mergedBuffs, {...form.mergedBuffs}, charId, runtime.activeStates),
        currentSetPlan, runtime, form.skillType);

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
        mergedBuffs: withoutSetEffects,
    };

    return {...prepareGpuContext({
            ...raw,
            mergedBuffsWithoutEchoes: raw.mergedBuffs,
        }), charId: Number(charId)
    };
}