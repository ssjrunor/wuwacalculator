export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     currentParamValues = [],
                                 }) {

    const def = parseFloat(currentParamValues[0]);
    const cd = parseFloat(currentParamValues[0]);

    mergedBuffs.def.percent += def;

    if (characterState?.activeStates?.firstP) {
        mergedBuffs.critDmg += cd;
    }

    return { mergedBuffs, combatState, skillMeta };
}
