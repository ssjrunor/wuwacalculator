export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     isToggleActive = () => false,
                                     currentParamValues = []
                                 }) {
    const atk = parseFloat(currentParamValues[0]);
    const def = parseFloat(currentParamValues[1]);
    if (characterState?.activeStates?.firstP) {
        mergedBuffs.atkPercent = (mergedBuffs.atkPercent ?? 0) + atk;
        mergedBuffs.defPercent = (mergedBuffs.defPercent ?? 0) + def;
    }

    return { mergedBuffs, combatState, skillMeta };
}