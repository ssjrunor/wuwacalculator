export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     currentParamValues = []
                                 }) {
    const atkBonus = parseFloat(currentParamValues[0]);
    const skill = parseFloat(currentParamValues[1]);

    mergedBuffs.atkPercent = (mergedBuffs.atkPercent ?? 0) + atkBonus;


    if (characterState?.activeStates?.eulogy) {
        mergedBuffs.resonanceSkill = (mergedBuffs.resonanceSkill ?? 0) + skill;
    }

    return { mergedBuffs, combatState, skillMeta };
}