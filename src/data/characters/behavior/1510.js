export function applyLuukLogic({
                                      mergedBuffs,
                                      combatState,
                                      enemyProfile,
                                      skillMeta,
                                      characterState,
                                      isActiveSequence = () => false,
                                      isToggleActive = () => false,
                                   characterLevel
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
    const toggles = characterState?.toggles ?? {};
    const isToggleActiveLocal = (key) => characterState?.activeStates?.[key] === true;

    if (tab === 'resonanceLiberation'
        || name.includes('definition in absolute zero')
    || name.includes('basic attack') || name.includes('aureole of execution') ||
    name.includes('ichor deposit') || tab === 'forteCircuit') {
        skillMeta.skillType = 'basic';
    }

    if (name.includes('nod to dying moment')) skillMeta.multiplier = 5;

    if (name === 'aureate judge dmg multiplier boost') {
        characterState.activeStates.__aureate = skillMeta.multiplier;
        skillMeta.visible = false;
    }
    const mvBoost = characterState.activeStates.__aureate;
    if (isToggleActive('aureateJudge') && (name.includes('aureole of execution') ||
    name.includes('gavel of earthshaker'))) skillMeta.multiplier *= (1 + mvBoost);

    if (name.includes('ichor blade dmg')) skillMeta.fixedDmg = 10;

    const stacks = characterState?.activeStates?.endnotes ?? 0;
    const endnotes = Math.min(stacks * 25, 75);

    if (tab === 'resonanceLiberation') skillMeta.multiplier *= 1 + (endnotes / 100);

    if (isActiveSequence(1) && name.includes('mid-air attack')) {
        skillMeta.skillDmgBonus = (skillMeta.skillDmgBonus ?? 0) + 150;
    }

    const tuneBreakBoost = mergedBuffs.tuneBreakBoost;
    const per10 = isActiveSequence(2) ? 10 : 5;
    const cap = isActiveSequence(2) ? 60 : 30;

    if (isToggleActiveLocal('inherent2') && characterLevel >= 70) {
        const ampFromBoost = Math.min(Math.floor(tuneBreakBoost / 10) * per10, cap);
        mergedBuffs.atk.percent += 25;
        skillMeta.amplify = (skillMeta.amplify ?? 0) + ampFromBoost;
    }

    const bonus = mergedBuffs.tuneBreakBoost * (enemyProfile?.status?.tuneStrain ?? 0) * 0.12;
    if (isToggleActiveLocal('silentDebate')) mergedBuffs.special += bonus;

    if (isActiveSequence(2) && name.includes('definition in absolute zero')) {
        skillMeta.multiplier *= 1.6;
    }

    if (isActiveSequence(3) && isToggleActive('aureateJudge') && (name.includes('aureole of execution') || name.includes('gavel of earthshaker'))) {
        skillMeta.multiplier *= 1.65;
    }

    if (isActiveSequence(4) && isToggleActive(4)) mergedBuffs.dmgBonus += 20;

    if (isActiveSequence(5)) {
        if (tab === 'introSkill' || tab === 'outroSkill') {
            skillMeta.skillDmgBonus = (skillMeta.skillDmgBonus ?? 0) + 80;
        }
        if (name.includes('golden reflux')) {
            skillMeta.multiplier *= 1.5;
        }
    }

    if (isActiveSequence(6) && isToggleActive(6)) {
        if ((tab === 'resonanceLiberation' || name.includes('definition in absolute zero')))
            skillMeta.skillDmgBonus = (skillMeta.skillDmgBonus ?? 0) + 40 * stacks;
        if ((name.includes('aureole of execution') || name.includes('gavel of earthshaker')))
            skillMeta.skillDmgBonus = (skillMeta.skillDmgBonus ?? 0) + 30;
    }

    return {mergedBuffs, combatState, skillMeta};
}

export const luukMultipliers = {
    outroSkill: [ { name: "Nod to Dying Moment DMG" } ],
    forteCircuit: [ { name: "Ichor Blade DMG" } ],
};


export function luukBuffsLogic({
                                      mergedBuffs, characterState
                                  }) {
    const state = characterState?.activeStates ?? {};

    if (state.teamTuneBreakBuff)
        mergedBuffs.dmgBonus += 20;

    return { mergedBuffs };
}
