export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                 currentParamValues = []
                                 }) {
    const energy = parseFloat(currentParamValues[0]);
    const firstP = parseFloat(currentParamValues[1]);
    const secondP = parseFloat(currentParamValues[3]);

    mergedBuffs.energyRegen += energy;


    if (characterState?.activeStates?.firstP) {
        mergedBuffs.skillType.basicAtk.dmgBonus += firstP;
    }

    if (characterState?.activeStates?.secondP) {
        mergedBuffs.skillType.resonanceSkill.dmgBonus += secondP;
    }

    return { mergedBuffs, combatState, skillMeta };
}
