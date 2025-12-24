export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     currentParamValues = [],
                                 }) {
    const atk = parseFloat(currentParamValues[0]);
    const ult = parseFloat(currentParamValues[1]);
    const fusion = parseFloat(currentParamValues[5]);

    mergedBuffs.atk.percent += atk;

    if (characterState?.activeStates?.firstP) {
        mergedBuffs.skillType.resonanceLiberation.dmgBonus += ult;
    }

    if (characterState?.activeStates?.secondP) {
        mergedBuffs.attribute.fusion.dmgBonus += fusion;
    }

    return { mergedBuffs, combatState, skillMeta };
}