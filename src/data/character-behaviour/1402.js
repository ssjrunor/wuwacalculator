export function applyYangLogic({
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
        if (name.includes('stormy strike')) {}
        skillMeta.skillType = 'heavy';
    } else {
        skillMeta.skillType = 'basic';
    }

    if (isToggleActiveLocal('inherent2') && !mergedBuffs.__yangInherent1) {
        mergedBuffs.aero = (mergedBuffs.aero ?? 0) + 8;
        mergedBuffs.__yangInherent1 = true;
    }

    if (isActiveSequence(1) && isToggleActive(1) && !mergedBuffs.yangS1) {
        mergedBuffs.aero = (mergedBuffs.aero ?? 0) + 15;
        mergedBuffs.yangS1 = true;
    }

    if (isActiveSequence(3) && !mergedBuffs.yangS3) {
        mergedBuffs.resonanceSkill = (mergedBuffs.resonanceSkill ?? 0) + 40;
    }

    if (isActiveSequence(4) && name.includes('feather release\'s')) {
        skillMeta.skillDmgBonus *= (skillMeta.skillDmgBonus ?? 0) + 95;
    }

    if (isActiveSequence(4) && tab === 'resonanceLiberation') {
        skillMeta.skillDmgBonus *= (skillMeta.skillDmgBonus ?? 0) + 85;
    }

    if (isActiveSequence(6) && isToggleActive(6) && !mergedBuffs.yangS6) {
        mergedBuffs.atkPercent = (mergedBuffs.atkPercent ?? 0) + 20;
        mergedBuffs.yangS6 = true;
    }

    return {mergedBuffs, combatState, skillMeta};
}

export function yangBuffsLogic({
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

    if (state.sweetHymn) {
        mergedBuffs.atkPercent = (mergedBuffs.atkPercent ?? 0) + 20;
    }

    return { mergedBuffs };
}