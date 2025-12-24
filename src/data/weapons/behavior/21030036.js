export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     currentParamValues = [],
                                 }) {
    const atk = parseFloat(currentParamValues[0]);
    const heavy = parseFloat(currentParamValues[1]);
    const defIgnore = parseFloat(currentParamValues[6]);

    mergedBuffs.atk.percent += atk;

    if (characterState?.activeStates?.firstP1) {
        mergedBuffs.skillType.heavyAtk.amplify += heavy;
    }

    if (characterState?.activeStates?.firstP2) {
        mergedBuffs.skillType.echoSkill.amplify += heavy;
    }

    if (characterState?.activeStates?.firstP1 && characterState?.activeStates?.firstP2) {
        mergedBuffs.attribute.all.defIgnore += defIgnore;
    }

    return { mergedBuffs, combatState, skillMeta };
}