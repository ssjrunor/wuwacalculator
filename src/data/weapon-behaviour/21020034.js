export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     currentParamValues = []
                                 }) {
    const heavy = parseFloat(currentParamValues[1]);

    if (characterState?.activeStates?.firstP) {
        mergedBuffs.heavyAtk = (mergedBuffs.heavyAtk ?? 0) + heavy;
    }

    return { mergedBuffs, combatState, skillMeta };
}