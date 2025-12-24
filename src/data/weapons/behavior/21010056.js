export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     currentParamValues = [],
                                 }) {
    const atk = parseFloat(currentParamValues[0]);
    const stacks = characterState?.activeStates?.threadOfFateStacks ?? 0;
    const lib = parseFloat(currentParamValues[1]) * stacks;
    const attr = parseFloat(currentParamValues[4]);
    mergedBuffs.atk.percent += atk;
    mergedBuffs.skillType.resonanceLiberation.dmgBonus += lib;
    mergedBuffs.attribute.all.dmgBonus += (characterState?.activeStates?.secondP ? attr : 0);
    return { mergedBuffs, combatState, skillMeta };
}