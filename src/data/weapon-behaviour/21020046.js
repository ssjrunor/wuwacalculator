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
        mergedBuffs.resonanceSkill = (mergedBuffs.resonanceSkill ?? 0) + skill;
    }

    if (characterState?.activeStates?.secondP) {
        mergedBuffs.elementDmgAmplify.aero = (mergedBuffs.elementDmgAmplify.aero ?? 0) + amp;
    }

    return { mergedBuffs, combatState, skillMeta };
}