export function applyYinlinLogic({
                               mergedBuffs,
                               combatState,
                               skillMeta,
                               characterState,
                               isActiveSequence = () => false,
                               isToggleActive = () => false,
                           }) {
    skillMeta = {
        ...skillMeta,

        name: skillMeta?.name ?? '',
        skillType: Array.isArray(skillMeta?.skillType)
            ? [...skillMeta.skillType]
            : skillMeta?.skillType
                ? [skillMeta.skillType]
                : [],
        multiplier: skillMeta?.multiplier ?? 1,
        amplify: skillMeta?.amplify ?? 0,
    };


    const isToggleActiveLocal = (key) => characterState?.activeStates?.[key] === true;
    const name = skillMeta.name?.toLowerCase() ?? '';
    const tab = skillMeta.tab ?? '';

    if (name === 'chameleon cipher damage') {
        skillMeta.skillType = ['heavy'];
    } else if (name === 'judgment strike damage') {
        skillMeta.skillType = ['skill', 'coord'];
    }

    if (isToggleActiveLocal('inherent1') && !mergedBuffs.__inherent1) {
        mergedBuffs.critRate += 15;
        mergedBuffs.__inherent1 = true;
    }

    if (isToggleActiveLocal('inherent2')) {
        if (name === 'lightning execution damage') {
            skillMeta.skillDmgBonus = (skillMeta.skillDmgBonus ?? 0) + 10;
        } else if (!mergedBuffs.__yinlinInherent2) {
            mergedBuffs.atk.percent += 10;
            mergedBuffs.__yinlinInherent2 = true;
        }
    }


    if (isActiveSequence(1) && !mergedBuffs.__yinlinS1) {
        if (name === 'lightning execution damage' || name === 'magnetic roar damage') {
            skillMeta.skillDmgBonus = (skillMeta.skillDmgBonus ?? 0) + 70;
            mergedBuffs.__yinlinS1 = true;
        }

    }

    if (isActiveSequence(3) && name === 'judgment strike damage') {
        skillMeta.multiplier *= 1.55;
    }

    if (isActiveSequence(4) && isToggleActive(4) && !mergedBuffs.__yinlinS4) {
        mergedBuffs.atk.percent += 20;
        mergedBuffs.__yinlinS4 = true;
    }

    if (isActiveSequence(5) && isToggleActive(5) && !mergedBuffs.__yinlinS5 && tab === 'resonanceLiberation') {
        skillMeta.skillDmgBonus = (skillMeta.skillDmgBonus ?? 0) + 100;
        mergedBuffs.__yinlinS5 = true;
    }

    if (name === 'pursuit of justice: furious thunder damage'
        && isToggleActive(6) && isActiveSequence(6)) {
        skillMeta.multiplier = 419.59/100;
        skillMeta.skillType = ['skill'];
    }

    if (name === 'pursuit of justice: furious thunder damage') {
        skillMeta.visible = isActiveSequence(6);
    }

    return {mergedBuffs, combatState, skillMeta};
}

export const yinlinMultipliers = {
    resonanceLiberation: [
        {
            name: 'Pursuit of Justice: Furious Thunder Damage',
            scaling: { atk: 1 }
        }
    ]
};

export function yinlinBuffsLogic({
                                      mergedBuffs, characterState
                                  }) {
    const state = characterState?.activeStates ?? {};

    if (state.strategist) {
        mergedBuffs.attribute.electro.amplify += 20;
        mergedBuffs.skillType.resonanceLiberation.amplify += 25;
    }

    if (state.conviction) {
        mergedBuffs.atk.percent += 20;
    }

    return { mergedBuffs };
}
