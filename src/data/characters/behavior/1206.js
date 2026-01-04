export function applyBrantLogic({
                               mergedBuffs,
                               combatState,
    finalStats,
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

    const isToggleActiveLocal = (key) => characterState?.activeStates?.[key] === true;
    const name = skillMeta.name?.toLowerCase() ?? '';
    const tab = skillMeta.tab ?? '';

    if (mergedBuffs.energyRegen > 50) {
        const excess = mergedBuffs.energyRegen - 50;

        if (characterState?.activeStates?.myMoment && !mergedBuffs.__myMoment) {
            const atkBuff = Math.min(excess * 20, 2600);
            mergedBuffs.atk.flat += atkBuff;
            mergedBuffs.__myMoment = true;
        } else if (!characterState?.activeStates?.myMoment && !mergedBuffs.__notMyMoment) {
            const atkBuff = Math.min(excess * 12, 1560);
            mergedBuffs.atk.flat += atkBuff;
            mergedBuffs.__notMyMoment = true;
        }
    }


    if (name.includes('healing') || name.includes('shield')) {
        skillMeta.multiplier *= 100;
    }

    if (tab === 'forteCircuit' || name === 'plunging attack dmg') {
        skillMeta.skillType = 'basic';
    }

    if (!mergedBuffs.__brantInherent1 && name === 'waves of acclaims healing' && characterLevel >= 50) {
        skillMeta.skillHealingBonus = (skillMeta.skillHealingBonus ?? 0) + 20;
        mergedBuffs.__brantInherent1 = true;
    }

    if (isToggleActiveLocal('inherent2') && !mergedBuffs.__brantInherent2) {
        mergedBuffs.attribute.fusion.dmgBonus += 15;
        mergedBuffs.__brantInherent2 = true;
    }

    if (isActiveSequence(1) && isToggleActive(1) && !mergedBuffs.__brantS1) {
        mergedBuffs.attribute.fusion.dmgBonus += 20;
        mergedBuffs.__brantS1 = true;
    }

    if (name === 'for smiles and cheers: skill dmg') {
        skillMeta.visible = isActiveSequence(2) && isToggleActive(2);
        if (skillMeta.visible) {
            skillMeta.multiplier = 440 / 100;
            skillMeta.skillType = 'basic';
        }
    }

    if (isActiveSequence(3) && name === 'returned from ashes dmg') {
        skillMeta.multiplier *= 1.42;
    }

    if (isActiveSequence(4) && name === 'returned from ashes dmg') {
        if (!mergedBuffs.__brantS4) {
            skillMeta.skillShieldBonus = (skillMeta.skillShieldBonus ?? 0) + 20;
            mergedBuffs.__brantS4 = true;
        }
    }

    if (isActiveSequence(4) && name === 'to freedom i sing: healing') {
        skillMeta.multiplier = 6.6;
        skillMeta.visible = isActiveSequence(4);
    }

    if (name === 'to freedom i sing: healing') {
        skillMeta.visible = isActiveSequence(4);
    }

    if (isActiveSequence(5) && isToggleActive(5) && !mergedBuffs.__brantS5) {
        mergedBuffs.skillType.basicAtk.dmgBonus += 15;
        mergedBuffs.__brantS5 = true;
    }

    if (isActiveSequence(6)) {
        if (name.includes('mid-air')) {
            skillMeta.multiplier *= 1.3;
        } else if (name === 'returned from ashes dmg') {
            skillMeta.multiplier *= 1.3;
        }
    }

    return {mergedBuffs, combatState, skillMeta};
}

export const brantMultipliers = {
    resonanceLiberation: [
        {
            name: "Healing",
            scaling: { energyRegen: 1 },
            healing: true,
            Param: [
                [
                    "500+1.75%",
                    "560+1.96%",
                    "625+2.18%",
                    "700+2.45%",
                    "790+2.76%",
                    "875+3.06%",
                    "890+3.11%",
                    "910+3.18%",
                    "925+3.23%",
                    "950+3.32%",
                    "1028+3.59%",
                    "1106+3.87%",
                    "1185+4.14%",
                    "1263+4.42%",
                    "1341+4.69%",
                    "1420+4.97%",
                    "1498+5.24%",
                    "1576+5.51%",
                    "1655+5.79%",
                    "1733+6.06%"
                ]
            ]
        }
    ],
    forteCircuit: [
        {
            name: "Waves of Acclaims Healing",
            scaling: { energyRegen: 1 },
            healing: true,
            Param: [
                [
                    "312+1.09%",
                    "350+1.22%",
                    "390+1.36%",
                    "437+1.53%",
                    "493+1.72%",
                    "546+1.91%",
                    "556+1.94%",
                    "568+1.99%",
                    "578+2.02%",
                    "593+2.07%",
                    "642+2.24%",
                    "691+2.42%",
                    "740+2.59%",
                    "789+2.76%",
                    "838+2.93%",
                    "887+3.1%",
                    "936+3.27%",
                    "985+3.44%",
                    "1034+3.62%",
                    "1083+3.79%"
                ]
            ]
        },
        {
            name: "Shield",
            scaling: { energyRegen: 1 },
            shielding: true,
            Param: [
                [
                    "2500+9%",
                    "2800+10.08%",
                    "3125+11.25%",
                    "3500+12.6%",
                    "3950+14.22%",
                    "4375+15.75%",
                    "4450+16.02%",
                    "4550+16.38%",
                    "4625+16.65%",
                    "4750+17.1%",
                    "5141+18.51%",
                    "5533+19.92%",
                    "5925+21.33%",
                    "6317+22.74%",
                    "6709+24.15%",
                    "7100+25.56%",
                    "7492+26.97%",
                    "7884+28.38%",
                    "8276+29.79%",
                    "8668+31.2%"
                ]
            ]
        },
        {
            name: "To Freedom I Sing: Healing",
            scaling: { energyRegen: 1 },
            healing: true
        }
    ],
    outroSkill: [
        {
            name: "For Smiles and Cheers: Skill Dmg",
            scaling: { atk: 1 }
        }
    ]
};

export function brantBuffsLogic({
                                      mergedBuffs, characterState
                                  }) {
    const state = characterState?.activeStates ?? {};

    if (state.course) {
        mergedBuffs.attribute.fusion.amplify += 20;
        mergedBuffs.skillType.resonanceSkill.amplify += 25;
    }

    return { mergedBuffs };
}