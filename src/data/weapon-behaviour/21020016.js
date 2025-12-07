export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     currentParamValues = [],
                                 }) {

    const atk = parseFloat(currentParamValues[0]);
    const skill = parseFloat(currentParamValues[1]) * (characterState?.activeStates?.stacks ?? 0);

    mergedBuffs.atk.percent += atk;
    mergedBuffs.skillType.resonanceSkill.dmgBonus += skill;

    return { mergedBuffs, combatState, skillMeta };
}