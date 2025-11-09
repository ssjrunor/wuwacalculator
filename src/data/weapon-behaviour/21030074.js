export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     currentParamValues = []
                                 }) {
    const stacks = characterState?.activeStates?.stacks ?? 0;
    const skill = parseFloat(currentParamValues[0]) * stacks;

    mergedBuffs.resonanceSkill = (mergedBuffs.resonanceSkill ?? 0) + skill;


    return { mergedBuffs, combatState, skillMeta };
}