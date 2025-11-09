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

    mergedBuffs.energyRegen = (mergedBuffs.energyRegen ?? 0) + energy;


    if (characterState?.activeStates?.firstP) {
        mergedBuffs.basicAtk = (mergedBuffs.basicAtk ?? 0) + firstP;
    }

    if (characterState?.activeStates?.secondP) {
        mergedBuffs.resonanceSkill = (mergedBuffs.resonanceSkill ?? 0) + secondP;
    }

    return { mergedBuffs, combatState, skillMeta };
}