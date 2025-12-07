export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     isToggleActive = () => false,
                                     currentParamValues = [],
                                     activeCharacter
                                 }) {
    const attr = parseFloat(currentParamValues[0]);
    const skill = parseFloat(currentParamValues[1]);

    mergedBuffs.attribute.all.dmgBonus += attr;
    if (characterState?.activeStates?.ageless) {
        mergedBuffs.skillType.resonanceSkill.dmgBonus += skill;
    }

    if (characterState?.activeStates?.ethereal) {
        mergedBuffs.skillType.resonanceSkill.dmgBonus += skill;
    }

    return { mergedBuffs, combatState, skillMeta };
}