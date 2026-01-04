export function applyYuanwuLogic({
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

    skillMeta.scaling = { atk: 0, hp: 0, def: 1, energyRegen: 0 };

    const name = skillMeta.name?.toLowerCase() ?? '';
    const tab = skillMeta.tab ?? '';

    if (tab === 'normalAttack') {
        skillMeta.scaling = { atk: 1, hp: 0, def: 0, energyRegen: 0 };
    }

    if (tab === 'forteCircuit') {
        if (name.includes('heavy')) {
            skillMeta.skillType = 'heavy';
        } else if (name.includes('basic') || name.includes('dodge') || name === 'thunderweaver damage') {
            skillMeta.skillType = 'basic';
        } else {
            skillMeta.skillType = 'skill';
        }
    }

    if (name === 'thunder uprising damage' && characterLevel >= 50) {
        skillMeta.multiplier *= 1.4;
    }

    if (isActiveSequence(3) && isToggleActive(3) && name === 'thunder wedge coordinated attack dmg') {
        skillMeta.multiplier *= 1.2;
    }

    if (name === 'retributive knuckles: shield') {
        skillMeta.visible = isActiveSequence(4);
        skillMeta.multiplier = 200/100;
    }

    if (isActiveSequence(5) && isToggleActive(5) && !mergedBuffs.__yuanwuS5) {
        mergedBuffs.skillType.resonanceLiberation.dmgBonus += 50;
        mergedBuffs.__yuanwuS5 = true;
    }

    if (isActiveSequence(6) && isToggleActive(6) && !mergedBuffs.__yuanwuS6) {
        mergedBuffs.def.percent += 32;
        mergedBuffs.__yuanwuS6 = true;
    }

    return {mergedBuffs, combatState, skillMeta};
}

export const yuanwuMultipliers = {
    resonanceLiberation: [
        {
            name: "Retributive Knuckles: Shield",
            scaling: { def: 1 },
            shielding: true
        }
    ]
};

export function yuanwuBuffsLogic({
                                   mergedBuffs, characterState
                               }) {
    const state = characterState?.activeStates ?? {};

    if (state.defender) {
        mergedBuffs.def.percent += 32;
    }

    return { mergedBuffs };
}