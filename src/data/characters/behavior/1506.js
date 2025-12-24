export function applyPheobeLogic({
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

    const tab = skillMeta.tab ?? '';

    const state =
        characterState?.activeStates?.absolution
            ? 'Absolution'
            : characterState?.activeStates?.confession
                ? 'Confession'
                : null;

    if (state !== 'Confession') {
        mergedBuffs.__pheobeConfessionResShred = false;
    }

    const basicSkills = [
        "Chamuel's Star: Stage 1 DMG",
        "Chamuel's Star: Stage 2 DMG",
        "Chamuel's Star: Stage 3 DMG",
        "Ring of Mirrors: Refracted Holy Light DMG"
    ];

    const heavySkills = ["Starflash", "Absolution Litany"];
    const skillSkills = ["Utter Confession"];

    if (basicSkills.includes(skillMeta.name)) {
        skillMeta.skillType = 'basic';
    } else if (heavySkills.some(name => skillMeta.name?.includes(name))) {
        skillMeta.skillType = 'heavy';
    } else if (skillSkills.some(name => skillMeta.name?.includes(name))) {
        skillMeta.skillType = 'skill';
    }

    if (skillMeta.tab === 'outroSkill') {
        skillMeta.multiplier = 528.41/100;
    }

    if (state === 'Absolution') {
        if (skillMeta.name.includes('Starflash') && combatState.spectroFrazzle > 0)
            skillMeta.amplify = 256;

        if (skillMeta.skillType === 'ultimate') {
            const scale = isActiveSequence(1) ? 5.80 : 3.55;
            skillMeta.multiplier *= scale;
        }

        if (tab === 'outroSkill' && combatState.spectroFrazzle > 0) {
            if (!mergedBuffs.__pheobeOutroApplied && isActiveSequence(2)) {
                mergedBuffs.skillType.outroSkill.amplify += 120;
                mergedBuffs.__pheobeOutroApplied = true;
            }
            skillMeta.multiplier *= (1 + 2.55);
        }

        if (isActiveSequence(3) && skillMeta.name?.includes('Starflash')) {
            skillMeta.multiplier *= (1 + 0.91);
        }

    } else if (state === 'Confession') {
        if (skillMeta.skillType === 'ultimate') {
            skillMeta.multiplier *= (1 + 0.90);
        }

        if (!mergedBuffs.__attentive && characterState?.activeStates?.attentive) {
            mergedBuffs.skillType.spectroFrazzle.resShred += 10;
            skillMeta.skillResIgnore = (skillMeta.skillResIgnore ?? 0) + (skillMeta.element === 'spectro' ? 10 : 0);
            mergedBuffs.skillType.spectroFrazzle.amplify += 100;
            mergedBuffs.__attentive = true;
        }

        if (isActiveSequence(3) && skillMeta.name?.includes('Starflash')) {
            skillMeta.multiplier *= (1 + 2.49);
        }
    }

    if (characterState?.activeStates?.attentive && !mergedBuffs.__attentive) {
        mergedBuffs.skillType.spectroFrazzle.amplify += 100;
        mergedBuffs.__attentive = true;
    }

    if ((state === 'Absolution' || state === 'Confession') && !mergedBuffs.__pheobeSpectro1 && characterLevel >= 70) {
        mergedBuffs.attribute.spectro.dmgBonus += 12;
        mergedBuffs.__pheobeSpectro1 = true;
    }

    skillMeta.skillResIgnore = (skillMeta.skillResIgnore ?? 0) +
        (isToggleActive(4) && isActiveSequence(4) && skillMeta.element === 'spectro' ? 10 : 0);

    if (isToggleActive(5) && isActiveSequence(5)) {
        if (!mergedBuffs.__pheobeSpectro2) {
            mergedBuffs.attribute.spectro.dmgBonus += 12;
            mergedBuffs.__pheobeSpectro2 = true;
        }
    } else {
        mergedBuffs.__pheobeSpectro2 = false;
    }

    if (isToggleActive(6) && isActiveSequence(6)) {
        if (!mergedBuffs.__pheobeAtkBuff) {
            mergedBuffs.atk.percent += 10;
            mergedBuffs.__pheobeAtkBuff = true;
        }
    } else {
        mergedBuffs.__pheobeAtkBuff = false;
    }

    return { mergedBuffs, combatState, skillMeta };
}

export const pheobeMultipliers = {
    outroSkill: [
        {
            name: "Attentive Heart",
            scaling: { atk: 1 }
        }
    ]
};

export function pheobeBuffsLogic({
                                     mergedBuffs, characterState, activeCharacter
                                 }) {
    const state = characterState?.activeStates ?? {};
    mergedBuffs.skillType.spectroFrazzle.amplify += (state.attentive ? 100 : 0);
    mergedBuffs.skillType.spectroFrazzle.amplify += (state.boatAdrift ? 120 : 0);
    mergedBuffs.attribute.spectro.resShred += (state.attentive ? 10 : 0);
    return { mergedBuffs };
}
