export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     currentParamValues = [],
                                 }) {
    const atk = parseFloat(currentParamValues[0]);
    const atkBonus = parseFloat(currentParamValues[1]);
    const basic = parseFloat(currentParamValues[2]);

    mergedBuffs.atk.percent += atk;

    if (characterState?.activeStates?.firstP) {
        mergedBuffs.atk.percent += atkBonus;
        mergedBuffs.skillType.basicAtk.dmgBonus += basic;
    }

    return { mergedBuffs, combatState, skillMeta };
}
