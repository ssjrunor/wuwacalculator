export function applyHavocWLogic({
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

    const isToggleActiveLocal = (key) => characterState?.activeStates?.[key] === true;
    const name = skillMeta.name?.toLowerCase();
    const tab = skillMeta.tab ?? '';

    if (tab === 'forteCircuit') {
        skillMeta.skillType = 'basic';
    }

    if (name.includes('heavy') || name.includes('Devastation') || name.includes('thwackblade')) {
        skillMeta.skillType = 'heavy';
    }

    if (name.includes('lifetaker')) {
        skillMeta.skillType = 'skill';
    }

    if (tab === 'outroSkill') {
        skillMeta.multiplier = 143.3/100;
    }

    if (isToggleActiveLocal('inherent1') && !mergedBuffs.__havocWInherent1) {
        mergedBuffs.havoc = (mergedBuffs.havoc ?? 0) + 20;
        mergedBuffs.__havocWInherent1 = true;
    }

    if (isActiveSequence(1) && !mergedBuffs.__havocWS1) {
        mergedBuffs.resonanceSkill = (mergedBuffs.resonanceSkill ?? 0) + 30;
        mergedBuffs.__havocWS1 = true;
    }

    skillMeta.skillResIgnore = (skillMeta.skillResIgnore ?? 0) +
        (isActiveSequence(4) && skillMeta.element === 'havoc' && isToggleActive(4) ? 10 : 0);

    if (isActiveSequence(5) && tab === 'forteCircuit' && name.includes('5')) {
        skillMeta.multiplier *= 1.5;
    }

    if (isToggleActive(6) && isActiveSequence(6) && !mergedBuffs.__havocWS6) {
        mergedBuffs.critRate = (mergedBuffs.critRate ?? 0) + 25;
        mergedBuffs.__havocWS6 = true;
    }

    return {mergedBuffs, combatState, skillMeta};
}

export const havocWMultipliers = {
    outroSkill: [
        {
            name: "Soundweaver",
            scaling: { atk: 1 },
        }
    ]
};

export function havocWSkillMetaBuffsLogic({
                                              mergedBuffs,
                                              characterState,
                                              activeCharacter,
                                              combatState,
                                              skillMeta
                                          }) {

    const state = characterState?.activeStates ?? {};
    const element = skillMeta?.element ?? null;

    skillMeta.skillResIgnore = (skillMeta.skillResIgnore ?? 0) +
        (state.annihilated && element === 'havoc' ? 10 : 0);


    return { skillMeta };
}