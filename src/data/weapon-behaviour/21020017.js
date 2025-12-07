export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     currentParamValues = []
                                 }) {
    const stacks = characterState?.activeStates?.stacks ?? 0;
    const atk = parseFloat(currentParamValues[3]) * stacks;
    const critRate = parseFloat(currentParamValues[7])

    mergedBuffs.atk.percent += atk;

    if (stacks >= 10) {
        mergedBuffs.critRate += critRate;
    }

    return { mergedBuffs, combatState, skillMeta };
}