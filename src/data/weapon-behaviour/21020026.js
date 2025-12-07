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

    mergedBuffs.atk.percent += atk;
    mergedBuffs.skillType.basicAtk.dmgBonus += stacks;

    if (characterState?.activeStates?.secondP) {
        mergedBuffs.skillType.basicAtk.dmgBonus += basic;
    }

    return { mergedBuffs, combatState, skillMeta };
}