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

    mergedBuffs.skillType.basicAtk.dmgBonus += basic;
    mergedBuffs.atk.percent += atk;

    if (characterState?.activeStates?.secondP) {
        mergedBuffs.skillType.basicAtk.dmgBonus += secondP;
    }

    return { mergedBuffs, combatState, skillMeta };
}
