export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     currentParamValues = [],
                                 }) {

    const bonus = parseFloat(currentParamValues[0]) * (characterState?.activeStates?.huntersStacks ?? 0);
    mergedBuffs.heavyAtk = (mergedBuffs.heavyAtk ?? 0) + bonus;
    mergedBuffs.atkPercent = (mergedBuffs.atkPercent ?? 0) + bonus;

    return { mergedBuffs, combatState, skillMeta };
}