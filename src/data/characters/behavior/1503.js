export function applyVerinaLogic({
                               mergedBuffs,
                               combatState,
                               skillMeta,
                               characterState,
                               isActiveSequence = () => false,
                               isToggleActive = () => false,
    characterLevel = 1
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
        amplify: skillMeta?.amplify ?? 0
    };

    const isToggleActiveLocal = (key) => characterState?.activeStates?.[key] === true;
    const name = skillMeta.name?.toLowerCase() ?? '';
    const tab = skillMeta.tab ?? '';

    if (tab === 'forteCircuit') {
        if (name.includes('heavy')) {
            skillMeta.skillType = 'heavy';
        } else {
            skillMeta.skillType = 'basic';
        }
    }
    if (name.includes('coordinated attack dmg')) {
        skillMeta.skillType = ['ultimate', 'coord'];
    }

    if (isToggleActiveLocal('inherent1') && !mergedBuffs.__verinaInherent1) {
        mergedBuffs.atk.percent += 20;
        mergedBuffs.__verinaInherent1 = true;
    }

    if (name.includes('grace of life')) {
        skillMeta.multiplier = 120/100;
        skillMeta.visible = characterLevel >= 70;
    }

    if (characterState?.activeStates?.blossom && !mergedBuffs.__blossom) {
        mergedBuffs.attribute.all.amplify += 15;
        mergedBuffs.__blossom = true;
    }

    if (tab === 'outroSkill') {
        skillMeta.multiplier = 0.2;
        skillMeta.visible = isActiveSequence(1);
    }

    if (isActiveSequence(3) && name === 'coordinated attack healing') {
        skillMeta.skillHealingBonus = (skillMeta.skillHealingBonus ?? 0) + 12;
    }

    if (isToggleActive(4) && !mergedBuffs.__verinaS4 && isActiveSequence(4)) {
        mergedBuffs.attribute.spectro.dmgBonus += 15;
        mergedBuffs.__verinaS4 = true;
    }

    if (isToggleActive(5) && isActiveSequence(5)) {
        skillMeta.skillHealingBonus = (skillMeta.skillHealingBonus ?? 0) + 20;
    }

    if (isToggleActive(6) && isActiveSequence(6) && tab === 'forteCircuit') {
        skillMeta.skillDmgBonus = (skillMeta.skillDmgBonus ?? 0) + 20;
    }

    return {mergedBuffs, combatState, skillMeta};
}

export const verinaMultipliers = {
    forteCircuit: [
        {
            name: "Starflower Blooms Healing",
            scaling: { atk: 1 },
            healing: true
        }
    ],
    resonanceLiberation: [
        {
            name: "Arboreal Flourish Healing",
            scaling: { atk: 1 },
            healing: true
        },
        {
            name: "Coordinated Attack Healing",
            scaling: { atk: 1 },
            healing: true
        }
    ],
    resonanceSkill: [
        {
            name: "Grace of Life: Shield",
            scaling: { atk: 1 },
            shielding: true
        }
    ],
    outroSkill: [
        {
            name: "Moment of Emergence: Outro Skill Blossom Healing",
            scaling: { atk: 1 },
            healing: true
        }
    ]
};


export function verinauffsLogic({
                                     mergedBuffs, characterState, activeCharacter
                                 }) {
    const state = characterState?.activeStates ?? {};

    if (state.graceOfLife) {
        mergedBuffs.atk.percent += 20;
    }

    if (state.blossom) {
        mergedBuffs.attribute.all.amplify += 15;
    }

    if (state.blossoming) {
        mergedBuffs.attribute.spectro.dmgBonus += 15;
    }

    return { mergedBuffs };
}