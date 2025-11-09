export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     currentParamValues = []
                                 }) {
    const stacks = (characterState?.activeStates?.stacks ?? 0) * 10;
    const atk = parseFloat(currentParamValues[0]);
    const basic = parseFloat(currentParamValues[4]);

    mergedBuffs.atkPercent = (mergedBuffs.atkPercent ?? 0) + atk;
    mergedBuffs.basicAtk = (mergedBuffs.basicAtk ?? 0) + stacks;

    if (characterState?.activeStates?.secondP) {
        mergedBuffs.basicAtk = (mergedBuffs.basicAtk ?? 0) + basic;
    }

    return { mergedBuffs, combatState, skillMeta };
}