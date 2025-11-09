export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     currentParamValues = []
                                 }) {
    const atkBonus = parseFloat(currentParamValues[0]);
    const amplify = parseFloat(currentParamValues[2]);
    mergedBuffs.atkPercent = (mergedBuffs.atkPercent ?? 0) + atkBonus;

    if (characterState?.activeStates?.darknessBreaker) {
        mergedBuffs.damageTypeAmplify.spectroFrazzle = (mergedBuffs.damageTypeAmplify.spectroFrazzle ?? 0) + amplify;
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