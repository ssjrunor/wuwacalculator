export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     currentParamValues = [],
                                 }) {

    const atk = parseFloat(currentParamValues[4]);
    const hp = parseFloat(currentParamValues[0]);

    mergedBuffs.hp.percent += hp;

    if (characterState?.activeStates?.firstP) {
        mergedBuffs.atk.percent += atk;
    }

    return { mergedBuffs, combatState, skillMeta };
}
