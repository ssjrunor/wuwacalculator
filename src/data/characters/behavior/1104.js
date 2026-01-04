export function applyLingyangLogic({
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

    if (name.includes('glorious plunge damage')) {
        skillMeta.skillType = 'heavy';
    } else if (
        ['feral gyrate stage 1 dmg', 'feral gyrate stage 2 dmg', 'stormy kicks damage', 'tail strike damage']
            .some(n => name.includes(n))
    ) {
        skillMeta.skillType = 'basic';
    } else if (name.includes('mountain roamer damage')) {
        skillMeta.skillType = 'skill';
    } else if (skillMeta.tab === 'outroSkill' && name.includes("frosty marks")) {
        skillMeta.multiplier = 587.94/100;
    }

    if (characterState?.activeStates?.lionsVigor && !mergedBuffs.__lingyangVigorApplied) {
        mergedBuffs.attribute.glacio.dmgBonus += 50;
        mergedBuffs.__lingyangVigorApplied = true;
    }

    if (isToggleActive('inherent1')) {
        mergedBuffs.skillType.introSkill.dmgBonus += 50;
    }

    if (name === 'mountain roamer damage' && !skillMeta.__inherent2Applied && isToggleActive('inherent2')) {
        skillMeta.multiplier = (skillMeta.multiplier ?? 0) * 2.5;
        skillMeta.__inherent2Applied = true;
    }

    if (isToggleActive(3) && isActiveSequence(3)) {
        if (!mergedBuffs.__lingyangs3) {
            mergedBuffs.skillType.basicAtk.dmgBonus += 20;
            mergedBuffs.skillType.resonanceSkill.dmgBonus += 10;
            mergedBuffs.__lingyangs3 = true;
        }
    } else {
        mergedBuffs.__lingyangs3 = false;
    }

    if (name === 'skill dmg' && !skillMeta.__lingyangs5 && isToggleActive(5) && isActiveSequence(5) && skillMeta.tab === 'resonanceLiberation') {
        skillMeta.multiplier = (skillMeta.multiplier ?? 0) + 2;
        skillMeta.__lingyangs5 = true;
    }

    if (
        skillMeta.tab === 'forteCircuit' &&
        isToggleActive(6) &&
        isActiveSequence(6) &&
        skillMeta.skillType === 'basic'
    ) {
        skillMeta.skillDmgBonus = (skillMeta.skillDmgBonus ?? 0) + 100;
    }

    return { mergedBuffs, combatState, skillMeta };
}

export const lingYangMultipliers = {
     outroSkill: [
        {
            name: "Frosty Marks",
            scaling: { atk: 1 }

        }
    ]
};

export function lingBuffsLogic({
                                       mergedBuffs, characterState, activeCharacter
                                   }) {
    const state = characterState?.activeStates ?? {};

    if (state.immortals) {
        mergedBuffs.attribute.glacio.dmgBonus += 20;
    }

    return { mergedBuffs };
}