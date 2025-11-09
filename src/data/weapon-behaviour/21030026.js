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

    mergedBuffs.atkPercent = (mergedBuffs.atkPercent ?? 0) + atk;
    mergedBuffs.aero = (mergedBuffs.aero ?? 0) +
        (characterState?.activeStates?.firstP ? aero : 0);
    mergedBuffs.aeroErosionResShred = (mergedBuffs?.aeroErosionResShred ?? 0) +
        (characterState?.activeStates?.secondP && combatState.aeroErosion > 0 ? resShred : 0);

    return { mergedBuffs, combatState, skillMeta };
}

export function updateSkillMeta({ characterState, skillMeta = {}, currentParamValues = [], combatState}) {
    const resShred = parseFloat(currentParamValues[3]);
    skillMeta.skillResIgnore = (skillMeta.skillResIgnore ?? 0) +
        (characterState?.activeStates?.secondP && skillMeta.element === 'aero' && combatState.aeroErosion > 0 ? resShred : 0);
}