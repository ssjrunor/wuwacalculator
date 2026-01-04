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
    const name = skillMeta.name?.toLowerCase() ?? '';
    const tab = skillMeta.tab ?? '';

    if (tab === 'forteCircuit') {
        if (name.includes('stormy strike')) {}
        skillMeta.skillType = 'heavy';
    } else {
        skillMeta.skillType = 'basic';
    }

    if (isToggleActiveLocal('inherent2') && !mergedBuffs.__yangInherent1) {
        mergedBuffs.attribute.aero.dmgBonus += 8;
        mergedBuffs.__yangInherent1 = true;
    }

    if (isActiveSequence(1) && isToggleActive(1) && !mergedBuffs.yangS1) {
        mergedBuffs.attribute.aero.dmgBonus += 15;
        mergedBuffs.yangS1 = true;
    }

    if (isActiveSequence(3) && !mergedBuffs.yangS3) {
        mergedBuffs.skillType.resonanceSkill.dmgBonus += 40;
    }

    if (isActiveSequence(4) && name.includes('feather release\'s')) {
        skillMeta.skillDmgBonus *= (skillMeta.skillDmgBonus ?? 0) + 95;
    }

    if (isActiveSequence(4) && tab === 'resonanceLiberation') {
        skillMeta.skillDmgBonus *= (skillMeta.skillDmgBonus ?? 0) + 85;
    }

    if (isActiveSequence(6) && isToggleActive(6) && !mergedBuffs.yangS6) {
        mergedBuffs.atk.percent += 20;
        mergedBuffs.yangS6 = true;
    }

    return {mergedBuffs, combatState, skillMeta};
}

export function yangBuffsLogic({
                                  mergedBuffs, characterState
                              }) {
    const state = characterState?.activeStates ?? {};

    if (state.sweetHymn) {
        mergedBuffs.atk.percent += 20;
    }

    return { mergedBuffs };
}