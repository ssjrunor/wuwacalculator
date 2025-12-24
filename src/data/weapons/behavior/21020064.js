export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     currentParamValues = []
                                 }) {
    const stacks = characterState?.activeStates?.stacks ?? 0;
    const atk = parseFloat(currentParamValues[1]) * stacks;

    mergedBuffs.atk.percent += atk;


    return { mergedBuffs, combatState, skillMeta };
}