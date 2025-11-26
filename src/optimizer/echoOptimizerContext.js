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
    const withoutSpecialCharacterBuffs = removeSpecialBuffs(form.mergedBuffs, withoutMainEchoes, charId, runtime.activeStates);
    const mergedBuffsWithoutEchoes = removeEchoArrayFromBuffs(withoutSpecialCharacterBuffs, form.equippedEchoes);
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

export function removeSpecialBuffs( original, buffs, charId, activeStates ) {
    const idn = Number(charId);

    switch (idn) {
        case 1206:
            if (original.energyRegen > 50) {
                const excess = original.energyRegen - 50;
                if (activeStates?.myMoment) {
                    const atkBuff = Math.min(excess * 20, 2600);
                    buffs.atkFlat = (buffs.atkFlat ?? 0) - atkBuff;
                } else {
                    const atkBuff = Math.min(excess * 12, 1560);
                    buffs.atkFlat = (buffs.atkFlat ?? 0) - atkBuff;
                }
            }
            break;
    }
    return buffs;
}

export function applySpecialBuffs( original, buffs, charId, key ) {
    if (!charId) return buffs;
    const idn = Number(charId);

    switch (idn) {
        case 1206:
            if (original.energyRegen > 150 && key === 'atk') {
                const excess = original.energyRegen - 150;
                const atkBuff = Math.min(excess * 20, 2600);
                buffs[key] = (buffs[key] ?? 0) + atkBuff;
            } else return {[key]: 0};
            break;
        default:
            buffs[key] = (buffs[key] ?? 0);
    }
    return buffs;
}