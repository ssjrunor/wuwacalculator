export function applySpectroMLogic({
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

    const isToggleActiveLocal = (key) => characterState?.activeStates?.[key] === true;
    const name = skillMeta.name?.toLowerCase();
    const tab = skillMeta.tab ?? '';

    if (tab === 'forteCircuit') {
        skillMeta.skillType = 'skill';
    }

    if (characterLevel >= 50 && name.includes('resonating echoes')) {
        skillMeta.skillDmgBonus = (skillMeta.skillDmgBonus ?? 0) + 60;
    }

    if (isToggleActiveLocal('inherent2') && !mergedBuffs.__spectroMInherent1) {
        mergedBuffs.atk.percent += 15;
        mergedBuffs.__spectroMInherent1 = true;
    }

    if (isToggleActive(1) && isActiveSequence(1) && !mergedBuffs.__spectroMS1) {
        mergedBuffs.critRate += 15;
        mergedBuffs.__spectroMS1 = true;
    }

    if (isActiveSequence(2) && !mergedBuffs.__spectroMS2) {
        mergedBuffs.attribute.spectro.dmgBonus += 20;
        mergedBuffs.__spectroMS2 = true;
    }

    if (isActiveSequence(3) && !mergedBuffs.__spectroMS3) {
        mergedBuffs.energyRegen += 20;
        mergedBuffs.__spectroMS3 = true;
    }

    if (name.includes('resonating lamella')) {
        skillMeta.multiplier = 0.2;
        skillMeta.visible = isActiveSequence(4);
    }

    if (isActiveSequence(5) && !mergedBuffs.__spectroMS4) {
        mergedBuffs.skillType.resonanceLiberation.dmgBonus += 40;
        mergedBuffs.__spectroMS4 = true;
    }

    mergedBuffs.attribute.spectro.resShred +=
        (isToggleActive(6) && isActiveSequence(6) ? 10 : 0);

    return {mergedBuffs, combatState, skillMeta};
}

export const spectroMMultipliers = {
    resonanceLiberation: [
        {
            name: "Resonating Lamella: Healing",
            scaling: { atk: 1 },
            healing: true
        }
    ]
};

export function spectroMBuffsLogic({
                                     mergedBuffs, characterState
                                 }) {
    const state = characterState?.activeStates ?? {};

    mergedBuffs.attribute.spectro.resShred +=
        (state.wanderlust ? 10 : 0);

    return { mergedBuffs };
}
