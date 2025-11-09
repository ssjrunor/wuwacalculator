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

    mergedBuffs.atkPercent = (mergedBuffs.atkPercent ?? 0) + atk;

    if (stacks >= 10) {
        mergedBuffs.critRate = (mergedBuffs.critRate ?? 0) + critRate;
    }

    return { mergedBuffs, combatState, skillMeta };
}