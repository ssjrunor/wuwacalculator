export function applyJianxinLogic({
                               mergedBuffs,
                               combatState,
                               skillMeta,
                               isActiveSequence = () => false,
                               isToggleActive = () => false,
    characterLevel = 1
                           }) {
    skillMeta = {
        name: skillMeta?.name ?? '',
        skillType: skillMeta?.skillType ?? 'basic',
        multiplier: skillMeta?.multiplier ?? 1,
        amplify: skillMeta?.amplify ?? 0,
        ...skillMeta
    };

    const name = skillMeta.name?.toLowerCase() ?? '';
    const tab = skillMeta.tab ?? '';

    if (tab === 'forteCircuit') {
        skillMeta.skillType = 'heavy';
    }
    if (name.includes('resonance liberation') && characterLevel >= 50) {
        skillMeta.skillDmgBonus = (skillMeta.skillDmgBonus ?? 0) + 20;
    }

    if (characterLevel >= 70 && tab === 'forteCircuit') {
        skillMeta.skillShieldBonus = (skillMeta.skillShieldBonus ?? 0) + 20;
    }

    if (isActiveSequence(4) && isToggleActive(4) && tab === 'resonanceLiberation') {
        skillMeta.skillDmgBonus = (skillMeta.skillDmgBonus ?? 0) + 80;
    }

    if (name.includes('truth from within')) {
        skillMeta.multiplier = 556.67/100;
        skillMeta.skillType = 'heavy';
        skillMeta.visible = isActiveSequence(6);
    }

    return {mergedBuffs, combatState, skillMeta};
}

export const jianxinMultipliers = {
    forteCircuit: [
        {
            name: "Incomplete Minor Zhoutian Final Shield",
            scaling: { atk: 1 },
            shielding: true
        },
        {
            name: "Minor Zhoutian Final Shield",
            scaling: { atk: 1 },
            shielding: true
        },
        {
            name: "Major Zhoutian: Inner Final Shield",
            scaling: { atk: 1 },
            shielding: true
        },
        {
            name: "Major Zhoutian: Outer Final Shield",
            scaling: { atk: 1 },
            shielding: true
        },
        {
            name: "Shield Healing",
            scaling: { atk: 1 },
            healing: true
        },
        {
            name: "Truth from Within: Special Chi Counter DMG",
            scaling: { atk: 1 },
        }
    ]
};

export function jianxinBuffsLogic({
                                    mergedBuffs, characterState
                                }) {
    const state = characterState?.activeStates ?? {};

    if (state.transcendence) {
        mergedBuffs.skillType.resonanceLiberation.dmgBonus += 38;
    }

    return { mergedBuffs };
}