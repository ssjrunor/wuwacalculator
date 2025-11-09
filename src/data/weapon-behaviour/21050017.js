export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     currentParamValues = [],
                                 }) {

    const heal = parseFloat(currentParamValues[0]);

    if (characterState?.activeStates?.firstP) {
        mergedBuffs.healingBonus = (mergedBuffs.healingBonus ?? 0) + heal;
    }

    return { mergedBuffs, combatState, skillMeta };
}