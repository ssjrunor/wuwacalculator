export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     currentParamValues = [],
                                 }) {
    const atk = parseFloat(currentParamValues[0]);
    const heavy = parseFloat(currentParamValues[2]);
    const stacks = characterState?.activeStates?.stacks ?? 0;
    const echoSkill = parseFloat(currentParamValues[4]);

    mergedBuffs.atkPercent = (mergedBuffs.atkPercent ?? 0) + atk;
    mergedBuffs.heavyAtk = (mergedBuffs.heavyAtk ?? 0) + heavy * stacks;

    if (characterState?.activeStates?.firstP2) {
        mergedBuffs.echoSkill = (mergedBuffs.echoSkill ?? 0) + echoSkill;
    }

    return { mergedBuffs, combatState, skillMeta };
}