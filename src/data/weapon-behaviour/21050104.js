export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     currentParamValues = [],
                                 }) {

    const atk = parseFloat(currentParamValues[0]);
    const basic = parseFloat(currentParamValues[0]);

    if (characterState?.activeStates?.firstP) {
        mergedBuffs.atkPercent = (mergedBuffs.atkPercent ?? 0) + atk;
        mergedBuffs.basicAtk = (mergedBuffs.basicAtk ?? 0) + basic;
    }

    return { mergedBuffs, combatState, skillMeta };
}