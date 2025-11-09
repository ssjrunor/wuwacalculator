export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     skillMeta = {},
                                     currentParamValues = []
                                 }) {
    const energy = parseFloat(currentParamValues[0]);
    mergedBuffs.energyRegen = (mergedBuffs.energyRegen ?? 0) + energy;

    return { mergedBuffs, combatState, skillMeta };
}