export function applyEncoreLogic({
                                     mergedBuffs,
                                     combatState,
                                     skillMeta,
                                     characterState,
                                     isActiveSequence = () => false,
                                     isToggleActive = () => false,
                                 }) {
    skillMeta = {
        name: skillMeta?.name ?? '',
        skillType: skillMeta?.skillType ?? 'basic',
        multiplier: skillMeta?.multiplier ?? 1,
        amplify: skillMeta?.amplify ?? 0,
        ...skillMeta
    };

    const isToggleActiveLocal = (key) => characterState?.activeStates?.[key] === true;
    const name = skillMeta.name?.toLowerCase();
    const tab = skillMeta.tab ?? '';


    if (tab === 'forteCircuit') {
        skillMeta.skillType = 'ultimate';
    }
    if (tab === 'outroSkill') {
        skillMeta.multiplier = 176.76/100;
    }
    if (tab === 'resonanceLiberation') {
        if (name.includes('stage') || name === 'cosmos: dodge counter dmg') {
            skillMeta.skillType = 'basic';
        } else if (name.includes('heavy')) {
            skillMeta.skillType = 'heavy';
        } else {
            skillMeta.skillType = 'skill';
        }
    }

    if (isToggleActiveLocal('inherent1') && !mergedBuffs.__encoreInherent1) {
        mergedBuffs.fusion = (mergedBuffs.fusion ?? 0) + 10;
        mergedBuffs.__encoreInherent1 = true;
    }

    if (isToggleActiveLocal('inherent2') && !mergedBuffs.__encoreInherent2) {
        mergedBuffs.fusion = (mergedBuffs.fusion ?? 0) + 10;
        mergedBuffs.__encoreInherent2 = true;
    }

    const encoreS1 = characterState?.toggles?.['1_value'] ?? 0;
    const encoreSeq1stacks = Math.min(encoreS1 * 3, 12);
    if (isActiveSequence(1) && encoreSeq1stacks > 0 && !mergedBuffs.__encoreSeq1) {
        mergedBuffs.fusion = (mergedBuffs.fusion ?? 0) + encoreSeq1stacks;
        mergedBuffs.__encoreSeq1 = true;
    }

    if (isActiveSequence(3) && tab === 'forteCircuit') {
        skillMeta.multiplier *= 1.4;
    }

    if (isActiveSequence(4) && isToggleActive(4) && !mergedBuffs.__encoreS4) {
        mergedBuffs.fusion = (mergedBuffs.fusion ?? 0) + 20;
        mergedBuffs.__encoreS4 = true;
    }

    if (isActiveSequence(5) && !mergedBuffs.__encoreS5) {
        mergedBuffs.resonanceSkill = (mergedBuffs.resonanceSkill ?? 0) + 35;
        mergedBuffs.__encoreS5 = true;
    }

    const encoreS6 = characterState?.toggles?.['6_value'] ?? 0;
    const encoreSeq6stacks = Math.min(encoreS6 * 5, 25);
    if (isActiveSequence(1) && encoreSeq6stacks > 0 && !mergedBuffs.__encoreSeq6) {
        mergedBuffs.atkPercent = (mergedBuffs.atkPercent ?? 0) + encoreSeq6stacks;
        mergedBuffs.__encoreSeq6 = true;
    }

    return {mergedBuffs, combatState, skillMeta};
}

export const encoreMultipliers = {
    outroSkill: [
        {
            name: "Thermal Field",
            scaling: { atk: 1 }
        }
    ]
}

export function encoreBuffsLogic({
                                     mergedBuffs, characterState, activeCharacter
                                 }) {
    const state = characterState?.activeStates ?? {};
    const elementMap = {
        1: 'glacio',
        2: 'fusion',
        3: 'electro',
        4: 'aero',
        5: 'spectro',
        6: 'havoc'
    };
    const element = elementMap?.[activeCharacter?.attribute];

    if (state.adventure) {
        mergedBuffs.fusion = (mergedBuffs.fusion ?? 0) + 20;
    }

    return { mergedBuffs };
}