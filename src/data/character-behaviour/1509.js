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

    if (name.includes('stay tuned') && tab === 'forteCircuit') {
        skillMeta.skillType = 'tuneRupture';
        skillMeta.element = '';
    };

    if (isToggleActiveLocal('prismaticOverblast') && !mergedBuffs.__prismaticOverblast) {
        mergedBuffs.attribute.all.dmgBonus += 25;
        mergedBuffs.__prismaticOverblast = true;
    }
    if (isToggleActiveLocal('inherent2') && !mergedBuffs.__lynaeIn2) {
        mergedBuffs.attribute.spectro.dmgBonus += 10;
        mergedBuffs.__lynaeIn2 = true;
    }

    if (isActiveSequence(1) && name.includes('polychrome leap')) skillMeta.multiplier *= 3;

    if (isActiveSequence(2) && name.includes('spectral analysis')) skillMeta.multiplier *= 1.7;

    if (isActiveSequence(4) && !mergedBuffs.__lynaeS4) {
        mergedBuffs.atk.percent += 20;
        mergedBuffs.__lynaeS4 = true;
    }

    if (isActiveSequence(5) && name.includes('prismatic overblast')) skillMeta.multiplier *= 1.9;

    const colorOfSoul = characterState?.toggles?.['6_value'] ?? 0;
    if (isActiveSequence(6) &&
        name.includes('kaleidoscopic parade - graffiti blast'))
        skillMeta.multiplier *= 1 + 2.5 * colorOfSoul;

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

    return { mergedBuffs };
}