export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     currentParamValues = []
                                 }) {
    const stacks = characterState?.activeStates?.stacks ?? 0;
    const bonus = parseFloat(currentParamValues[1]) * stacks;

    mergedBuffs.atkPercent = (mergedBuffs.atkPercent ?? 0) + bonus;
    mergedBuffs.defPercent = (mergedBuffs.defPercent ?? 0) + bonus;


    return { mergedBuffs, combatState, skillMeta };
}