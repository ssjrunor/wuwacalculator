export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     currentParamValues = []
                                 }) {
    const skill = parseFloat(currentParamValues[0]);
    if (characterState?.activeStates?.firstP) {
        mergedBuffs.skillType.resonanceSkill.dmgBonus += skill;
    }
    return { mergedBuffs, combatState, skillMeta };
}