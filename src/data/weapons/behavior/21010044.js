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
        mergedBuffs.atk.percent += atk;
        mergedBuffs.def.percent += def;
    }

    return { mergedBuffs, combatState, skillMeta };
}