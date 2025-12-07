export function applyLumiLogic({
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
        if (name.includes('energized')) {
            skillMeta.skillType = 'skill';
        } else {
            skillMeta.skillType = 'basic';
        }
    }

    if (isToggleActiveLocal('inherent1') && !mergedBuffs.__lumiInherent1) {
        mergedBuffs.attribute.electro.dmgBonus += 10;
        mergedBuffs.__lumiInherent1 = true;
    }

    if (isToggleActiveLocal('inherent2') && !mergedBuffs.__lumiInherent2) {
        mergedBuffs.atk.eprcent += 10;
        mergedBuffs.__lumiInherent2 = true;
    }

    if (isActiveSequence(2) && name.includes('energized')) {
        skillMeta.skillDefIgnore = (skillMeta.skillDefIgnore ?? 0) + 20;
    }

    if (isActiveSequence(3) && tab === 'resonanceLiberation') {
        skillMeta.skillDmgBonus = (skillMeta.skillDmgBonus ?? 0) + 30;
    }

    if (isActiveSequence(4) && !mergedBuffs.__lumiS4) {
        mergedBuffs.skillType.basicAtk.dmgBonus += 30;
        mergedBuffs.__lumiS4 = true;
    }

    if (isActiveSequence(5) && isToggleActive(5) && name.includes('laser')) {
        skillMeta.multiplier *= 2;
    }

    if (isActiveSequence(6) && isToggleActive(6) && !mergedBuffs.__lumiS6) {
        mergedBuffs.atk.percent += 20;
        mergedBuffs.__lumiS6 = true;
    }

    return {mergedBuffs, combatState, skillMeta};
}

export function lumiBuffsLogic({
                                   mergedBuffs, characterState
                               }) {
    const state = characterState?.activeStates ?? {};

    if (state.escorting) {
        mergedBuffs.skillType.resonanceSkill.amplify += 38;
    }

    if (state.rating) {
        mergedBuffs.atk.percent += 20;
    }

    return { mergedBuffs };
}