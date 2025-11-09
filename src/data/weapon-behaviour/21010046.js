export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     currentParamValues = [],
                                 }) {

    const atk = parseFloat(currentParamValues[0]);
    const firstp = parseFloat(currentParamValues[1]);

    mergedBuffs.atkPercent = (mergedBuffs.atkPercent ?? 0) + atk;

    if (characterState?.activeStates?.firstP) {
        mergedBuffs.heavyAtk = (mergedBuffs.heavyAtk ?? 0) + firstp;
    }

    return { mergedBuffs, combatState, skillMeta };
}

export function updateSkillMeta({
                                    characterState,
                                    skillMeta = {},
                                    currentParamValues = []
                                } ) {
    const defIgnore = characterState?.activeStates?.eminenceStacks ?? 0;
    if (skillMeta.skillType.includes('heavy')) {
        skillMeta.skillDefIgnore = (skillMeta.skillDefIgnore ?? 0) + defIgnore * parseFloat(currentParamValues[3]);
    }

    return skillMeta;
}