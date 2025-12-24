export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     currentParamValues = []
                                 }) {
    const atkBonus = parseFloat(currentParamValues[0]);
    const amplify = parseFloat(currentParamValues[2]);
    mergedBuffs.atk.percent += atkBonus;

    if (characterState?.activeStates?.darknessBreaker) {
        mergedBuffs.skillType.spectroFrazzle.amplify += amplify;
    }

    return { mergedBuffs, combatState, skillMeta };
}

export function updateSkillMeta({
                                    characterState,
                                    skillMeta = {},
                                    currentParamValues = []
                                } ) {
    const defIgnore = parseFloat(currentParamValues[1]);
    if (
        characterState?.activeStates?.darknessBreaker &&
        (
            skillMeta.skillType.includes('basic') ||
            skillMeta.tab === 'forteCircuit'
        )
    ) {
        skillMeta.skillDefIgnore = (skillMeta.skillDefIgnore ?? 0) + defIgnore;
    }

    return skillMeta;
}