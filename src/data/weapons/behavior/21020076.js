export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     currentParamValues = [],
                                 }) {
    const allDmg = parseFloat(currentParamValues[0]);
    mergedBuffs.attribute.all.dmgBonus += allDmg;
    if (characterState?.activeStates?.firstP) {
        mergedBuffs.skillType.resonanceLiberation.defIgnore += parseFloat(currentParamValues[1]);
        mergedBuffs.attribute.fusion.resShred += parseFloat(currentParamValues[1]);
    }
    return { mergedBuffs, combatState, skillMeta };
}