export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     currentParamValues = []
                                 }) {
    const atk = parseFloat(currentParamValues[0]);
    const hp = parseFloat(currentParamValues[1]);

    if (characterState?.activeStates?.firstP) {
        mergedBuffs.atk.percent += atk;
        mergedBuffs.hp.percent += hp;
    }

    return { mergedBuffs, combatState, skillMeta };
}
