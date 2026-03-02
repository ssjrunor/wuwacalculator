import { calculateSupportEffect} from "@shared/utils/supportCalculator.js";

export function applyYouhuLogic({
                                   mergedBuffs,
                                   combatState,
                                   skillMeta,
                                   characterState,
                                   isActiveSequence = () => false,
                                   isToggleActive = () => false,
                                   baseCharacterState,
                                   sliderValues,
                                   getSkillData,
                                    finalStats
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

    if (tab === 'forteCircuit' && name.includes("poetic essence")) {
        skillMeta.skillType = 'skill';
    }


    if (tab === 'resonanceSkill' && name.includes("treasured piece healing")) {
        const scrollNode = Object.values(getSkillData(baseCharacterState, 'resonanceSkill')?.Level ?? {})
            .find(level => level?.Name?.toLowerCase?.() === 'scroll divination healing');

        const paramArray = scrollNode?.Param?.[0];
        const scrollRaw = paramArray?.[sliderValues?.resonanceSkill - 1] ?? paramArray?.[0];

        const flatAndPercent = extractFlatAndPercent(scrollRaw ?? '');

        const scaling = scrollNode?.scaling ?? { atk: 1 };

        const scrollHeal = calculateSupportEffect({
            finalStats,
            scaling,
            multiplier: flatAndPercent.percent,
            flat: flatAndPercent.flat,
            type: 'healing'
        });

        skillMeta.scaling = { atk: 0 };
        skillMeta.multiplier = 0;
        skillMeta.flatOverride = Math.floor(scrollHeal * 0.3);
        skillMeta.tags = ['healing'];
        skillMeta.visible = isToggleActiveLocal('inherent1');
    }

    if (isToggleActiveLocal('inherent2')) {
        if (!mergedBuffs.__youhuInherent1) {
            mergedBuffs.attribute.glacio.dmgBonus += 15;
            mergedBuffs.__youhuInherent1 = true;
        }
    } else {
        mergedBuffs.__youhuInherent1 = false;
    }


    if (name === 'poetic essence skill dmg') {
        let bonus = 0;

        const hasAntithesis = isToggleActive('antithesis');
        const hasTriplet = isToggleActive('triplet');
        const seq2Active = isActiveSequence(2);

        if (hasAntithesis) {
            bonus += seq2Active ? 70 * 2 : 70;
        }

        if (hasTriplet) {
            bonus += seq2Active ? 175 * 2 : 175;
        }

        skillMeta.skillDmgBonus = (skillMeta.skillDmgBonus ?? 0) + bonus;
    }

    if (isActiveSequence(3)) {
        if (!mergedBuffs.__youhuSeq3) {
            mergedBuffs.atk.percent += 20;
            mergedBuffs.__youhuSeq3 = true;
        }
    } else {
        mergedBuffs.__youhuSeq3 = false;
    }

    if (isToggleActive(5) && isActiveSequence(5)) {
        if (!mergedBuffs.__youhuSeq5) {
            mergedBuffs.critRate += 15;
            mergedBuffs.__youhuSeq5 = true;
        }
    } else {
        mergedBuffs.__youhuSeq5 = false;
    }

    const seq6Value = characterState?.toggles?.['6_value'] ?? 0;
    if (isActiveSequence(6) && seq6Value > 0) {
        if (!mergedBuffs.__youhuSeq6) {
            mergedBuffs.critDmg += (seq6Value * 15);
            mergedBuffs.__youhuSeq6 = true;
        }
    } else {
        mergedBuffs.__youhuSeq6 = false;
    }

    return { mergedBuffs, combatState, skillMeta };
}

export const youhuMultipliers = {
    resonanceSkill: [
        {
            name: "Scroll Divination Healing",
            scaling: { atk: 1 },
            healing: true
        },
        {
            name: "Treasured Piece Healing",
            scaling: { atk: 1 },
            healing: true
        }
    ],
    forteCircuit: [
        {
            name: "Poetic Essence Healing",
            scaling: { atk: 1 },
            healing: true
        },
        {
            name: "Double Pun Bonus Healing",
            scaling: { atk: 1 },
            healing: true
        }
    ]
};

function extractFlatAndPercent(str) {
    const flatMatch = str.match(/^(\d+(\.\d+)?)/);
    const percentMatch = str.match(/(\d+(\.\d+)?)%/);

    return {
        flat: flatMatch ? parseFloat(flatMatch[1]) : 0,
        percent: percentMatch ? parseFloat(percentMatch[1]) / 100 : 0
    };
}

export function youhuBuffsLogic({
                                     mergedBuffs, characterState
                                 }) {
    const state = characterState?.activeStates ?? {};

    if (state.timeless) {
        mergedBuffs.skillType.coord.amplify += 100;
    }

    return { mergedBuffs };
}