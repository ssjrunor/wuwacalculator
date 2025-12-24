export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     currentParamValues = []
                                 }) {
    const stacks = characterState?.activeStates?.stacks ?? 0;
    const bonus = parseFloat(currentParamValues[0]) * stacks;
    mergedBuffs.skillType.heavyAtk.dmgBonus += bonus;
    mergedBuffs.skillType.basicAtk.dmgBonus += bonus;
    return { mergedBuffs, combatState, skillMeta };
}