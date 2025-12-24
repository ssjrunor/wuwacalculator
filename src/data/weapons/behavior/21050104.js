export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     currentParamValues = [],
                                 }) {

    const atk = parseFloat(currentParamValues[0]);
    const basic = parseFloat(currentParamValues[0]);

    if (characterState?.activeStates?.firstP) {
        mergedBuffs.atk.percent += atk;
        mergedBuffs.skillType.basicAtk.dmgBonus += basic;
    }

    return { mergedBuffs, combatState, skillMeta };
}
