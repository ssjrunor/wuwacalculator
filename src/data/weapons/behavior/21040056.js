export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     currentParamValues = [],
                                 }) {

    mergedBuffs.atk.percent += parseFloat(currentParamValues[0]);;

    if (characterState?.activeStates?.firstP)
        mergedBuffs.skillType.basicAtk.amplify += parseFloat(currentParamValues[1]);


    if (characterState?.activeStates?.secondP) {
        mergedBuffs.attribute.spectro.dmgBonus += parseFloat(currentParamValues[3]);
        mergedBuffs.skillType.all.defIgnore += parseFloat(currentParamValues[4]);
    }

    return { mergedBuffs, combatState, skillMeta };
}
