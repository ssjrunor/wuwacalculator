export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     skillMeta = {},
                                     currentParamValues = []
                                 }) {
    const bonus = parseFloat(currentParamValues[0]);
    mergedBuffs.skillType.basicAtk.dmgBonus += bonus;
    mergedBuffs.skillType.heavyAtk.dmgBonus += bonus;
    return { mergedBuffs, combatState, skillMeta };
}