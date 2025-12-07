export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     currentParamValues = []
                                 }) {
    const stacks = characterState?.activeStates?.stacks ?? 0;
    const atk = parseFloat(currentParamValues[0]) * stacks;
    mergedBuffs.atk.Pprcent += atk;
    return { mergedBuffs, combatState, skillMeta };
}