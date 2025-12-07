export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     currentParamValues = []
                                 }) {
    const skill = parseFloat(currentParamValues[0]);
    const amp = parseFloat(currentParamValues[2]);


    if (characterState?.activeStates?.firstP) {
        mergedBuffs.skillType.resonanceSkill.dmgBonus += skill;
    }

    if (characterState?.activeStates?.secondP) {
        mergedBuffs.attribute.aero.amplify += amp;
    }

    return { mergedBuffs, combatState, skillMeta };
}