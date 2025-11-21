import {removeEchoArrayFromBuffs} from "../utils/echoGenerator.js";
import {
    getSetPlanFromEchoes,
    removeMainEchoBuffLogic,
    removeSetEffectsFromBuffs,
} from "../data/buffs/setEffect.js";

export function generateEchoContext(form) {
    const charId = form.charId;
    const runtime = form.characterRuntimeStates[charId];
    const currentSetPlan = getSetPlanFromEchoes(form.equippedEchoes);
    let clonedMergedBuffs = structuredClone(form.mergedBuffs);
    const withoutSetEffects = removeSetEffectsFromBuffs(clonedMergedBuffs, currentSetPlan, runtime, form.skillType);
    const withoutMainEchoes = removeMainEchoBuffLogic({
        equippedEchoes: form.equippedEchoes, mergedBuffs: withoutSetEffects, charId,
        characterState: {
            activeStates: runtime?.activeStates ?? {}
        },
    })
    const mergedBuffsWithoutEchoes = removeEchoArrayFromBuffs(withoutMainEchoes, form.equippedEchoes);
    return {
        charId,

        // Character + base state
        activeCharacter: form.activeCharacter,
        baseCharacterState: form.baseCharacterState,
        characterLevel: form.characterRuntimeStates?.[charId]?.CharacterLevel,

        // Runtime states / toggles / passives
        characterRuntimeStates: form.characterRuntimeStates,

        // Combat state (enemy res, enemy def, flatDmg, weapon, etc)
        combatState: form.characterRuntimeStates?.[charId]?.CombatState,

        // Skill info
        entry: form.entry,
        levelData: form.levelData,
        sliderValues: form.characterRuntimeStates?.[charId]?.SkillLevels,
        getSkillData: form.getSkillData,

        // Buffs BEFORE applying echoes
        mergedBuffsWithoutEchoes
    };
}