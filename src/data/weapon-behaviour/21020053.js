export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     skillMeta = {},
                                     currentParamValues = []
                                 }) {
    const bonus = parseFloat(currentParamValues[0]);
    mergedBuffs.skillType.resonanceSkill.dmgBonus += bonus;


    return { mergedBuffs, combatState, skillMeta };
}