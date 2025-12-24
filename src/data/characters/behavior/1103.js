export function applyBaizhiLogic({
                                     mergedBuffs,
                                     combatState,
                                     skillMeta,
                                     characterState,
                                     isActiveSequence = () => false,
                                     isToggleActive = () => false
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

    if (tab === 'forteCircuit' && name.includes("stimulus feedback")) {
        skillMeta.multiplier = 0.25/100;
    } else if (tab === 'outroSkill' && name.includes("lightning manipulation hot")) {
        skillMeta.multiplier = 1.54/100;
    }

    if (characterState?.activeStates?.inherent1 && !mergedBuffs.__baizhiInherentApplied) {
        mergedBuffs.atk.percent += 15;
        mergedBuffs.__baizhiInherentApplied = true;
    }

    if (isToggleActive(2) && isActiveSequence(2)) {
        if (!mergedBuffs.__baizhiSeq2) {
            mergedBuffs.healingBonus += 15;
            mergedBuffs.attribute.glacio.dmgBonus += 15;
            mergedBuffs.__baizhiSeq2 = true;
        }
    } else {
        mergedBuffs.__baizhiSeq2 = false;
    }

    if (isToggleActive(3) && isActiveSequence(3)) {
        if (!mergedBuffs.__baizhiSeq3) {
            mergedBuffs.hp.percent += 12;
            mergedBuffs.__baizhiSeq3 = true;
        }
    } else {
        mergedBuffs.__baizhiSeq3 = false;
    }

    if (isToggleActive(4) && isActiveSequence(4)) {
        if (name === 'remnant entities healing' && !skillMeta.__baizhiS4HealingApplied) {
            skillMeta.multiplier = (skillMeta.multiplier ?? 0) * 1.20;
            skillMeta.__baizhiS4HealingApplied = true;
        }

        if (name === 'remnant entities damage' && !skillMeta.__baizhiS4DamageApplied) {
            skillMeta.multiplier = (skillMeta.multiplier ?? 0) + 0.012;
            skillMeta.__baizhiS4DamageApplied = true;
        }
    }

    if (isToggleActive(6) && isActiveSequence(6)) {
        if (!mergedBuffs.__baizhiSeq6) {
            mergedBuffs.attribute.glacio.dmgBonus += 12;
            mergedBuffs.__baizhiSeq6 = true;
        }
    } else {
        mergedBuffs.__baizhiSeq6 = false;
    }

    return { mergedBuffs, combatState, skillMeta };
}

export const baizhiMultipliers = {
    resonanceSkill: [
        {
            name: "Healing",
            scaling: { hp: 1 },
            healing: true
        },
        {
            name: "Skill DMG",
            scaling: { hp: 1 }
        }
    ],
    resonanceLiberation: [
        {
            name: "Remnant Entities Damage",
            scaling: { hp: 1 }
        },
        {
            name: "Remnant Entities Healing",
            scaling: { hp: 1 },
            healing: true
        },
        {
            name: "Momentary Union Healing",
            scaling: { hp: 1 },
            healing: true
        }
    ],
    forteCircuit: [
        {
            name: "Concentration Healing",
            scaling: { hp: 1 },
            healing: true
        },
        {
            name: "Stimulus Feedback",
            scaling: { hp: 1 },
            healing: true
        }
    ],
    outroSkill: [
        {
            name: "Lightning Manipulation HoT",
            scaling: { hp: 1 },
            healing: true
        }
    ],
    introSkill: [
        {
            name: "Overflowing Frost Healing",
            scaling: { hp: 1 },
            healing: true
        }
    ]
};

export function baizhiBuffsLogic({
                                    mergedBuffs, characterState
                                }) {
    const state = characterState?.activeStates ?? {};

    if (state.euphonia) {
        mergedBuffs.atk.percent += 15;
    }

    if (state.rejuvinating) {
        mergedBuffs.attribute.all.amplify += 15;
    }

    if (state.devotion) {
        mergedBuffs.attribute.glacio.dmgBonus += 12;
    }

    return { mergedBuffs };
}