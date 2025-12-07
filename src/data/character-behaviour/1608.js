export function applyPhrolovaLogic({
                                   mergedBuffs,
                                   combatState,
                                   skillMeta,
                                   characterState,
                                   isActiveSequence = () => false,
                                   isToggleActive = () => false,
                                   characterLevel = 1,
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

    const name = skillMeta.name?.toLowerCase();
    const tab = skillMeta.tab ?? '';

    if (name.includes('scarlet coda') || name.includes('suite of immortality') || tab === 'forteCircuit') {
        skillMeta.skillType = 'skill';
    } else if (tab === 'resonanceLiberation') {
        skillMeta.skillType = 'echoSkill';
    }

    const stacks = characterState?.activeStates?.inherent2 ?? 0;
    const critBonus = (stacks >= 24)
        ? 60 + (stacks - 24)
        : 2.5 * stacks;
    if (!mergedBuffs.__phrolovaInherent2) {
        mergedBuffs.critDmg += critBonus;
        mergedBuffs.__phrolovaInherent2 = true;
    }

    if (characterState?.activeStates?.maestro && !mergedBuffs.__phrolovaMaestro) {
        mergedBuffs.atk.percent += 120;
        mergedBuffs.__phrolovaMaestro = true;
    }

    if (name.includes('dmg multiplier increase per aftersound')) {
        characterState.activeStates.__aftersound = skillMeta.multiplier;
        skillMeta.visible = false;
    }

    if (name.includes('scarlet coda')) {
        const perStack = characterState.activeStates.__aftersound ?? 0;
        const bonusMultiplier = Math.min(stacks * perStack, 24 * perStack);
        skillMeta.multiplier += bonusMultiplier;
    }

    if (isActiveSequence(1) && tab === 'forteCircuit') {
        skillMeta.multiplier *= 1.8;
    }

    if (isActiveSequence(2) && (name.includes('dmg multiplier increase per aftersound') || name.includes('scarlet coda'))) {
        skillMeta.multiplier *= 1.75;
    }

    if (isActiveSequence(3)) {
        if (!mergedBuffs.__phrolovaS3) {
            mergedBuffs.skillType.echoSkill.amplify += 80;
            mergedBuffs.__phrolovaS3 = true;
        }

        if (name.includes('suite of immortality')) {
            skillMeta.multiplier *= 1.8;
        }
    }

    if (isActiveSequence(4) && isToggleActive(4) && !mergedBuffs.__phrolovaS4) {
        mergedBuffs.attribute.all.dmgBonus += 20;
        mergedBuffs.__phrolovaS4 = true;
    }

    if (isActiveSequence(6)) {
        if (name.includes('enhanced attack - hecate')) {
            skillMeta.multiplier *= 1.24;
        }

        if (isToggleActive('6-a') && !mergedBuffs.__phrolovaS6a) {
            mergedBuffs.attribute.havoc.dmgBonus += 60;
            mergedBuffs.__phrolovaS6a = true;
        } else if (isToggleActive('6-b') && !mergedBuffs.__phrolovaS6b) {
            mergedBuffs.attribute.all.dmgVuln += 40;
            mergedBuffs.__phrolovaS6b = true;
        }
    }

    if (name.includes('apparition of beyond - hecate')) {
        skillMeta.multiplier = 216.42/100;
        skillMeta.skillType = 'echoSkill';
        skillMeta.visible = isActiveSequence(6);
    }

    return {mergedBuffs, combatState, skillMeta};
}

export const phrolovaMultipliers = {
    forteCircuit: [
        {
            name: "Apparition of Beyond - Hecate DMG",
            scaling: { atk: 1 },
        }
    ]
};


export function phrolovaBuffsLogic({
                                   mergedBuffs, characterState
                               }) {
    const state = characterState?.activeStates ?? {};

    if (state.illuminating) {
        mergedBuffs.attribute.all.dmgBonus += 20;
    }

    if (state.unfinishedPiece) {
        mergedBuffs.skillType.heavyAtk.amplify += 25;
        mergedBuffs.attribute.havoc.amplify += 20;
    }

    return { mergedBuffs };
}