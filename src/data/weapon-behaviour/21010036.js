export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     currentParamValues = [],
                                 }) {
    const atk = parseFloat(currentParamValues[0]);
    const ult = parseFloat(currentParamValues[1]);
    const fusion = parseFloat(currentParamValues[5]);

    mergedBuffs.atkPercent = (mergedBuffs.atkPercent ?? 0) + atk;

    if (characterState?.activeStates?.firstP) {
        mergedBuffs.resonanceLiberation = (mergedBuffs.resonanceLiberation ?? 0) + ult;
    }

    if (characterState?.activeStates?.secondP) {
        mergedBuffs.fusion = (mergedBuffs.fusion ?? 0) + fusion;
    }

    return { mergedBuffs, combatState, skillMeta };
}