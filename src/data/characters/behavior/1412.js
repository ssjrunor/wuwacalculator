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
        name.includes('soliskin to the aid') || name.includes('basic attack - elucidated') ||
        tab === 'forteCircuit' || tab === 'resonanceLiberation')
        skillMeta.skillType = 'echoSkill';

    const stacks = characterState?.activeStates?.innateGift ?? 0;
    const inateMax = isActiveSequence(3) ? 4 : 2;
    const innateGift = Math.min(stacks * 30, inateMax * 30);
    const innateGiftAmp = Math.min(stacks * 15, inateMax * 15);
    const innateGiftDef = Math.min(stacks * 5, inateMax * 5);

    if (tab === 'forteCircuit')
        skillMeta.amplify = (skillMeta.amplify ?? 0) + innateGift;


    const soliskinVitality2 = state.soliskinVitality2 ?? 0;
    if (name.includes('runic outburst') ||
        name.includes('runic chain whip') ||
        name.includes('runic soliskin')) {
        if (isToggleActiveLocal('soliskinVitality'))
            skillMeta.multiplier *= 1.5;
        else
            skillMeta.amplify = (skillMeta.amplify ?? 0) +
            Math.min(Math.floor((soliskinVitality2 * 15) / 15) * 15, 30);
    }

    const inherent2Stacks = Math.min(Number(state.sigrikaInherent2 ?? 0), 6);
    mergedBuffs.attribute.aero.dmgBonus += inherent2Stacks * 3 + (inherent2Stacks >= 6 ? 30 : 0);
    mergedBuffs.skillType.echoSkill.dmgBonus += inherent2Stacks * 3 + (inherent2Stacks >= 6 ? 30 : 0);

    const erBonus = mergedBuffs.energyRegen > 25 ?
        Math.min((mergedBuffs.energyRegen - 25) * 1.5, 37.5) :
        mergedBuffs.energyRegen > 50 ?
        Math.min((mergedBuffs.energyRegen - 50) * 0.5, 17.5) : 0;
    mergedBuffs.skillType.echoSkill.dmgBonus += erBonus;

    if (name.includes('in this very moment')) skillMeta.multiplier = 7.95;

    const s1Skills = [
        'basic attack - elucidated',
        'resonance skill - big boomy boom!',
        'resonance skill - soliskin to the aid'
    ].some(n => name.includes(n));
    if (isActiveSequence(1) && s1Skills) skillMeta.multiplier *= 1.7;

    if (isActiveSequence(2)) {
        mergedBuffs.energyRegen += 25;
        if (name.includes('forte circuit - learn my true name')) skillMeta.multiplier *= 2.15;
    }

    if (isActiveSequence(4) && isToggleActive(4)) mergedBuffs.atk.percent += 20;

    if (isActiveSequence(5) && tab === 'resonanceLiberation') skillMeta.multiplier *= 1.30;

    if (isActiveSequence(6)) {
        if (tab === 'forteCircuit' && !name.includes('heavy')) {
            skillMeta.skillDefIgnore = (skillMeta.skillDefIgnore ?? 0) + innateGiftDef;
            skillMeta.amplify = (skillMeta.amplify ?? 0) + innateGiftAmp;
        }
        mergedBuffs.attribute.all.dmgVuln += 30;
    }

    return {mergedBuffs, combatState, skillMeta};
}

export const sigrikaMultipliers = {
    outroSkill: [
        {
            name: "In This Very Moment DMG",
            scaling: { atk: 1}
        }
    ]
};


export function sigrikaBuffsLogic({
                                       mergedBuffs, characterState
                                   }) {
    const state = characterState?.activeStates ?? {};

    const stacks = state.trueNamesAligned ?? 0;
    const trueNamesAligned = Math.min(stacks * 3, 18);

    mergedBuffs.skillType.echoSkill.dmgBonus += trueNamesAligned;
    mergedBuffs.attribute.aero.dmgBonus += trueNamesAligned;

    if (state.iLoseIGain) mergedBuffs.atk.percent += 20;

    return { mergedBuffs };
}