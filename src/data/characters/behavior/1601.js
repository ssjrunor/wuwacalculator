export function applyTaoqiLogic({
                               mergedBuffs,
                               combatState,
                               skillMeta,
                               characterState,
                               isActiveSequence = () => false,
                               isToggleActive = () => false,
                           }) {
    skillMeta = {
        name: skillMeta?.name ?? '',
        skillType: skillMeta?.skillType ?? 'basic',
        multiplier: skillMeta?.multiplier ?? 1,
        amplify: skillMeta?.amplify ?? 0,
        ...skillMeta
    };

    const isToggleActiveLocal = (key) => characterState?.activeStates?.[key] === true;
    const name = skillMeta.name?.toLowerCase() ?? '';
    const tab = skillMeta.tab ?? '';

    if (!(tab === 'normalAttack' || tab === 'introSkill')) {
        skillMeta.scaling = { atk: 0, hp: 0, def: 1, energyRegen: 0 };
    }

    if (name.includes('strategic parry damage')) {
        skillMeta.scaling = { atk: 0, hp: 0, def: 1, energyRegen: 0 };
    }

    if (tab === 'forteCircuit') {
        skillMeta.skillType = 'basic';
    }

    if (name.includes('shield')) {
        skillMeta.tags = ['shielding'];
    }

    if (name.includes('hp recovery')) {
        skillMeta.tags = ['healing'];
    }

    if (name.includes('reduction')) {
        skillMeta.visible = false;
    }

    if (isToggleActiveLocal('inherent1') && !mergedBuffs.__taoqiInherent1) {
        mergedBuffs.def.percent += 15;
        mergedBuffs.__taoqiInherent1 = true;
    }

    if (isActiveSequence(1) && tab === 'forteCircuit' && name.includes('shield')) {
        skillMeta.skillShieldBonus = (skillMeta.skillShieldBonus ?? 0) + 40;
    }

    if (isActiveSequence(2) && tab === 'resonanceLiberation') {
        skillMeta.critDmgBonus = (skillMeta.critDmgBonus ?? 0) + 20;
        skillMeta.critRateBonus = (skillMeta.critRateBonus ?? 0) + 20;
    }

    if (name.includes('heavylifting')) {
        skillMeta.multiplier = 0.25;
        skillMeta.visible = isActiveSequence(4);
    }

    if (isActiveSequence(4) && isToggleActive(4) && !mergedBuffs.__taoqiS4) {
        mergedBuffs.def.percent += 50;
        mergedBuffs.__taoqiS4 = true;
    }

    if (tab === 'forteCircuit' && isActiveSequence(5)) {
        skillMeta.skillDmgBonus = (skillMeta.skillDmgBonus ?? 0) + 50;
    }

    if (isActiveSequence(6) && isToggleActive(6) && (skillMeta.skillType === 'basic' || skillMeta.skillType === 'heavy')) {
        skillMeta.skillDmgBonus = (skillMeta.skillDmgBonus ?? 0) + 40;
    }

    return {mergedBuffs, combatState, skillMeta};
}

export const taoqiMultipliers = {
    normalAttack: [
        {
            name: "Heavylifting Duty: Strategic Parry Healing",
            scaling: { hp: 1 },
            healing: true
        }
    ]
};

export function taoqiBuffsLogic({
                                   mergedBuffs, characterState
                               }) {
    const state = characterState?.activeStates ?? {};

    if (state.steadfast) {
        mergedBuffs.def.percent += 15;
    }

    if (state.ironWill) {
        mergedBuffs.skillType.resonanceSkill.amplify += 38;
    }

    return { mergedBuffs };
}