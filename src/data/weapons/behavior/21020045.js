export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     currentParamValues = [],
                                 }) {
    const atk = parseFloat(currentParamValues[0]);
    const skill = parseFloat(currentParamValues[1]);

    mergedBuffs.atk.percent += atk;

    if (characterState?.activeStates?.firstP) {
        mergedBuffs.skillType.resonanceSkill.dmgBonus += skill;
    }

    return { mergedBuffs, combatState, skillMeta };
}
