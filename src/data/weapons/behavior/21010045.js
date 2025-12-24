export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     currentParamValues = [],
                                 }) {

    const atk = parseFloat(currentParamValues[0]);
    const liberation = parseFloat(currentParamValues[1]);

    mergedBuffs.atk.percent += atk;

    if (characterState?.activeStates?.firstP) {
        mergedBuffs.skillType.resonanceLiberation.dmgBonus += liberation;
    }

    return { mergedBuffs, combatState };
}
