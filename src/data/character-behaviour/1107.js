export function applyCarlottaLogic({
                                   mergedBuffs,
                                   combatState,
                                   skillMeta,
                                   characterState,
                                   isActiveSequence = () => false,
                                   isToggleActive = () => false, }) {
    skillMeta = {
        name: skillMeta?.name ?? '',
        skillType: skillMeta?.skillType ?? 'basic',
        multiplier: skillMeta?.multiplier ?? 1,
        amplify: skillMeta?.amplify ?? 0,
        ...skillMeta };
    const name = skillMeta.name?.toLowerCase();
    const tab = skillMeta.tab ?? '';
    if (tab === 'forteCircuit' || tab === 'resonanceLiberation') { skillMeta.skillType = 'skill';
    } else if (skillMeta.tab === 'outroSkill') {
        if (name.includes("closing remark")) { skillMeta.multiplier = 794.2/100;
        } else skillMeta.multiplier = 1032.18/100;
    }
    if (name.includes('kaleidoscope')) skillMeta.visible = isActiveSequence(3);
    if (characterState?.activeStates?.deconstruction && !mergedBuffs.__carlottaDeconstruction) {
        mergedBuffs.enemyDefIgnore = (mergedBuffs.enemyDefIgnore ?? 0) + 18; mergedBuffs.__carlottaDeconstruction = true;
    }
    if (tab === 'resonanceLiberation' && characterState?.activeStates?.finalBlow) skillMeta.multiplier *= 1.8;
    if (isToggleActive(1) && isActiveSequence(1)) {
        if (!mergedBuffs.__seq1) mergedBuffs.critRate = (mergedBuffs.critRate ?? 0) + 12.5; mergedBuffs.__seq1 = true;
    } else mergedBuffs.__seq1 = false;
    if (isActiveSequence(2) && tab === 'resonanceLiberation' && name === 'fatal finale dmg') skillMeta.multiplier *= 2.26;
    if (isActiveSequence(3) && tab === 'resonanceSkill') skillMeta.multiplier *= 1.93;
    if (isToggleActive(4) && isActiveSequence(4)) {
        if (!mergedBuffs.__seq4) {
            mergedBuffs.resonanceSkill = (mergedBuffs.resonanceSkill ?? 0) + 25; mergedBuffs.__seq4 = true; }
    } else mergedBuffs.__seq4 = false;
    if (isActiveSequence(5) && tab === 'forteCircuit' && name === 'imminent oblivion dmg') skillMeta.multiplier *= 1.47;
    if (isActiveSequence(6) && tab === 'resonanceLiberation' && name === 'death knell dmg') skillMeta.multiplier *= 2.866;
    return { mergedBuffs, combatState, skillMeta }; }
export const carlottaMultipliers = {
    outroSkill: [{ name: "Closing Remark DMG", scaling: { atk: 1 } }, { name: "Kaleidoscope Sparks DMG", scaling: { atk: 1 } }] };
export function carlottaBuffsLogic({mergedBuffs, characterState, activeCharacter}) {
    const state = characterState?.activeStates ?? {};
    if (state.raindrops) mergedBuffs.resonanceSkill = (mergedBuffs.resonanceSkill ?? 0) + 25;
    return { mergedBuffs }; }