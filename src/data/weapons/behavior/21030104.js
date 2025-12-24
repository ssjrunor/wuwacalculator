export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     currentParamValues = [],
                                 }) {

    const bonus = parseFloat(currentParamValues[0]) * (characterState?.activeStates?.huntersStacks ?? 0);
    mergedBuffs.skillType.heavyAtk.dmgBonus += bonus;
    mergedBuffs.atk.percent += bonus;
    return { mergedBuffs, combatState, skillMeta };
}