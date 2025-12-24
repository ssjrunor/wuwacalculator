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

    mergedBuffs.critRate += cr;

    if (characterState?.activeStates?.firstP) {
        mergedBuffs.skillType.basicAtk.dmgBonus += basic1;
    }

    if (characterState?.activeStates?.secondP) {
        mergedBuffs.skillType.basicAtk.dmgBonus += basic2;
    }

    return { mergedBuffs, combatState, skillMeta };
}