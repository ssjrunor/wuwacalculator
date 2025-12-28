export function applyLynaeLogic({
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
    const isToggleActiveLocal = (key) => characterState?.activeStates?.[key] === true;

    if (tab === 'normalAttack' ||
        name.includes('to a vivid tomorrow') ||
        tab === 'forteCircuit') skillMeta.skillType = 'basic';

    if (name.includes('tune rupture response') && tab === 'forteCircuit') {
        skillMeta.skillType = 'tuneRupture';
        skillMeta.element = '';
        skillMeta.visible = false;
    }

    const stacks = characterState?.activeStates?.lynaeTuneBreakBoost ?? 0;
    const bonus = Math.min(stacks * 0.12, 0.12 * 50) * combatState?.tuneStrain;
    if (!mergedBuffs.__lynaTuneStrain) {
        mergedBuffs.attribute.all.dmgBonus += bonus;
        mergedBuffs.__lynaTuneStrain = true;
    }


    if (isToggleActiveLocal('prismaticOverblast') && !mergedBuffs.__prismaticOverblast) {
        mergedBuffs.attribute.all.dmgBonus += 25;
        mergedBuffs.__prismaticOverblast = true;
    }
    if (isToggleActiveLocal('inherent2') && !mergedBuffs.__lynaeIn2) {
        mergedBuffs.attribute.spectro.dmgBonus += 10;
        mergedBuffs.__lynaeIn2 = true;
    }

    if (isActiveSequence(1) && name.includes('polychrome leap')) skillMeta.multiplier *= 2.2;

    if (isActiveSequence(2) && !mergedBuffs.__lynaeS2) {
        mergedBuffs.attribute.all.amplify += 25;
        mergedBuffs.__lynaeS2 = true;
    }

    const premixedHue = characterState?.toggles?.premixedHue ?? 0;
    if (isActiveSequence(3) && name.includes('additive color ') && premixedHue > 0)
        skillMeta.skillDmgBonus = (skillMeta.skillDmgBonus ?? 0) + (55 * premixedHue);

    if (isActiveSequence(4) && !mergedBuffs.__lynaeS4) {
        mergedBuffs.atk.percent += 20;
        mergedBuffs.__lynaeS4 = true;
    }

    if (isActiveSequence(5) && name.includes('prismatic overblast')) skillMeta.multiplier *= 1.7;

    const colorOfSoul = characterState?.toggles?.['6_value'] ?? 0;
    if (isActiveSequence(6)) {
        if (name.includes('polychrome leap') || name.includes('visual impact'))
            skillMeta.skillDmgBonus = (skillMeta.skillDmgBonus ?? 0) + (30 * colorOfSoul);
    }

    if (name.includes('let\'s hit the road')) {
        skillMeta.multiplier = 1;
    }

    return {mergedBuffs, combatState, skillMeta};
}

export const lynaeMultipliers = { outroSkill: [ { name: "Let's Hit the Road DMG" } ] };

export function lynaeBuffsLogic({
                                       mergedBuffs, characterState
                                   }) {
    const state = characterState?.activeStates ?? {};

    if (state.hitTheRoad) {
        mergedBuffs.attribute.all.amplify += 15;
        mergedBuffs.skillType.resonanceLiberation.amplify += 25;
    }

    if (state.prismaticOverblast) mergedBuffs.attribute.all.dmgBonus += 25;

    if (state.vanishingPoint) mergedBuffs.attribute.all.amplify += 25;

    return { mergedBuffs };
}