export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     currentParamValues = [],
                                 }) {

    const atk = parseFloat(currentParamValues[0]);
    const firstp = parseFloat(currentParamValues[1]);

    mergedBuffs.atk.percent += atk;

    if (characterState?.activeStates?.firstP) {
        mergedBuffs.skillType.resonanceLiberation.dmgBonus += firstp;
    }

    return { mergedBuffs, combatState, skillMeta };
}

export function updateSkillMeta({
                                    characterState,
                                    skillMeta = {},
    currentParamValues = [],
                                } ) {
    const defIgnore = characterState?.activeStates?.pleniluneStacks ?? 0;
    if (skillMeta.skillType.includes('ultimate')) {
        skillMeta.skillDefIgnore = (skillMeta.skillDefIgnore ?? 0) + defIgnore * parseFloat(currentParamValues[3]);
    }

    return skillMeta;
}
