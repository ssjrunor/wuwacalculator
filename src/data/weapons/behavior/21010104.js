export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     currentParamValues = [],
                                 }) {

    const atk = parseFloat(currentParamValues[0]);
    const heavyAtk = parseFloat(currentParamValues[1]);

    if (characterState?.activeStates?.firstP) {
        mergedBuffs.atk.percent += atk;
        mergedBuffs.skillType.heavyAtk.dmgBonus += heavyAtk;
    }

    return { mergedBuffs, combatState, skillMeta };
}