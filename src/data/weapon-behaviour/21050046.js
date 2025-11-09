export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     currentParamValues = []
                                 }) {
    const atk = parseFloat(currentParamValues[0]);
    const stacks = characterState?.activeStates?.stacks ?? 0;
    const firstP = parseFloat(currentParamValues[1]) * stacks;
    const secondP = parseFloat(currentParamValues[4]);

    mergedBuffs.atkPercent = (mergedBuffs.atkPercent ?? 0) + atk;

    if (combatState.spectroFrazzle > 0) {
        mergedBuffs.basicAtk = (mergedBuffs.basicAtk ?? 0) + firstP;
        mergedBuffs.heavyAtk = (mergedBuffs.heavyAtk ?? 0) + firstP;
    }

    if (characterState?.activeStates?.secondP) {
        mergedBuffs.damageTypeAmplify.spectroFrazzle = (mergedBuffs.damageTypeAmplify.spectroFrazzle ?? 0) + secondP;
    }

    return { mergedBuffs, combatState, skillMeta };
}