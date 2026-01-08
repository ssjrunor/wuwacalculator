export function applyLogic({
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
    if (tab === 'forteCircuit') skillMeta.skillType = 'ultimate';

    if (isToggleActiveLocal('inherent1')) {
    }
    if (isToggleActiveLocal('inherent1')) {
    }

    if (isActiveSequence(1) && isToggleActive(1)) {
    }
    if (isActiveSequence(2) && isToggleActive(2)) {
    }
    if (isActiveSequence(3) && isToggleActive(3)) {
    }
    if (isActiveSequence(4) && isToggleActive(4)) {
    }
    if (isActiveSequence(5) && isToggleActive(5)) {
    }
    if (isActiveSequence(6) && isToggleActive(6)) {
    }

    return {mergedBuffs, combatState, skillMeta};
}

export const multipliers = {
};


export function buffsLogic({
                                       mergedBuffs, characterState
                                   }) {
    const state = characterState?.activeStates ?? {};

    return { mergedBuffs };
}