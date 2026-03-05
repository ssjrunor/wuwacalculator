export function applySigrikaLogic({
                                       mergedBuffs,
                                       combatState,
                                       skillMeta,
                                       characterState,
                                       isActiveSequence = () => false,
                                       isToggleActive = () => false,
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
    const state = characterState?.activeStates ?? {};
    const isToggleActiveLocal = (key) => characterState?.activeStates?.[key] === true;

    if (tab === 'normalAttack') skillMeta.skillType = 'basic';
    if (tab === 'resonanceSkill') skillMeta.skillType = 'skill';
    if (tab === 'resonanceLiberation') skillMeta.skillType = 'ultimate';
    if (name.toUpperCase().includes('BIG BOOMY BOOM!') ||
        name.includes('soliskin to the aid') || name.includes('basic attack stage 5') ||
        tab === 'forteCircuit' || tab === 'resonanceLiberation')
        skillMeta.skillType = 'echoSkill';

    const stacks = characterState?.activeStates?.innateGift ?? 0;
    const innateGift = Math.min(stacks * 30, 60);
    const innateGiftS3 = Math.min(stacks * 5, 50);

    if (tab === 'forteCircuit')
        skillMeta.amplify += innateGift;


    const soliskinVitality2 = state.soliskinVitality2 ?? 0;
    if (name.includes('runic outburst') ||
        name.includes('runic chain whip') ||
        name.includes('runic soliskin')) {
        if (isToggleActiveLocal('soliskinVitality'))
            skillMeta.multiplier *= 1.25;
        else
            skillMeta.amplify = (skillMeta.amplify ?? 0) +
            Math.min(Math.floor((soliskinVitality2 * 15) / 15) * 15, 30);
    }

    const inherent2Stacks = Math.min(Number(state.sigrikaInherent2 ?? 0), 6);
    mergedBuffs.attribute.aero.dmgBonus += inherent2Stacks * 6;
    mergedBuffs.skillType.echoSkill.dmgBonus += inherent2Stacks * 6;

    const erBonus = mergedBuffs.energyRegen > 25 ?
        Math.min((mergedBuffs.energyRegen - 25) * 1.5, 37.5) :
        mergedBuffs.energyRegen > 50 ?
        Math.min((mergedBuffs.energyRegen - 50) * 0.5, 17.5) : 0;
    mergedBuffs.skillType.echoSkill.dmgBonus += erBonus;

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

    const stacks = state.trueNamesAligned ?? 0;
    const trueNamesAligned = Math.min(stacks * 6, 36);

    mergedBuffs.skillType.echoSkill.dmgBonus += trueNamesAligned;
    mergedBuffs.attribute.aero.dmgBonus += trueNamesAligned;

    if (state.iLoseIGain) mergedBuffs.atk.percent += 20;

    return { mergedBuffs };
}