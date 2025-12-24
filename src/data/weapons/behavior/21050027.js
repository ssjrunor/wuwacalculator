export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     currentParamValues = []
                                 }) {
    const stacks = characterState?.activeStates?.stacks ?? 0;
    const spectro = parseFloat(currentParamValues[0]) * stacks;

    if (combatState.spectroFrazzle > 0) {
        mergedBuffs.attribute.spectro.dmgBonus += spectro;
    }

    return { mergedBuffs, combatState, skillMeta };
}
