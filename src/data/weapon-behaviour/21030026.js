export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     currentParamValues = [],
                                 }) {
    const atk = parseFloat(currentParamValues[0]);
    const aero = parseFloat(currentParamValues[1]);
    const resShred = parseFloat(currentParamValues[3]);

    mergedBuffs.atk.percent += atk;
    mergedBuffs.attribute.aero.dmgBonus +=
        (characterState?.activeStates?.firstP ? aero : 0);
    mergedBuffs.attribute.aero.resShred +=
        (characterState?.activeStates?.secondP && combatState.aeroErosion > 0 ? resShred : 0);

    return { mergedBuffs, combatState, skillMeta };
}