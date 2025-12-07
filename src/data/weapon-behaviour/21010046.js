export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     currentParamValues = [],
                                 }) {

    const atk = parseFloat(currentParamValues[0]);
    const firstp = parseFloat(currentParamValues[1]);
    const defIgnore = characterState?.activeStates?.eminenceStacks ?? 0;
    mergedBuffs.skillType.heavyAtk.defIgnore += defIgnore * parseFloat(currentParamValues[3]);

    mergedBuffs.atk.percent += atk;

    if (characterState?.activeStates?.firstP) {
        mergedBuffs.skillType.heavyAtk.dmgBonus += firstp;
    }

    return { mergedBuffs, combatState };
}