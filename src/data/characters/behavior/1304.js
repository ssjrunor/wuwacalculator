export function applyJinhsiLogic({
                               mergedBuffs,
                               combatState,
                               skillMeta,
                               characterState,
                               isActiveSequence = () => false,
                               isToggleActive = () => false,
    characterLevel = 1,
                           }) {
    skillMeta = {
        name: skillMeta?.name ?? '',
        skillType: skillMeta?.skillType ?? 'basic',
        multiplier: skillMeta?.multiplier ?? 1,
        amplify: skillMeta?.amplify ?? 0,
        ...skillMeta
    };

    const name = skillMeta.name?.toLowerCase() ?? '';
    const tab = skillMeta.tab ?? '';

    if (!mergedBuffs.__jinhsiInherent1 && characterLevel >= 50) {
        mergedBuffs.attribute.spectro.dmgBonus += 20;
        mergedBuffs.__jinhsiInherent1 = true;
    }

    if (tab === 'forteCircuit') {
        if (name.includes('heavy') || name.includes('dodge')) {
            if (name.includes('heavy')) {
                skillMeta.skillType = 'heavy';
            } else {
                skillMeta.skillType = 'basic';
            }
        } else {
            skillMeta.skillType = 'skill';
        }
    }

    if (name === 'additional multiplier per incandescence') {
        characterState.activeStates.__incandescenceValue = skillMeta.multiplier;
        skillMeta.visible = false;
    }

    if (name === 'illuminous epiphany: stella glamor dmg') {
        const stacks = characterState?.activeStates?.incandescence ?? 0;
        const perStack = characterState?.activeStates?.__incandescenceValue ?? 0;
        const bonusMultiplier = Math.min(stacks * perStack, 58);
        skillMeta.multiplier += bonusMultiplier;
    }

    if (tab === 'introSkill' && characterLevel >= 70) {
        skillMeta.multiplier *= 1.5;
    }

    const seq1Value = characterState?.toggles?.['1_value'] ?? 0;
    if (isActiveSequence(1) && seq1Value > 0 && name.includes('illuminous epiphany')) {
        skillMeta.skillDmgBonus = (skillMeta.skillDmgBonus ?? 0) + seq1Value * 20;
    }

    const seq3Value = characterState?.toggles?.['3_value'] ?? 0;
    if (isActiveSequence(3) && seq3Value > 0) {
        if (!mergedBuffs.__jinhsiS3) {
            mergedBuffs.atk.percent += (seq3Value * 25);
            mergedBuffs.__jinhsiS3 = true;
        }
    } else {
        mergedBuffs.__jinhsiS3 = false;
    }

    if (isActiveSequence(4) && isToggleActive(4) && !mergedBuffs.__jinhsiS4) {
        mergedBuffs.attribute.all.dmgBonus += 20;
        mergedBuffs.__jinhsiS4 = true;
    }


    if (isActiveSequence(5) && tab === 'resonanceLiberation') {
        skillMeta.multiplier *= 2.2;
    }

    if (isActiveSequence(6) && name.includes('illuminous epiphany')) {
        skillMeta.multiplier *= 1.45;
    }

    return {mergedBuffs, combatState, skillMeta};
}

export function jinhsiBuffsLogic({
                                   mergedBuffs, characterState, activeCharacter
                               }) {
    const state = characterState?.activeStates ?? {};

    if (state.benevolent) {
        mergedBuffs.attribute.all.dmgBonus += 20;
    }

    return { mergedBuffs };
}