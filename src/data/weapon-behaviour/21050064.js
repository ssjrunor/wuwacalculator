export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                 currentParamValues = []
                                 }) {
    const stacks = characterState?.activeStates?.stacks ?? 0;
    const heal = parseFloat(currentParamValues[0]) * stacks;

    mergedBuffs.healingBonus += heal;


    return { mergedBuffs, combatState, skillMeta };
}
