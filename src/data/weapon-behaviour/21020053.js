export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     skillMeta = {},
                                     currentParamValues = []
                                 }) {
    const bonus = parseFloat(currentParamValues[0]);
    mergedBuffs.resonanceSkill = (mergedBuffs.resonanceSkill ?? 0) + bonus;


    return { mergedBuffs, combatState, skillMeta };
}