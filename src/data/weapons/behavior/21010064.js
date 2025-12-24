export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     isToggleActive = () => false,
                                     currentParamValues = []
                                 }) {
    const stacks = characterState?.activeStates?.stacks ?? 0;
    const atk = parseFloat(currentParamValues[2]) * stacks;
    mergedBuffs.atk.percent += atk;
    return { mergedBuffs, combatState, skillMeta };
}