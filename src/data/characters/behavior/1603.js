export function applyCamellyaLogic({
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

    if (tab === 'forteCircuit' || tab === 'resonanceSkill') {
        skillMeta.skillType = 'basic';
    }

    if (tab === 'outroSkill') {
        if (name.includes('ephemeral')) {
            skillMeta.multiplier = 459.02/100;
        } else {
            skillMeta.multiplier = 329.24/100;
        }
    }

    const isSweetDream = (tab === 'resonanceSkill' || (tab === 'normalAttack') && !name.includes('heavy'));

    let bonusMultiplier = 0
    let bonusS6 = 0;
    const hasSweetDream = characterState?.activeStates?.sweetDream ?? false;
    const crimsonBudCount = characterState?.activeStates?.crimsonBud ?? 0;
    if (hasSweetDream && isSweetDream) {
        if (isActiveSequence(6)) {
            bonusS6 = 1.5;
        }
        bonusMultiplier = 0.5;
        bonusMultiplier += Math.min(crimsonBudCount * 0.05, 0.5);
        bonusMultiplier += bonusS6
        skillMeta.multiplier = (skillMeta.multiplier ?? 1) * (1 + bonusMultiplier);
    }

    if (characterLevel >= 50) {
        if (!mergedBuffs.__camellyaInherent1) {
            mergedBuffs.attribute.havoc.dmgBonus += 15;
            mergedBuffs.__camellyaInherent1 = true;
        }
        if (tab === 'normalAttacht') {
            skillMeta.skillType = 'basic';
        }
    }

    if (characterLevel >= 70 && !mergedBuffs.__camellyaInherent2) {
        mergedBuffs.skillType.basicAtk.dmgBonus += 15;
        mergedBuffs.__camellyaInherent2 = true;
    }

    if (isActiveSequence(1) && isToggleActive(1) && !mergedBuffs.__camellyaS1) {
        mergedBuffs.critDmg += 28;
        mergedBuffs.__camellyaS1 = true;
    }

    if (isActiveSequence(2) && tab === 'forteCircuit') {
        skillMeta.multiplier *= 2.2;
    }

    if (isActiveSequence(3)) {
        if (!mergedBuffs.__camellyaS3 && isToggleActive(3)) {
            mergedBuffs.atk.percent += 58;
            mergedBuffs.__camellyaS3 = true;
        }

        if (tab === 'resonanceLiberation') {
            skillMeta.multiplier *= 1.5;
        }
    }

    if (isActiveSequence(4) && isToggleActive(4) && !mergedBuffs.__camellyaS4) {
        mergedBuffs.skillType.basicAtk.dmgBonus += 25;
        mergedBuffs.__camellyaS4 = true;
    }

    if (isActiveSequence(5)) {
        if (tab === 'introSkill') {
            skillMeta.multiplier *= 4.03;
        } else if (tab === 'outroSkill') {
            skillMeta.multiplier *= 1.68;
        }
    }

    if (name.includes('perennial')) {
        skillMeta.visible = isActiveSequence(6);
        skillMeta.skillType = 'basic';
    }

    return {mergedBuffs, combatState, skillMeta};
}

export const cammellyaMultipliers = {
    outroSkill: [
        {
            name: "Twining DMG",
            scaling: { atk: 1 },
        },
        {
            name: "Ephemeral Twining DMG",
            scaling: { atk: 1 },
        }
    ],
    forteCircuit: [
        {
            name: "Bloom For You Thousand Times Over: Perennial DMG",
            scaling: { atk: 1 },
            Param: [
                [
                    "635.00%",
                    "687.07%",
                    "739.14%",
                    "812.04%",
                    "864.11%",
                    "923.99%",
                    "1007.31%",
                    "1090.62%",
                    "1173.93%",
                    "1262.45%",
                    "1366.59%",
                    "1470.73%",
                    "1574.87%",
                    "1679.01%",
                    "1783.15%",
                    "1887.29%",
                    "1991.43%",
                    "2095.57%",
                    "2199.71%",
                    "2303.85%"
                ]
            ]
        }
    ]
};

export function camBuffsLogic({
                                     mergedBuffs, characterState, activeCharacter
                                 }) {
    const state = characterState?.activeStates ?? {};

    if (state.eternity) {
        mergedBuffs.skillType.basicAtk.dmgBonus += 25;
    }

    return { mergedBuffs };
}