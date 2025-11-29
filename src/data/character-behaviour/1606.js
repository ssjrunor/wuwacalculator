export function applyRocciaLogic({
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

    let atkFlat = 0;

    if (mergedBuffs.critRate + 5 > 50) {
        atkFlat = (mergedBuffs.critRate + 5 - 50) * 10;

        if (atkFlat > 200) {
            atkFlat = 200;
        }
    }

    if (characterState?.activeStates?.commedia && !mergedBuffs.__rocciaCommeddia) {
        mergedBuffs.atkFlat = (mergedBuffs.atkFlat ?? 0) + atkFlat;
        mergedBuffs.__rocciaCommeddia = true;
    }

    if (tab === 'forteCircuit' || tab === 'resonanceLiberation') {
        skillMeta.skillType = 'heavy';
    }

    if (isToggleActiveLocal('inherent1') && !mergedBuffs.__rocciaInherent1) {
        mergedBuffs.atkPercent = (mergedBuffs.atkPercent ?? 0) + 20;
        mergedBuffs.__rocciaInherent1 = true;
    }

    const seq2Value = characterState?.toggles?.['2_value'] ?? 0;
    const luceanite = Math.min(seq2Value * 10, 30);
    if (!mergedBuffs.__luceaniteApplied && isActiveSequence(2)) {
        mergedBuffs.havoc = (mergedBuffs.havoc ?? 0) + luceanite + (seq2Value >= 3 ? 10 : 0);
        mergedBuffs.__luceaniteApplied = true;
    }

    if (isActiveSequence(3) && !mergedBuffs.__rocciaS3 && isToggleActive(3)) {
        mergedBuffs.critRate = (mergedBuffs.critRate ?? 0) + 10;
        mergedBuffs.critDmg = (mergedBuffs.critDmg ?? 0) + 30;
        mergedBuffs.__rocciaS3 = true;
    }

    if (isActiveSequence(4) && tab === 'forteCircuit' && isToggleActive(4)) {
        skillMeta.multiplier *= 1.6;
    }

    if (isActiveSequence(5)) {
        if (tab === 'resonanceLiberation') {
            skillMeta.multiplier *= 1.2;
        }
        if (name.includes('heavy attack')) {
            skillMeta.multiplier *= 1.8;
        }
    }

    if (isToggleActive(6) && isActiveSequence(6)) {
        if (tab === 'forteCircuit') {
            skillMeta.skillDefIgnore = (skillMeta.skillDefIgnore ?? 0) + 60;
        }
    }

    if (name.includes('reality recreation')) {
        skillMeta.visible = isActiveSequence(6);
    }

    return {mergedBuffs, combatState, skillMeta};
}

export const rocciaMultipliers = {
    forteCircuit: [
        {
            name: "Reality Recreation DMG",
            scaling: { atk: 1 },
            Param: [
                [
                    "180.00%",
                    "194.76%",
                    "209.52%",
                    "230.19%",
                    "244.95%",
                    "261.92%",
                    "285.54%",
                    "309.15%",
                    "332.77%",
                    "357.86%",
                    "387.38%",
                    "416.90%",
                    "446.42%",
                    "475.94%",
                    "505.46%",
                    "534.98%",
                    "564.50%",
                    "594.02%",
                    "623.54%",
                    "653.06%"
                ]
            ]
        }
    ]
};

export function rocciaBuffsLogic({
                                     mergedBuffs, characterState
                                 }) {
    const state = characterState?.activeStates ?? {};
    let atkFlat = 0;

    let stacks = Math.min(state.luceanite * 10, 30);

    if (state.luceanite >= 3) {
        stacks += 10;
    }

    if (state.commediaCr > 50) {
        atkFlat = (state.commediaCr - 50) * 10;

        if (atkFlat > 200) {
            atkFlat = 200;
        }
    }

    if (state.applause) {
        mergedBuffs.damageTypeAmplify.basic = (mergedBuffs.damageTypeAmplify.basic ?? 0) + 25;
        mergedBuffs.elementDmgAmplify.havoc = (mergedBuffs.elementDmgAmplify.havoc ?? 0) + 20;
    }

    if (state.commedia) {
        mergedBuffs.atkFlat = (mergedBuffs.atkFlat ?? 0) + atkFlat;
    }

    if (state.luceanite) {
        mergedBuffs.havoc = (mergedBuffs.havoc ?? 0) + stacks;
    }

    return { mergedBuffs };
}