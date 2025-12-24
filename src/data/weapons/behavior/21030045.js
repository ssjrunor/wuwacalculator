export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     currentParamValues = [],
                                 }) {
    const atk = parseFloat(currentParamValues[0]);
    const dmgBonus = parseFloat(currentParamValues[1]);

    mergedBuffs.atk.percent += atk;
    if (characterState?.activeStates?.firstP) {
        mergedBuffs.attribute.all.dmgBonus += dmgBonus;
    }

    return { mergedBuffs, combatState, skillMeta };
}
