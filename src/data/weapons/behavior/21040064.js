export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     currentParamValues = []
                                 }) {
    const stacks = characterState?.activeStates?.stacks ?? 0;
    const bonus = parseFloat(currentParamValues[1]) * stacks;

    mergedBuffs.atk.percent += bonus;
    mergedBuffs.def.percent += bonus;


    return { mergedBuffs, combatState, skillMeta };
}
