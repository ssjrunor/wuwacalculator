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

    mergedBuffs.energyRegen = (mergedBuffs.energyRegen ?? 0) + energy;
    mergedBuffs.resonanceLiberation = (mergedBuffs.resonanceLiberation ?? 0) + ult;


    return { mergedBuffs, combatState, skillMeta };
}