export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     currentParamValues = []
                                 }) {
    const basic1 = parseFloat(currentParamValues[1]);
    const cr = parseFloat(currentParamValues[0]);
    const basic2 = parseFloat(currentParamValues[3]);

    mergedBuffs.critRate = (mergedBuffs.critRate ?? 0) + cr;

    if (characterState?.activeStates?.firstP) {
        mergedBuffs.basicAtk = (mergedBuffs.basicAtk ?? 0) + basic1;
    }

    if (characterState?.activeStates?.secondP) {
        mergedBuffs.basicAtk = (mergedBuffs.basicAtk ?? 0) + basic2;
    }

    return { mergedBuffs, combatState, skillMeta };
}