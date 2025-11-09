export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     currentParamValues = [],
                                     activeCharacter
                                 }) {
    const atk = parseFloat(currentParamValues[0]);
    const basic = parseFloat(currentParamValues[6]);
    const resShred = parseFloat(currentParamValues[8]);
    const stacks = characterState?.activeStates?.stacks ?? 0;

    const element = skillMeta.element ?? null;

    mergedBuffs.atkPercent = (mergedBuffs.atkPercent ?? 0) + atk;
    mergedBuffs.basicAtk = (mergedBuffs.basicAtk ?? 0) + (stacks > 0 ? basic : 0)
    skillMeta.skillResIgnore = (skillMeta.skillResIgnore ?? 0) +
        (stacks > 1 && element === 'havoc' ? resShred : 0);


    return { mergedBuffs, combatState, skillMeta };
}