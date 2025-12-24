export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     currentParamValues = [],
                                 }) {

    const atk = parseFloat(currentParamValues[0]);
    const basic = parseFloat(currentParamValues[1]);
    const stacks = characterState?.activeStates?.stacks ?? 0;

    mergedBuffs.atk.percent += atk;
    mergedBuffs.skillType.basicAtk.dmgBonus += basic * stacks;

    return { mergedBuffs, combatState, skillMeta };
}
