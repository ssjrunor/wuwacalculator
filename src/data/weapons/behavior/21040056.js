export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     currentParamValues = [],
                                 }) {
    const atk = parseFloat(currentParamValues[0]);
    const basicAmp = parseFloat(currentParamValues[1]);
    const spectroBonus = parseFloat(currentParamValues[3]);
    const defIgnore = parseFloat(currentParamValues[4]);

    mergedBuffs.atk.percent += atk;

    if (characterState?.activeStates?.firstP) {
        mergedBuffs.skillType.basicAtk.amplify += basicAmp;
    }

    if (characterState?.activeStates?.secondP) {
        mergedBuffs.attribute.spectro.dmgBonus += spectroBonus;
        mergedBuffs.skillType.all.defIgnore += defIgnore;
    }

    return { mergedBuffs, combatState, skillMeta };
}
