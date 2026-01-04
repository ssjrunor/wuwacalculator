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
    const name = skillMeta.name?.toLowerCase() ?? '';
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
        mergedBuffs.attribute.fusion.dmgBonus += 10;
        mergedBuffs.__encoreInherent1 = true;
    }

    if (isToggleActiveLocal('inherent2') && !mergedBuffs.__encoreInherent2) {
        mergedBuffs.attribute.fusion.dmgBonus += 10;
        mergedBuffs.__encoreInherent2 = true;
    }

    const encoreS1 = characterState?.toggles?.['1_value'] ?? 0;
    const encoreSeq1stacks = Math.min(encoreS1 * 3, 12);
    if (isActiveSequence(1) && encoreSeq1stacks > 0 && !mergedBuffs.__encoreSeq1) {
        mergedBuffs.attribute.fusion.dmgBonus += encoreSeq1stacks;
        mergedBuffs.__encoreSeq1 = true;
    }

    if (isActiveSequence(3) && tab === 'forteCircuit') {
        skillMeta.multiplier *= 1.4;
    }

    if (isActiveSequence(4) && isToggleActive(4) && !mergedBuffs.__encoreS4) {
        mergedBuffs.attribute.fusion.dmgBonus += 20;
        mergedBuffs.__encoreS4 = true;
    }

    if (isActiveSequence(5) && !mergedBuffs.__encoreS5) {
        mergedBuffs.skillType.resonanceSkill.dmgBonus += 35;
        mergedBuffs.__encoreS5 = true;
    }

    const encoreS6 = characterState?.toggles?.['6_value'] ?? 0;
    const encoreSeq6stacks = Math.min(encoreS6 * 5, 25);
    if (isActiveSequence(1) && encoreSeq6stacks > 0 && !mergedBuffs.__encoreSeq6) {
        mergedBuffs.atk.percent += encoreSeq6stacks;
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
                                     mergedBuffs, characterState
                                 }) {
    const state = characterState?.activeStates ?? {};

    if (state.adventure) {
        mergedBuffs.attribute.fusion.dmgBonus += 20;
    }

    return { mergedBuffs };
}