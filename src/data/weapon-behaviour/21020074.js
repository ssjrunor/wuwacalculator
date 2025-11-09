export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     currentParamValues = []
                                 }) {
    const stacks = characterState?.activeStates?.stacks ?? 0;
    const bonus = parseFloat(currentParamValues[0]) * stacks;

    mergedBuffs.heavyAtk = (mergedBuffs.heavyAtk ?? 0) + bonus;
    mergedBuffs.basicAtk = (mergedBuffs.basicAtk ?? 0) + bonus;


    return { mergedBuffs, combatState, skillMeta };
}