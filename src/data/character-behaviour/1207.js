export function applyLupaLogic({
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

    const state = characterState?.activeStates;
    const local = (value) => {
        return state?.[value];
    };

    const name = skillMeta.name?.toLowerCase();

    if (local('wildfireBanner') && !mergedBuffs.__wildfireBanner) {
        mergedBuffs.atkPercent = (mergedBuffs.atkPercent ?? 0) + 12;
        mergedBuffs.__wildfireBanner = true;
    }

    const stacks = characterState?.activeStates?.packHunt ?? 0;
    const packHunt = Math.min(stacks * 6, 12);

    if (!mergedBuffs.__lupaPackHuntApplied && local('packHunt1')) {
        mergedBuffs.atkPercent = (mergedBuffs.atkPercent ?? 0) + packHunt;
        mergedBuffs.__lupaPackHuntApplied = true;
    }

    if (local('packHunt1') && !mergedBuffs.__packHunt1) {
        mergedBuffs.atkPercent = (mergedBuffs.atkPercent ?? 0) + 6;
        mergedBuffs.fusion = (mergedBuffs.fusion ?? 0) + 10;
        mergedBuffs.__packHunt1 = true;
    }

    const team = state?.teamBase;
    let isTeamValid = team?.length === 3 &&
        team?.every(char => Number(char.Attribute) === 2);

    if (local('packHunt2') && isTeamValid && !mergedBuffs.__packHunt2) {
        mergedBuffs.fusion = (mergedBuffs.fusion ?? 0) + 10;
        mergedBuffs.__packHunt2 = true;
    }

    if (name.includes('mid-air attack - firestrike dmg')) {
        skillMeta.skillType = 'heavy';
    } else if (['nowhere to run!', 'dance with the wolf dmg', 'dance with the wolf: climax dmg'].some(n => name.includes(n))) {
        skillMeta.skillType = 'ultimate';
    } else if (name.includes('set the arena ablaze dmg')) {
        skillMeta.skillType = 'skill';
    }

    const inherent2Stacks = characterState?.activeStates?.inherent2 ?? 0;
    const inherent2 =
        typeof inherent2Stacks === 'boolean' || isActiveSequence(3)
            ? (inherent2Stacks ? 15 : 0)
            : (Math.min(inherent2Stacks * 3, 9) + (isTeamValid ? 6 : 0));

    if (skillMeta.element === 'fusion') {
        skillMeta.skillResIgnore = (skillMeta.skillResIgnore ?? 0) + inherent2;
    }

    if (isToggleActive(1) && isActiveSequence(1)) {
        if (!mergedBuffs.__lupSeq1) {
            mergedBuffs.critRate = (mergedBuffs.critRate ?? 0) + 25;
            mergedBuffs.__lupSeq1 = true;
        }
    } else {
        mergedBuffs.__lupSeq1 = false;
    }

    const seq2Value = characterState?.toggles?.['2_value'] ?? 0;
    if (isActiveSequence(2) && seq2Value > 0) {
        if (!mergedBuffs.__lupSeq2) {
            mergedBuffs.fusion = (mergedBuffs.fusion ?? 0) + (seq2Value * 20);
            mergedBuffs.__lupSeq2 = true;
        }
    } else {
        mergedBuffs.__lupSeq2 = false;
    }

    if (isActiveSequence(3) && name.includes('nowhere to run! dmg')) {
        skillMeta.multiplier *= 2;
    }

    if (isActiveSequence(4) && name.includes('dance with the wolf: climax dmg')) {
        skillMeta.multiplier *= 2.25;
    }

    if (isToggleActive(5) && isActiveSequence(5)) {
        if (!mergedBuffs.__lupSeq3) {
            mergedBuffs.resonanceLiberation = (mergedBuffs.resonanceLiberation ?? 0) + 15;
            mergedBuffs.__lupSeq3 = true;
        }
    } else {
        mergedBuffs.__lupSeq3 = false;
    }

    if (isActiveSequence(6)) {
        const isTargetSkill =
            ['nowhere to run! dmg', 'dance with the wolf: climax dmg'].some(n => name.includes(n)) ||
            (skillMeta.tab === 'resonanceLiberation' && name.includes('skill damage'));

        if (isTargetSkill && !skillMeta.__lupSeq6) {
            skillMeta.skillDefIgnore = (skillMeta.skillDefIgnore ?? 0) + 30;
            skillMeta.__lupSeq6 = true;
        }
    } else {
        skillMeta.__lupSeq6 = false;
    }

    return { mergedBuffs, combatState, skillMeta };
}

export function lupaBuffsLogic({
                                     mergedBuffs, characterState, activeCharacter
                                 }) {
    const state = characterState?.activeStates ?? {};
    const local = (value) => {
        return state?.[value];
    };

    const team = state?.teamBase;
    const isTeamValid = ((team?.length === 3 &&
        team?.every(char => Number(char.Attribute) === 2)) || state.wolflame) ?? false;


    const stacks2 = (state.huntingField ?? 0) * 20;

    const stacksPack = state.packHunt ?? 0;
    const packHunt = Math.min(stacksPack * 6, 18);

    if (!mergedBuffs.__lupaPackHuntApplied) {
        mergedBuffs.atkPercent = (mergedBuffs.atkPercent ?? 0) + packHunt;
        mergedBuffs.__lupaPackHuntApplied = true;
    }

    if (local('packHunt1') && !mergedBuffs.__packHunt1) {
        mergedBuffs.atkPercent = (mergedBuffs.atkPercent ?? 0) + 6;
        mergedBuffs.fusion = (mergedBuffs.fusion ?? 0) + 10;
        mergedBuffs.__packHunt1 = true;
    }

    if (local('packHunt2') && isTeamValid && !mergedBuffs.__packHunt2) {
        mergedBuffs.fusion = (mergedBuffs.fusion ?? 0) + 10;
        mergedBuffs.__packHunt2 = true;
    }

    if (state.warrior) {
        mergedBuffs.damageTypeAmplify.basic = (mergedBuffs.damageTypeAmplify.basic ?? 0) + 25;
        mergedBuffs.elementDmgAmplify.fusion = (mergedBuffs.elementDmgAmplify.fusion ?? 0) + 20;
    }

    mergedBuffs.fusion = (mergedBuffs.fusion ?? 0) + stacks2;

    return { mergedBuffs };
}

export function lupaSkillMetaBuffsLogic({
                                            characterState,
                                            skillMeta
                                        }) {

    const state = characterState?.activeStates ?? {};
    const element = skillMeta?.element ?? null;

    const team = state?.teamBase;
    const isTeamValid = ((team?.length === 3 &&
        team?.every(char => Number(char.Attribute) === 2)) || state.wolflame) ?? false;

    const stacks = typeof state.glory === 'boolean'
        ? (state.glory ? 15 : 0)
        : (state.glory ?? 0) * 3 + (isTeamValid ? 6 : 0);

    skillMeta.skillResIgnore = (skillMeta.skillResIgnore ?? 0)
        + (element === 'fusion' && state.glory > 0 ? stacks : 0);

    return { skillMeta };
}