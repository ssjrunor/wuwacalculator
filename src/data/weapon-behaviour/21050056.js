export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     currentParamValues = [],
                                 }) {
    const atk = parseFloat(currentParamValues[0]);
    const basic = parseFloat(currentParamValues[6]);
    const resShred = parseFloat(currentParamValues[8]);
    const stacks = characterState?.activeStates?.stacks ?? 0;
    mergedBuffs.atk.percent += atk;
    mergedBuffs.skillType.basicAtk.dmgBonus += (stacks > 0 ? basic : 0);
    mergedBuffs.attribute.havoc.resShred += (stacks > 1 ? resShred : 0);
    return { mergedBuffs, combatState, skillMeta };
}
