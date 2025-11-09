export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     currentParamValues = [],
                                 }) {

    const atk = parseFloat(currentParamValues[0]);
    const skill = parseFloat(currentParamValues[1]) * (characterState?.activeStates?.stacks ?? 0);

    mergedBuffs.atkPercent = (mergedBuffs.atkPercent ?? 0) + atk;
    mergedBuffs.resonanceSkill = (mergedBuffs.resonanceSkill ?? 0) + skill;

    return { mergedBuffs, combatState, skillMeta };
}