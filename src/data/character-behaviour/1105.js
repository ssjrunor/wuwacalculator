export function applyZhezhiLogic({
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

    const name = skillMeta.name?.toLowerCase();
    const tab = skillMeta.tab ?? '';

    if (characterState?.activeStates?.zenith && !mergedBuffs.__zhezhiZenithApplied) {
        mergedBuffs.skillType.basicAtk.dmgBonus += 18;
        mergedBuffs.__zhezhiZenithApplied = true;
    }

    if (['stroke of genius dmg', 'creation\'s zenith dmg'].some(n => name.includes(n))) {
        skillMeta.skillType = 'basic';
    } else if (['ha dmg', 'ha - conjuration dmg'].some(n => name.includes(n))) {
        skillMeta.skillType = 'heavy';
    } else if (name === 'inklit spirit dmg') {
        skillMeta.skillType = ['basic', 'coord'];
    }

    const inherent1Stacks = characterState?.activeStates?.inherent1 ?? 0;
    const inherent1 = Math.min(inherent1Stacks * 6, 18);
    if (!mergedBuffs.__zhezhiInherent1) {
        mergedBuffs.atk.percent += inherent1;
        mergedBuffs.__zhezhiInherent1 = true;
    }

    if (isToggleActive(1) && isActiveSequence(1)) {
        if (!mergedBuffs.__ZhezhiSeq1) {
            mergedBuffs.critRate += 10;
            mergedBuffs.__ZhezhiSeq1 = true;
        }
    } else {
        mergedBuffs.__ZhezhiSeq1 = false;
    }

    const seq3Value = characterState?.toggles?.['3_value'] ?? 0;
    if (isActiveSequence(3) && seq3Value > 0) {
        if (!mergedBuffs.__ZhezhiSeq3) {
            mergedBuffs.atk.percent += (seq3Value * 15);
            mergedBuffs.__ZhezhiSeq3 = true;
        }
    } else {
        mergedBuffs.__ZhezhiSeq3 = false;
    }

    if (isToggleActive(4) && isActiveSequence(4)) {
        if (!mergedBuffs.__ZhezhiSeq4) {
            mergedBuffs.atk.percent += 20;
            mergedBuffs.__ZhezhiSeq4 = true;
        }
    } else {
        mergedBuffs.__ZhezhiSeq4 = false;
    }


    if (tab === 'resonanceLiberation' && name.includes("composition's clue")) {
        const inklitNode = Object.values(getSkillData(baseCharacterState, 'resonanceLiberation')?.Level ?? {})
            .find(level => level?.Name?.toLowerCase?.() === 'inklit spirit dmg');
        const paramArray = inklitNode?.Param?.[0];
        const inklitRaw = paramArray?.[sliderValues?.resonanceLiberation - 1] ?? paramArray?.[0];
        const inklitBase = inklitRaw ? parseFloat(String(inklitRaw).match(/[\d.]+/)?.[0] ?? '0') / 100 : 1;
        skillMeta.multiplier = inklitBase * 1.4;

        skillMeta.visible = isActiveSequence(5);
    }

    if (tab === 'forteCircuit' && name.includes("infinite legacy")) {
        const strokeNode = Object.values(getSkillData(baseCharacterState, 'forteCircuit')?.Level ?? {})
            .find(level => level?.Name?.toLowerCase?.() === 'stroke of genius dmg');
        const paramArray = strokeNode?.Param?.[0];
        const strokeRaw = paramArray?.[sliderValues?.forteCircuit - 1] ?? paramArray?.[0];
        const strokeBase = strokeRaw ? parseFloat(String(strokeRaw).match(/[\d.]+/)?.[0] ?? '0') / 100 : 1;
        skillMeta.multiplier = strokeBase * 1.2;

        skillMeta.visible = isActiveSequence(6);
    }


    return { mergedBuffs, combatState, skillMeta };
}

export const zhezhiMultipliers = {
    forteCircuit: [
        {
            name: "Infinite Legacy Stroke of Genius DMG",
            multiplier: "0%",
            scaling: { atk: 1 }
        }
    ],
    resonanceLiberation: [
        {
            name: "Composition's Clue Inklit Spirit DMG",
            multiplier: "0%",
            scaling: { atk: 1 }
        }
    ]
};

export function zhezhiBuffsLogic({
                                 mergedBuffs, characterState, activeCharacter
                             }) {
    const state = characterState?.activeStates ?? {};

    if (state.carveAndDraw) {
        mergedBuffs.attribute.glacio.amplify += 20;
        mergedBuffs.skillType.resonanceSkill.amplify += 25;
    }

    if (state.spectrum) {
        mergedBuffs.atk.percent += 20;
    }

    return { mergedBuffs };
}