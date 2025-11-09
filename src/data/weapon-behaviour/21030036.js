export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     currentParamValues = [],
                                 }) {
    const atk = parseFloat(currentParamValues[0]);
    const heavy = parseFloat(currentParamValues[1]);
    const defIgnore = parseFloat(currentParamValues[6]);

    mergedBuffs.atkPercent = (mergedBuffs.atkPercent ?? 0) + atk;

    if (characterState?.activeStates?.firstP1) {
        mergedBuffs.damageTypeAmplify.heavy = (mergedBuffs.damageTypeAmplify.heavy ?? 0) + heavy;
    }

    if (characterState?.activeStates?.firstP2) {
        mergedBuffs.damageTypeAmplify.echoSkill = (mergedBuffs.damageTypeAmplify.echoSkill ?? 0) + heavy;
    }

    if (characterState?.activeStates?.firstP1 && characterState?.activeStates?.firstP2) {
        mergedBuffs.enemyDefIgnore = (mergedBuffs.enemyDefIgnore ?? 0) + defIgnore;
    }

    return { mergedBuffs, combatState, skillMeta };
}