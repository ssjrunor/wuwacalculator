export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                 currentParamValues = []
                                 }) {
    const ult = parseFloat(currentParamValues[0]);

    if (characterState?.activeStates?.firstP) {
        mergedBuffs.skillType.resonanceLiberation.dmgBonus += ult;
    }

    return { mergedBuffs, combatState, skillMeta };
}
