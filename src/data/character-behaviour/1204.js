export function applyMortefiLogic({
                               mergedBuffs,
                               combatState,
                               skillMeta,
                               characterState,
                               isActiveSequence = () => false,
                               isToggleActive = () => false,
                                      baseCharacterState,
                                      sliderValues,
                                      getSkillData
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
    const name = skillMeta.name?.toLowerCase();
    const tab = skillMeta.tab ?? '';

    if (tab === 'forteCircuit') {
        skillMeta.skillType = 'skill';
    }

    if (name.includes('marcato')) {
        skillMeta.skillType = ['ultimate', 'coord'];
    }

    if (name === "funerary quartet: marcato damage") {
        const marcatoNode = Object.values(getSkillData(baseCharacterState, 'resonanceLiberation')?.Level ?? {})
            .find(level => level?.Name?.toLowerCase?.() === 'marcato damage');

        const paramArray = marcatoNode?.Param?.[0];
        const marcatoRaw = paramArray?.[sliderValues?.resonanceLiberation - 1] ?? paramArray?.[0];

        const multiplier = parseCompoundMultiplier(marcatoRaw ?? '');

        skillMeta.multiplier = multiplier * 0.5;
        skillMeta.visible = isActiveSequence(5);
    }

    if (isToggleActiveLocal('inherent1') && !mergedBuffs.__mortefiInherent1 && name === 'fury fugue damage') {
        skillMeta.skillDmgBonus = (skillMeta.skillDmgBonus ?? 0) + 25;
        mergedBuffs.__mortefiInherent1 = true;
    }

    const mortefiInherent2Stacks = characterState?.activeStates?.inherent2 ?? 0;
    const mortefiInherent2 = Math.min(mortefiInherent2Stacks * 1.5, 1.5 * 50);
    if (mortefiInherent2 > 0 && !mergedBuffs.__mortefiInherent2 &&  name.includes('marcato')) {
        skillMeta.skillDmgBonus = (skillMeta.skillDmgBonus ?? 0) + mortefiInherent2;
        mergedBuffs.__mortefiInherent2 = true;
    }

    if (isToggleActive(3) && isActiveSequence(3) && name.includes('marcato') && !mergedBuffs.__mortefiS3) {
        skillMeta.critDmgBonus = (skillMeta.critDmgBonus ?? 0) + 25;
        mergedBuffs.__mortefiS3 = true;
    }

    if (isToggleActive(6) && isActiveSequence(6) && !mergedBuffs.__mortefiS6) {
        mergedBuffs.atk.percent += 20;
        mergedBuffs.__mortefiS6 = true;
    }

    return {mergedBuffs, combatState, skillMeta};
}

function parseCompoundMultiplier(formula) {
    if (!formula) return 0;

    const parts = formula.match(/\d+(\.\d+)?%(\*\d+)?/g);
    if (!parts) return 0;

    return parts.reduce((sum, part) => {
        const [percent, timesStr] = part.split('*');
        const value = parseFloat(percent.replace('%', '')) / 100;
        const times = timesStr ? parseInt(timesStr, 10) : 1;
        return sum + value * times;
    }, 0);
}

export const mortefiMultipliers = {
    resonanceLiberation: [
        {
            name: "Funerary Quartet: marcato damage",
            scaling: { atk: 1 }
        }
    ]
}

export function mortefiBuffsLogic({
                                     mergedBuffs, characterState
                                 }) {
    const state = characterState?.activeStates ?? {};

    if (state.transposition) {
        mergedBuffs.skillType.heavyAtk.amplify += 38;
    }

    if (state.apoplectic) {
        mergedBuffs.atk.percent += 20;
    }

    return { mergedBuffs };
}
