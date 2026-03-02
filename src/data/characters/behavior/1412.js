export function applySigrikaLogic({
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

    const name = skillMeta.name?.toLowerCase() ?? '';
    const tab = skillMeta.tab ?? '';
    const isToggleActiveLocal = (key) => characterState?.activeStates?.[key] === true;

    if (tab === 'normalAttack') skillMeta.skillType = 'basic';
    if (tab === 'resonanceSkill') skillMeta.skillType = 'skill';
    if (tab === 'resonanceLiberation') skillMeta.skillType = 'ultimate';
    if (name.toUpperCase().includes('BIG BOOMY BOOM!') ||
        name.includes('soliskin to the aid') || name.includes('basic attack stage 5') ||
        tab === 'forteCircuit' || tab === 'resonanceLiberation')
        skillMeta.skillType = 'echoSkill';

    const stacks = characterState?.activeStates?.innateGift ?? 0;
    const innateGift = Math.min(stacks * 15, 150);
    const innateGiftS3 = Math.min(stacks * 5, 50);

    if (tab === 'forteCircuit')
        skillMeta.amplify += innateGift;


    if (isToggleActiveLocal('soliskinVitality')
    && (name.includes('runic outburst') ||
        name.includes('runic chain whip') ||
        name.includes('runic soliskin')))
        skillMeta.multiplier *= 1.25;


    if (isToggleActiveLocal('inherent1')) {
    }

    const s1Skills = [
        'basic attack stage 5',
        'resonance skill - big boomy boom!',
        'resonance skill - soliskin to the aid'
    ].some(n => name.includes(n));
    if (isActiveSequence(1) && s1Skills) skillMeta.multiplier *= 1.7;

    if (isActiveSequence(2) && name.includes('resonance skill - learn my true name')) skillMeta.multiplier *= 1.25;

    if (isActiveSequence(3) && tab === 'forteCircuit') skillMeta.skillDefIgnore = (skillMeta.skillDefIgnore ?? 0) + innateGiftS3;

    if (isActiveSequence(4) && isToggleActive(4)) mergedBuffs.atk.percent += 20;

    if (isActiveSequence(5) && tab === 'resonanceLiberation') skillMeta.multiplier *= 1.30;

    if (isActiveSequence(6)) mergedBuffs.special += 30;

    return {mergedBuffs, combatState, skillMeta};
}

export const sigrikaMultipliers = {
};


export function sigrikaBuffsLogic({
                                       mergedBuffs, characterState
                                   }) {
    const state = characterState?.activeStates ?? {};

    if (state.iLoseIGain) mergedBuffs.atk.percent += 20;

    return { mergedBuffs };
}