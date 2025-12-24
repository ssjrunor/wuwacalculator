export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     skillMeta = {},
                                     currentParamValues = []
                                 }) {
    const atk = parseFloat(currentParamValues[0]);
    mergedBuffs.atk.percent += atk;
    return { mergedBuffs, combatState, skillMeta };
}