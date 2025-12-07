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

    const name = skillMeta.name?.toLowerCase();
    const tab = skillMeta.tab ?? '';
    const isToggleActiveLocal = (key) => characterState?.activeStates?.[key] === true;

    if (tab === 'normalAttack') skillMeta.skillType = 'basic';
    if (tab === 'resonanceSkill') skillMeta.skillType = 'skill';

    const excessEr = mergedBuffs.energyRegen ?? 0;
    const bonusCr = Math.min(excessEr * .5, 80);
    const bonusCd = Math.min(excessEr, 160);
    if (tab === 'resonanceLiberation') {
        skillMeta.skillType = 'ultimate';
        skillMeta.skillCritRate = (skillMeta.skillCritRate ?? 0) + bonusCr;
        skillMeta.skillCritDmg = (skillMeta.skillCritDmg ?? 0) + bonusCd;
        skillMeta.scaling = { atk: 0, hp: 0, def: 1, energyRegen: 0 };
    }

    const dmgVuln = Math.min(excessEr * 0.25, 40);
    if (isToggleActiveLocal('interferedMarker')) mergedBuffs.attribute.all.dmgVuln += dmgVuln;

    if (name.includes('tune rupture') && tab === 'forteCircuit') skillMeta.skillType = 'tuneRupture';

    if (name.includes('boundedness')) {
        skillMeta.multiplier = 1.5
        skillMeta.visible = characterLevel >= 70;
    }

    if (name.includes('high syntony field')) skillMeta.multiplier *= 1.4;

    if (isActiveSequence(2) && isToggleActive(2) && !mergedBuffs.__mornyeS2) {
        mergedBuffs.critRate = Math.min(excessEr * 0.1875, 30);
        mergedBuffs.__mornyeS2 = true;
    }
    if (isActiveSequence(4) && name.includes('high syntony field'))
        skillMeta.skillHealingBonus = (skillMeta.skillHealingBonus ?? 0) + 30;

    if (isActiveSequence(5)) {
        if (name.includes('tune rupture') && tab === 'forteCircuit') skillMeta.multiplier *= 2.6;
        if (tab === 'resonanceLiberation') skillMeta.multiplier *= 1.4;
    }
    if (tab === 'resonanceLiberation' && isActiveSequence(6)) {
        skillMeta.multiplier += 4*2;
    }

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
            name: 'Skill DMG',
            scaling: { atk: 0, hp: 0, def: 1, energyRegen: 0 },
            Param: [
                [
                    "262.73%+400%*2",
                    "284.27%+400%*2",
                    "305.82%+400%*2",
                    "335.98%+400%*2",
                    "357.52%+400%*2",
                    "382.30%+400%*2",
                    "416.77%+400%*2",
                    "451.24%+400%*2",
                    "485.70%+400%*2",
                    "522.33%+400%*2",
                    "565.42%+400%*2",
                    "608.50%+400%*2",
                    "651.59%+400%*2",
                    "694.68%+400%*2",
                    "737.76%+400%*2",
                    "780.85%+400%*2",
                    "823.94%+400%*2",
                    "867.02%+400%*2",
                    "910.11%+400%*2",
                    "953.20%+400%*2"
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

    const dmgVuln = Math.min((state.mornyeER ?? 0) * 0.25, 40);

    mergedBuffs.attribute.all.dmgVuln += state.interferedMarker ? dmgVuln : 0;

    mergedBuffs.attribute.all.amplify += state.recursion ? 25 : 0;

    mergedBuffs.def.percent += state.highSyntony ? 20 : 0;

    const cr = Math.min((state.mornyeER ?? 0) * 0.1875, 30);
    mergedBuffs.critRate += state.entropicMorning ? cr : 0;

    return { mergedBuffs };
}