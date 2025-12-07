export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                 currentParamValues = []
                                 }) {
    const atk = parseFloat(currentParamValues[1]);

    if (characterState?.activeStates?.firstP) {
        mergedBuffs.atk.percent += atk;
    }

    return { mergedBuffs, combatState, skillMeta };
}
