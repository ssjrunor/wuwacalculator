export function applyCiacconaLogic({
                               mergedBuffs,
                               combatState,
                               skillMeta,
                               characterState,
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

    const name = skillMeta.name?.toLowerCase();
    const tab = skillMeta.tab ?? '';

    if (name.includes('aimed shot') || name.includes('quadruple downbeat')) {
        skillMeta.skillType = 'heavy';
    }

    if (characterState?.activeStates?.concert && !mergedBuffs.__concert) {
        mergedBuffs.attribute.aero.dmgBonus += 24;
        mergedBuffs.__concert = true;
    }

    if (characterState?.activeStates?.windcalling && !mergedBuffs.__windcalling) {
        mergedBuffs.skillType.aeroErosion.amplify += 100;
        mergedBuffs.__windcalling = true;
    }

    if (name.includes('interlude tune')) {
        skillMeta.visible = characterLevel >= 50;
        skillMeta.multiplier = 1;
        skillMeta.scaling = { atk: 0, hp: 1, def: 0, energyRegen: 0 };
    }

    if (characterLevel >= 70 && name.includes('quadruple downbeat')) {
        skillMeta.skillDmgBonus = (skillMeta.skillDmgBonus ?? 0) + 30;
    }

    if (isToggleActive(1) && isActiveSequence(1) && !mergedBuffs.__ciacconaS1) {
        mergedBuffs.atk.percent += 35;
        mergedBuffs.__ciacconaS1 = true;
    }

    if (isToggleActive(2) && isActiveSequence(2) && !mergedBuffs.__ciacconaS2) {
        mergedBuffs.attribute.aero.dmgBonus += 40;
        mergedBuffs.__ciacconaS2 = true;
    }

    if ((tab === 'forteCircuit' || tab === 'resonanceLiberation') && isActiveSequence(4)) {
        skillMeta.skillDefIgnore = (skillMeta.skillDefIgnore ?? 0) + 45;
    }

    if (isActiveSequence(5) && !mergedBuffs.__ciacconaS5) {
        mergedBuffs.skillType.resonanceLiberation.amplify += 40;
        mergedBuffs.__ciacconaS5 = true;
    }

    if (name.includes('unending cadence')) {
        skillMeta.multiplier = 220/100;
        skillMeta.skillType = 'ultimate';
        skillMeta.visible = isActiveSequence(6);
    }

    return {mergedBuffs, combatState, skillMeta};
}

export const ciacconaMultipliers = {
    resonanceLiberation: [
        {
            name: "Interlude Tune: Shield",
            shielding: true
        },
        {
            name: "Unending Cadence: Skill DMG",
            scaling: { atk: 1 }
        }
    ]
};

export function ciacconaBuffsLogic({
                                    mergedBuffs, characterState
                               }) {
    const state = characterState?.activeStates ?? {};

    if (state.windcalling) {
        mergedBuffs.skillType.aeroErosion.amplify += 100;
    }

    if (state.concert) {
        mergedBuffs.attribute.aero.dmgBonus += 24;
    }

    if (state.s2) {
        mergedBuffs.attribute.aero.dmgBonus += 40;
    }

    return { mergedBuffs };
}