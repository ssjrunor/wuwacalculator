export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     currentParamValues = [],
                                     activeCharacter
                                 }) {
    const hp = parseFloat(currentParamValues[0]);
    const defIgnore = parseFloat(currentParamValues[1]);
    const amp = parseFloat(currentParamValues[2]);

    const elementMap = {
        1: 'glacio',
        2: 'fusion',
        3: 'electro',
        4: 'aero',
        5: 'spectro',
        6: 'havoc'
    };
    const element = elementMap?.[activeCharacter?.attribute];

    mergedBuffs.hpPercent = (mergedBuffs.hpPercent ?? 0) + hp;

    if (characterState?.activeStates?.firstP) {
        mergedBuffs.enemyDefIgnore = (mergedBuffs.enemyDefIgnore ?? 0) + defIgnore;
    }

    if (characterState?.activeStates?.secondP && combatState.aeroErosion >= 1) {
        mergedBuffs.elementDmgAmplify[element] = (mergedBuffs.elementDmgAmplify[element] ?? 0) + amp;
    }

    return { mergedBuffs, combatState, skillMeta };
}