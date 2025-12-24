export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     currentParamValues = []
                                 }) {
    const stacks = characterState?.activeStates?.stacks ?? 0;
    const skill = parseFloat(currentParamValues[0]) * stacks;
    mergedBuffs.skillType.resonanceSkill.dmgBonus += skill;
    return { mergedBuffs, combatState, skillMeta };
}