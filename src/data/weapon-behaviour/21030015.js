export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     skillMeta = {},
                                     currentParamValues = []
                                 }) {
    const energy = parseFloat(currentParamValues[0]);
    mergedBuffs.energyRegen += energy;

    return { mergedBuffs, combatState, skillMeta };
}