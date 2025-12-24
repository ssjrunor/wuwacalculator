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

    mergedBuffs.atk.percent += atk;

    if (combatState.spectroFrazzle > 0) {
        mergedBuffs.skillType.basicAtk.dmgBonus += firstP;
        mergedBuffs.skillType.heavyAtk.dmgBonus += firstP;
    }

    if (characterState?.activeStates?.secondP) {
        mergedBuffs.skillType.spectroFrazzle.amplify += secondP;
    }

    return { mergedBuffs, combatState, skillMeta };
}
