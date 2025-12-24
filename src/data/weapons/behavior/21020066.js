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

    mergedBuffs.atk.percent += atk;
    mergedBuffs.skillType.heavyAtk.dmgBonus += heavy * stacks;

    if (characterState?.activeStates?.firstP2) {
        mergedBuffs.skillType.echoSkill.dmgBonus += echoSkill;
    }

    return { mergedBuffs, combatState, skillMeta };
}