export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     currentParamValues = []
                                 }) {
    const skill = parseFloat(currentParamValues[0]);
    if (characterState?.activeStates?.firstP) {
        mergedBuffs.resonanceSkill = (mergedBuffs.resonanceSkill ?? 0) + skill;
    }

    return { mergedBuffs, combatState, skillMeta };
}