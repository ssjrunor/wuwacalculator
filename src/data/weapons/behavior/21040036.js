export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     currentParamValues = []
                                 }) {
    const atkBonus = parseFloat(currentParamValues[0]);
    const amplify = parseFloat(currentParamValues[2]);
    mergedBuffs.atk.percent += atkBonus;

    if (characterState?.activeStates?.darknessBreaker) {
        mergedBuffs.skillType.spectroFrazzle.amplify += amplify;
        mergedBuffs.attribute.all.defIgnore += parseFloat(currentParamValues[1]);
    }

    return { mergedBuffs, combatState };
}