import {pheobeSkillMetaBuffsLogic} from "./1506.js";

export function applySpectroMLogic({
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
        skillMeta.skillType = 'skill';
    }

    if (characterLevel >= 50 && name.includes('resonating echoes')) {
        skillMeta.skillDmgBonus = (skillMeta.skillDmgBonus ?? 0) + 60;
    }

    if (isToggleActiveLocal('inherent2') && !mergedBuffs.__spectroMInherent1) {
        mergedBuffs.atkPercent = (mergedBuffs.atkPercent ?? 0) + 15;
        mergedBuffs.__spectroMInherent1 = true;
    }

    if (isToggleActive(1) && isActiveSequence(1) && !mergedBuffs.__spectroMS1) {
        mergedBuffs.critRate = (mergedBuffs.critRate ?? 0) + 15;
        mergedBuffs.__spectroMS1 = true;
    }

    if (isActiveSequence(2) && !mergedBuffs.__spectroMS2) {
        mergedBuffs.spectro = (mergedBuffs.spectro ?? 0) + 20;
        mergedBuffs.__spectroMS2 = true;
    }

    if (isActiveSequence(3) && !mergedBuffs.__spectroMS3) {
        mergedBuffs.energyRegen = (mergedBuffs.energyRegen ?? 0) + 20;
        mergedBuffs.__spectroMS3 = true;
    }

    if (name.includes('resonating lamella')) {
        skillMeta.multiplier = 0.2;
        skillMeta.visible = isActiveSequence(4);
    }

    if (isActiveSequence(5) && !mergedBuffs.__spectroMS4) {
        mergedBuffs.resonanceLiberation = (mergedBuffs.resonanceLiberation ?? 0) + 40;
        mergedBuffs.__spectroMS4 = true;
    }

    skillMeta.skillResIgnore = (skillMeta.skillResIgnore ?? 0) +
        (isToggleActive(6) && isActiveSequence(6) && skillMeta.element === 'spectro' ? 10 : 0);
    mergedBuffs.spectroFrazzleResShred = (mergedBuffs?.spectroFrazzleResShred ?? 0) +
        (isToggleActive(6) && isActiveSequence(6) ? 10 : 0);

    return {mergedBuffs, combatState, skillMeta};
}

export const spectroMMultipliers = {
    resonanceLiberation: [
        {
            name: "Resonating Lamella: Healing",
            scaling: { atk: 1 },
            healing: true
        }
    ]
};

export function spectroMBuffsLogic({
                                     mergedBuffs, characterState
                                 }) {
    const state = characterState?.activeStates ?? {};

    mergedBuffs.spectroFrazzleResShred = (mergedBuffs?.spectroFrazzleResShred ?? 0) +
        (state.wanderlust ? 10 : 0);

    return { mergedBuffs };
}


export function spectroMSkillMetaBuffsLogic({
                                                characterState, skillMeta
                               }) {
    const state = characterState?.activeStates ?? {};
    const element = skillMeta.element ?? null;
    skillMeta.skillResIgnore = (skillMeta.skillResIgnore ?? 0) +
        (state.wanderlust && element === 'spectro' ? 10 : 0);

    return { skillMeta };
}