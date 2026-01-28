export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     currentParamValues = [],
                                 }) {
    mergedBuffs.attribute.all.dmgBonus += parseFloat(currentParamValues[0]);
    if (characterState?.activeStates?.firstP)
        mergedBuffs.skillType.resonanceLiberation.defIgnore += parseFloat(currentParamValues[1]);

    return { mergedBuffs, combatState, skillMeta };
}

export function updateSkillMeta({
                                    skillMeta = {},
                                    currentParamValues = [],
                                    characterState
                                }) {
    if (characterState?.activeStates?.firstP &&
        skillMeta.element === 'fusion' && skillMeta.skillType.includes('ultimate'))
        skillMeta.skillResIgnore = (skillMeta.skillResIgnore ?? 0) + parseFloat(currentParamValues[2]);

    return { skillMeta };
}