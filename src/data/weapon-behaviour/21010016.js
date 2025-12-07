export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     isToggleActive = () => false,
                                     currentParamValues = [],
                                     activeCharacter
                                 }) {
    const attr = parseFloat(currentParamValues[0]);
    const stacks = characterState?.activeStates?.stacks ?? 0;
    const heavy = parseFloat(currentParamValues[1]) * stacks;
    mergedBuffs.attribute.all.dmgBonus += attr;
    mergedBuffs.skillType.heavyAtk.dmgBonus += heavy;
    return { mergedBuffs, combatState, skillMeta };
}