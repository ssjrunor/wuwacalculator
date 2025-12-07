export function applyYaoLogic({
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

    const name = skillMeta.name?.toLowerCase();
    const tab = skillMeta.tab ?? '';

    if (tab === 'resonanceLiberation') {
        if (name.includes('pivot')) {
            skillMeta.skillType = 'basic';
        } else if (name.includes('divergence')) {
            skillMeta.skillType = 'skill';
        }
    } else if (tab === 'forteCircuit') {
        skillMeta.skillType = 'ultimate';
    } else if (tab === 'outroSkill') {
        skillMeta.multiplier = 237.63/100;
    }

    const inherent1Stacks = characterState?.activeStates?.inherent1 ?? 0;
    const inherent1 = Math.min(inherent1Stacks * 5, 20);

    if (!mergedBuffs.__yaoInherent1) {
        mergedBuffs.attribute.electro.dmgBonus += inherent1;
        mergedBuffs.__yaoInherent1 = true;
    }

    if (name === 'prodigy of protégés: convolution matrices dmg') {
        skillMeta.multiplier *= 0.08;
        skillMeta.visible = isActiveSequence(1);
    }

    if (isActiveSequence(2) && isToggleActive(2) && !mergedBuffs.__yaoS2) {
        mergedBuffs.critDmg += 30;
        mergedBuffs.__yaoS2 = true;
    }

    if (isToggleActive(3) && isActiveSequence(3)) {
        if ( tab === 'forteCircuit' ) {
            skillMeta.skillDmgBonus = (skillMeta.skillDmgBonus ?? 0) + 63;
        }
    }

    if (isActiveSequence(4) && isToggleActive(4) && !mergedBuffs.__yaoS4) {
        mergedBuffs.attribute.all.dmgBonus += 20;
        mergedBuffs.__yaoS4 = true;
    }

    if (isActiveSequence(5)) {
        if (name.includes('chain rule')) {
            skillMeta.multiplier *= 3.22;
        } else if (name.includes('cogitation model')) {
            skillMeta.multiplier *= 2;
        }
    }

    if (isActiveSequence(6) && (['law of reigns dmg', 'convolution matrices dmg']
        .some(n => name.includes(n)))) {
        skillMeta.multiplier *= 1.76;
    }

    return {mergedBuffs, combatState, skillMeta};
}

export const yaoMultipliers = {
    outroSkill: [
        {
            name: "Chain Rule",
            scaling: { atk: 1 }
        }
    ],
    forteCircuit: [
        {
            name: "Prodigy of Protégés: Convolution Matrices DMG",
            scaling: { atk: 1 },
            Param: [
                [
                    "321%*6",
                    "357.66%*6",
                    "373.30%*6",
                    "410.52%*6",
                    "434.92%*6",
                    "467.12%*6",
                    "509.25%*6",
                    "551.38%*6",
                    "593.51%*6",
                    "636.20%*6",
                    "690.81%*6",
                    "745.43%*6",
                    "800.04%*6",
                    "854.65%*6",
                    "909.26%*6",
                    "963.87%*6",
                    "1018.48%*6",
                    "1073.09%*6",
                    "1127.70%*6",
                    "1182.31%*6"
                ]
            ]
        }
    ]
};

export function yaoBuffsLogic({
                                     mergedBuffs, characterState
                                 }) {
    const state = characterState?.activeStates ?? {};

    if (state.rebirth) {
        mergedBuffs.attribute.all.dmgBonus += 20;
    }

    return { mergedBuffs };
}