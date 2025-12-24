export function applyDanjinLogic({
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

    if (characterState?.activeStates?.incinerating) {
        skillMeta.skillDmgBonus = (skillMeta.skillDmgBonus ?? 0) + 20;
    }

    if (name.includes('chaoscleave healing')) {
        skillMeta.multiplier = 0.36;
    }

    if (tab === 'forteCircuit') {
        skillMeta.skillType = 'heavy';
    }

    if (isToggleActiveLocal('inherent1') && name.includes('crimson erosion')) {
        skillMeta.skillDmgBonus = (skillMeta.skillDmgBonus ?? 0) + 20;
    }

    if (isToggleActiveLocal('inherent2') && skillMeta.skillType === 'heavy') {
        skillMeta.skillDmgBonus = (skillMeta.skillDmgBonus ?? 0) + 30;
    }

    const seq1Value = characterState?.toggles?.['1_value'] ?? 0;
    if (isActiveSequence(1) && seq1Value > 0) {
        if (!mergedBuffs.__danjinS1) {
            mergedBuffs.atk.percent += (seq1Value * 5);
            mergedBuffs.__danjinS1 = true;
        }
    } else {
        mergedBuffs.__danjinS1 = false;
    }

    if (isActiveSequence(2) && isToggleActive(2)) {
        skillMeta.skillDmgBonus = (skillMeta.skillDmgBonus ?? 0) + 20;
    }

    if (isActiveSequence(3) && !mergedBuffs.__danjinS3) {
        mergedBuffs.skillType.resonanceLiberation.dmgBonus += 30;
        mergedBuffs.__danjinS3 = true;
    }

    if (isActiveSequence(4) && isToggleActive(4) && !mergedBuffs.__danjinS4) {
        mergedBuffs.critRate += 15;
        mergedBuffs.__danjinS4 = true;
    }

    if (isActiveSequence(5)) {
        if (!mergedBuffs.__danjinS51) {
            mergedBuffs.attribute.havoc.dmgBonus += 15;
            mergedBuffs.__danjinS51 = true;
        }
        if (isToggleActive(5) && !mergedBuffs.__danjinS52) {
            mergedBuffs.attribute.havoc.dmgBonus += 15;
            mergedBuffs.__danjinS52 = true;
        }
    }

    if (isActiveSequence(6) && isToggleActive(6) && !mergedBuffs.__danjinS6) {
        mergedBuffs.atk.percent += 20;
        mergedBuffs.__danjinS6 = true;
    }

    return {mergedBuffs, combatState, skillMeta};
}

export const danjinMultipliers = {
    forteCircuit: [
        {
            name: "Chaoscleave Healing",
            scaling: { hp: 1 },
            healing: true,
        }
    ]
};

export function danjinBuffsLogic({
                                    mergedBuffs, characterState
                                }) {
    const state = characterState?.activeStates ?? {};

    if (state.dDuality) {
        mergedBuffs.attribute.havoc.amplify += 23;
    }

    if (state.bloodied) {
        mergedBuffs.atk.percent += 20;
    }

    return { mergedBuffs };
}