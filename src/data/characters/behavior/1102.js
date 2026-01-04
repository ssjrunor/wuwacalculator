export function applySanhuaLogic({
                                     mergedBuffs,
                                     combatState,
                                     skillMeta,
                                     characterState,
                                     isActiveSequence = () => false,
                                     isToggleActive = () => false
                                 }) {
    skillMeta = {
        name: skillMeta?.name ?? '',
        skillType: skillMeta?.skillType ?? 'basic',
        multiplier: skillMeta?.multiplier ?? 1,
        amplify: skillMeta?.amplify ?? 0,
        ...skillMeta
    };

    const name = skillMeta.name?.toLowerCase() ?? '';

    const isBurstAttack = [
        'glacier burst damage',
        'ice prism burst damage',
        'ice thorn burst damage'
    ].some(n => name.includes(n));

    const isDetonate = name.includes('detonate damage');

    if (isBurstAttack) {
        skillMeta.skillType = 'skill';
    } else if (isDetonate) {
        skillMeta.skillType = 'heavy';
    }

    if (
        isToggleActive('inherent1') &&
        skillMeta.tab === 'resonanceSkill' &&
        name === 'skill dmg'
    ) {
        skillMeta.skillDmgBonus = (skillMeta.skillDmgBonus ?? 0) + 20;
    }

    if (isToggleActive('inherent2') && isBurstAttack) {
        skillMeta.skillDmgBonus = (skillMeta.skillDmgBonus ?? 0) + 20;
    }

    if (isToggleActive(1) && isActiveSequence(1)) {
        if (!mergedBuffs.__sanhuaSeq1) {
            mergedBuffs.critRate += 15;
            mergedBuffs.__sanhuaSeq1 = true;
        }
    } else {
        mergedBuffs.__sanhuaSeq1 = false;
    }

    if (isToggleActive(3) && isActiveSequence(3)) {
        if (!mergedBuffs.__sanhuaSeq3) {
            mergedBuffs.attribute.glacio.dmgBonus += 35;
            mergedBuffs.__sanhuaSeq3 = true;
        }
    } else {
        mergedBuffs.__sanhuaSeq3 = false;
    }

    const seq6Value = characterState?.toggles?.['6_value'] ?? 0;
    if (isActiveSequence(6) && seq6Value > 0) {
        if (!mergedBuffs.__sanhuaSeq6) {
            mergedBuffs.atk.percent += (seq6Value * 10);
            mergedBuffs.__sanhuaSeq6 = true;
        }
    } else {
        mergedBuffs.__sanhuaSeq6 = false;
    }

    if (isToggleActive(4) && isDetonate) {
        skillMeta.skillDmgBonus = (skillMeta.skillDmgBonus ?? 0) + 120;
    }

    if (isActiveSequence(5) && isToggleActive(5) && isBurstAttack) {
        skillMeta.critDmgBonus = (skillMeta.critDmgBonus ?? 0) + 100;
    }

    return { mergedBuffs, combatState, skillMeta };
}

export function sanhuaBuffsLogic({
                                      mergedBuffs, characterState
                                  }) {
    const state = characterState?.activeStates ?? {};
    const stacks = (state.daybreak ?? 0) * 10;

    if (state.silversnow) {
        mergedBuffs.skillType.basicAtk.amplify += 38;
    }
    mergedBuffs.atk.percent += stacks;

    return { mergedBuffs };
}
