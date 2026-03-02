export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     currentParamValues = [],
                                 }) {
    const atk = parseFloat(currentParamValues[0]);
    const echoAmplify = parseFloat(currentParamValues[1]);
    const aeroDefIgnore = parseFloat(currentParamValues[3]);

    mergedBuffs.atk.percent += atk;

    if (characterState?.activeStates?.firstP) {
        mergedBuffs.skillType.echoSkill.amplify += echoAmplify;
    }

    if (characterState?.activeStates?.secondP) {
        mergedBuffs.attribute.aero.defIgnore += aeroDefIgnore;
    }

    return { mergedBuffs, combatState, skillMeta };
}
