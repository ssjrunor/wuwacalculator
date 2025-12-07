export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     currentParamValues = [],
                                 }) {
    const atk = parseFloat(currentParamValues[0]);
    const dmgBonus = parseFloat(currentParamValues[2]);
    const defIgnore = parseFloat(currentParamValues[4]);

    mergedBuffs.atk.percent += atk;

    if (characterState?.activeStates?.firstP) {
        mergedBuffs.skillType.resonanceSkill.dmgBonus += dmgBonus;
        mergedBuffs.skillType.echoSkill.amplify += dmgBonus;
        mergedBuffs.skillType.all.defIgnore += defIgnore;
    }

    return { mergedBuffs, combatState, skillMeta };
}
