export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     currentParamValues = []
                                 }) {
    const atkBonus = parseFloat(currentParamValues[0]);
    const skill = parseFloat(currentParamValues[1]);

    mergedBuffs.atk.percent += atkBonus;


    if (characterState?.activeStates?.eulogy) {
        mergedBuffs.skillType.resonanceSkill.dmgBonus += skill;
    }

    return { mergedBuffs, combatState, skillMeta };
}