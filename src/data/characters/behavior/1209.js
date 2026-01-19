export function applyMornyeLogic({
                                       mergedBuffs,
                                       combatState,
                                       skillMeta,
                                       characterState,
                                       isActiveSequence = () => false,
                                       isToggleActive = () => false,
                                       characterLevel = 1,
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
        amplify: skillMeta?.amplify ?? 0,
    };

    const name = skillMeta.name?.toLowerCase() ?? '';
    const tab = skillMeta.tab ?? '';
    const isToggleActiveLocal = (key) => characterState?.activeStates?.[key] === true;

    if (name.includes('syntony field')) skillMeta.skillType = 'ultimate';
    const erOver = Math.max(0, (mergedBuffs.energyRegen ?? 0));
    const bonusCr = Math.min(erOver * .5, 80);
    const bonusCd = Math.min(erOver, 160);
    if (tab === 'resonanceLiberation') {
        skillMeta.skillCritRate = (skillMeta.skillCritRate ?? 0) + bonusCr;
        skillMeta.skillCritDmg = (skillMeta.skillCritDmg ?? 0) + bonusCd;
        skillMeta.scaling = { atk: 0, hp: 0, def: 1, energyRegen: 0 };
    }

    const bonus = mergedBuffs.tuneBreakBoost * (combatState?.tuneStrain ?? 0) * 0.12;
    if (!mergedBuffs.__mornyeTuneStrain && isToggleActiveLocal('decoupling')) {
        mergedBuffs.dmgBonus += bonus;
        mergedBuffs.__mornyeTuneStrain = true;
    }

    const dmgBonus = Math.min(erOver * 0.25, 40);
    if (isToggleActiveLocal('interferedMarker')) mergedBuffs.dmgBonus += dmgBonus;

    if (isToggleActiveLocal('recursion')) mergedBuffs.attribute.all.amplify += 25;

    if (tab === 'tuneBreak' || name.includes('tune rupture')) {
        skillMeta.skillType = 'tuneRupture';
        if (tab !== 'tuneBreak') {
            skillMeta.element = 'fusion';
            skillMeta.tuneAmp = skillMeta.multiplier ?? skillMeta.tuneAmp;
        }
        skillMeta.dmgType = 'tuneBreak';
    }

    if (name.includes('boundedness')) {
        skillMeta.multiplier = 1.5
        skillMeta.visible = characterLevel >= 70;
    }

    if (name.includes('high syntony field')) {
        skillMeta.multiplier *= 1.4;
        skillMeta.skillType = 'ultimate';
    }

    if (isActiveSequence(2) && isToggleActive(2) && !mergedBuffs.__mornyeS2) {
        mergedBuffs.critDmg = Math.min(erOver * 0.2, 32);
        mergedBuffs.__mornyeS2 = true;
    }
    if (isActiveSequence(4) && name.includes('high syntony field'))
        skillMeta.skillHealingBonus = (skillMeta.skillHealingBonus ?? 0) + 30;

    if (isActiveSequence(5)) {
        if (name.includes('tune rupture') && tab === 'forteCircuit') skillMeta.multiplier *= 2.6;
        if (tab === 'resonanceLiberation' && name.includes('skill')) skillMeta.multiplier *= 1.4;
    }

    if (isActiveSequence(6) &&
        tab === 'resonanceLiberation' &&
        name.includes('skill dmg'))
            skillMeta.skillDmgBonus = (skillMeta.skillDmgBonus ?? 0) + 400;

    return {mergedBuffs, combatState, skillMeta};
}

export const mornyeMultipliers = {
    forteCircuit:
        [
            {
                name: 'Syntony Field Healing',
                scaling: { atk: 0, hp: 0, def: 1, energyRegen: 0 },
                healing: true
            },
            {
                name: 'Boundedness Healing',
                scaling: { atk: 0, hp: 0, def: 1, energyRegen: 0 },
                healing: true
            }
        ],
    resonanceSkill: [
        {
            name: 'Distributed Array Healing',
            scaling: { atk: 0, hp: 0, def: 1, energyRegen: 0 },
            healing: true
        },
        {
            name: 'Expectation Error Healing',
            scaling: { atk: 0, hp: 0, def: 1, energyRegen: 0 },
            healing: true
        }
    ],
    resonanceLiberation: [
        /*{
            name: 'Skill 2 DMG',
            scaling: { atk: 0, hp: 0, def: 1, energyRegen: 0 },
            Param: [
                [
                    "262.73%+1050.92%*2",
                    "284.27%+1137.08%*2",
                    "305.82%+1223.28%*2",
                    "335.98%+1343.92%*2",
                    "357.52%+1430.08%*2",
                    "382.30%+1529.20%*2",
                    "416.77%+1667.08%*2",
                    "451.24%+1804.96%*2",
                    "485.70%+1942.80%*2",
                    "522.33%+2089.32%*2",
                    "565.42%+2261.68%*2",
                    "608.50%+2434.00%*2",
                    "651.59%+2606.36%*2",
                    "694.68%+2778.72%*2",
                    "737.76%+2951.04%*2",
                    "780.85%+3123.40%*2",
                    "823.94%+3295.76%*2",
                    "867.02%+3468.08%*2",
                    "910.11%+3640.44%*2",
                    "953.20%+3812.80%*2"
                ]
            ]
        },*/
        {
            name: 'High Syntony Field Healing',
            scaling: { atk: 0, hp: 0, def: 1, energyRegen: 0 },
            healing: true,
            Param: [[
                "40+9.63%",
                "44+10.02%",
                "50+10.41%",
                "56+10.98%",
                "63+11.75%",
                "70+12.53%",
                "71+13.97%",
                "73+15.61%",
                "74+17.35%",
                "76+20.24%",
                "82+21.91%",
                "88+23.58%",
                "95+25.25%",
                "101+26.92%",
                "107+28.59%",
                "114+30.26%",
                "120+31.93%",
                "126+33.59%",
                "132+35.26%",
                "139+36.93%"
            ]]
        }
    ]

};


export function mornyeBuffsLogic({
                                       mergedBuffs, characterState
                                   }) {
    const state = characterState?.activeStates ?? {};
    const excessEr = (state.mornyeER ?? 100) - 100;
    const dmgBonus = Math.min(excessEr * 0.25, 40);

    mergedBuffs.dmgBonus += state.interferedMarker ? dmgBonus : 0;

    mergedBuffs.attribute.all.amplify += state.recursion ? 25 : 0;

    mergedBuffs.def.percent += state.highSyntony ? 20 : 0;

    const cr = Math.min((state.mornyeER ?? 0) * 0.2, 32);
    mergedBuffs.critDmg += state.entropicMorning ? cr : 0;

    return { mergedBuffs };
}
