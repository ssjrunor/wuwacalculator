export function applyChangliLogic({
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
        skillMeta.skillType = 'skill';
    }

    const inherent1Stacks = characterState?.activeStates?.inherent1 ?? 0;
    const inherent1 = Math.min(inherent1Stacks * 5, 20);

    if (tab === 'resonanceSkill')
        skillMeta.skillDmgBonus = (skillMeta.skillDmgBonus ?? 0) + inherent1;

    if (isToggleActiveLocal('inherent2') && (tab === 'forteCircuit' || tab === 'resonanceLiberation')) {
        skillMeta.skillDefIgnore = (skillMeta.skillDefIgnore ?? 0) + 15;
        skillMeta.skillDmgBonus = (skillMeta.skillDmgBonus ?? 0) + 20;
    }

    if (isActiveSequence(1) && isToggleActive(1) && !mergedBuffs.__changliS1) {
        mergedBuffs.attribute.fusion.dmgBonus += 10;
        mergedBuffs.__changliS1 = true;
    }

    if (isActiveSequence(2) && isToggleActive(2) && !mergedBuffs.__changliS2) {
        mergedBuffs.critRate += 25;
        mergedBuffs.__changliS2 = true;
    }

    if (isActiveSequence(3) && tab === 'resonanceLiberation') {
        skillMeta.multiplier *= 1.8;
    }

    if (isActiveSequence(4) && isToggleActive(4) && !mergedBuffs.__changliS4) {
        mergedBuffs.atk.percent += 20;
        mergedBuffs.__changliS4 = true;
    }

    if (isActiveSequence(5) && tab === 'forteCircuit') {
        skillMeta.multiplier *= 1.5;
        if (!mergedBuffs.__changliS5) {
            skillMeta.skillDmgBonus = (skillMeta.skillDmgBonus ?? 0) + 50;
            mergedBuffs.__changliS5 = true;
        }
    }

    if (isActiveSequence(6) && !mergedBuffs.__changliS6 && ['forteCircuit', 'resonanceLiberation', 'resonanceSkill'].some(n => tab.includes(n))) {
        skillMeta.skillDefIgnore = (skillMeta.skillDefIgnore ?? 0) + 40;
        mergedBuffs.__changliS6 = true;
    }
    return {mergedBuffs, combatState, skillMeta};
}

export function changliBuffsLogic({
                                     mergedBuffs, characterState
                                 }) {
    const state = characterState?.activeStates ?? {};

    if (state.duality) {
        mergedBuffs.attribute.fusion.amplify += 20;
        mergedBuffs.skillType.resonanceLiberation.amplify += 25;
    }

    if (state.polished) {
        mergedBuffs.atk.percent += 20;
    }

    return { mergedBuffs };
}