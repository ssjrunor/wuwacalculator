export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     currentParamValues = [],
                                 }) {

    const atk = parseFloat(currentParamValues[0]);
    const firstP = parseFloat(currentParamValues[1]);

    mergedBuffs.atk.percent += atk;


    if (characterState?.activeStates?.firstP) {
        mergedBuffs.skillType.heavyAtk.dmgBonus += firstP;
    }


    return { mergedBuffs, combatState, skillMeta };
}
