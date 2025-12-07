export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     currentParamValues = [],
                                     activeCharacter
                                 }) {
    const hp = parseFloat(currentParamValues[0]);
    const defIgnore = parseFloat(currentParamValues[1]);
    const amp = parseFloat(currentParamValues[2]);

    mergedBuffs.hp.percent += hp;

    if (characterState?.activeStates?.firstP) {
        mergedBuffs.attribute.all.defIgnore += defIgnore;
    }

    if (characterState?.activeStates?.secondP && combatState.aeroErosion >= 1) {
        mergedBuffs.attribute.all.amplify += amp;
    }

    return { mergedBuffs, combatState, skillMeta };
}