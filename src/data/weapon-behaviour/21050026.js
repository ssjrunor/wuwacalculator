export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     currentParamValues = [],
                                 }) {

    const atk = parseFloat(currentParamValues[0]);
    const stacks = characterState?.activeStates?.stacks ?? 0;
    const basic = parseFloat(currentParamValues[1]) * stacks;
    const secondP = parseFloat(currentParamValues[5]);

    mergedBuffs.basicAtk = (mergedBuffs.basicAtk ?? 0) + basic;
    mergedBuffs.atkPercent = (mergedBuffs.atkPercent ?? 0) + atk;

    if (characterState?.activeStates?.secondP) {
        mergedBuffs.basicAtk = (mergedBuffs.basicAtk ?? 0) + secondP;
    }

    return { mergedBuffs, combatState, skillMeta };
}