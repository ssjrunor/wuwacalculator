export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                 isToggleActive = () => false,
                                 currentParamValues = []
                                 }) {
    const stacks = characterState?.activeStates?.r5Gun504Stacks ?? 0;
    const atk = parseFloat(currentParamValues[0]);
    const basic = parseFloat(currentParamValues[1]);
    const dmgBonus = parseFloat(currentParamValues[3]) * stacks;

    mergedBuffs.atk.percent += atk;

    if (characterState?.activeStates.firstP) mergedBuffs.skillType.basicAtk.dmgBonus += basic;

    mergedBuffs.attribute.all.dmgBonus += dmgBonus;

    return { mergedBuffs, combatState, skillMeta };
}
