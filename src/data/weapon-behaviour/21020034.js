export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     currentParamValues = []
                                 }) {
    const heavy = parseFloat(currentParamValues[1]);

    if (characterState?.activeStates?.firstP) {
        mergedBuffs.skillType.heavyAtk.dmgBonus += heavy;
    }

    return { mergedBuffs, combatState, skillMeta };
}