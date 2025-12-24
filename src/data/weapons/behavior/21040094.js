export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                 isToggleActive = () => false,
                                 currentParamValues = []
                                 }) {
    const stacks = characterState?.activeStates?.stacks ?? 0;
    const atk = parseFloat(currentParamValues[0]) * stacks;

    if (combatState.spectroFrazzle > 0 || combatState.aeroErosion > 0) {
        mergedBuffs.atk.percent += atk;
    }

    return { mergedBuffs, combatState, skillMeta };
}
