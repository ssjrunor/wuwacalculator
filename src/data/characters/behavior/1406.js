export function applyAeroRoverMLogic({
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
    const name = skillMeta.name?.toLowerCase();
    const tab = skillMeta.tab ?? '';

    if (name.includes('razor wind')) {
        skillMeta.skillType = 'heavy';
    } else if (tab === 'forteCircuit') {
        skillMeta.skillType = 'skill';
    }

    if (isToggleActiveLocal('inherent1') && !mergedBuffs.__aeroMInherents) {
        mergedBuffs.atk.percent += 20;
        mergedBuffs.__aeroMInherents = true;
    }

    if (isToggleActiveLocal('inherent2') && name === 'healing') {
        skillMeta.skillHealingBonus = (skillMeta.skillHealingBonus ?? 0) + 20;
    }

    if (name === ('glimmers fade into the dark: healing')) {
        skillMeta.multiplier = 0.2;
        skillMeta.visible = isActiveSequence(2);
    }

    if (isActiveSequence(3) && !mergedBuffs.__aeroMS3) {
        mergedBuffs.attribute.aero.dmgBonus += 15;
        mergedBuffs.__aeroMS3 = true;
    }

    if (isActiveSequence(4) && !mergedBuffs.__aeroMS4 && isToggleActive(4)) {
        mergedBuffs.skillType.resonanceSkill.dmgBonus += 15;
        mergedBuffs.__aeroMS4 = true;
    }

    if (isActiveSequence(5) && tab === 'resonanceLiberation' && name === 'skill dmg') {
        skillMeta.multiplier *= 1.2;
    }

    if (isActiveSequence(5) && name.includes('unbound flow')) {
        skillMeta.multiplier *= 1.3;
    }

    return {mergedBuffs, combatState, skillMeta};
}

export const aeroRoverMMultipliers = {
    resonanceSkill: [
        {
            name: "Glimmers Fade into the Dark: Healing",
            scaling: { atk: 1 },
            healing: true
        }
    ],
    resonanceLiberation: [
        {
            name: "Healing",
            scaling: { atk: 1 },
            healing: true
        }
    ],
    forteCircuit: [
        {
            name: "Cloudburst Dance Healing",
            scaling: { atk: 1 },
            healing: true
        }
    ]
};
