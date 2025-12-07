export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     isToggleActive = () => false,
                                     currentParamValues = []
                                 }) {
    const energy = parseFloat(currentParamValues[0]);
    const stacks = characterState?.activeStates?.stacks ?? 0;
    const ult = parseFloat(currentParamValues[1]) * stacks;

    mergedBuffs.energyRegen += energy;
    mergedBuffs.skillType.resonanceLiberation.dmgBonus += ult;


    return { mergedBuffs, combatState, skillMeta };
}