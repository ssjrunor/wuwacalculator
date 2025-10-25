import {elementToAttribute} from "../../utils/attributeHelpers.js";

export function applyBulingLogic({
                                   mergedBuffs,
                                   combatState,
                                   skillMeta,
                                   characterState,
                                   isActiveSequence = () => false,
                                      isToggleActive = () => false,
                                      characterLevel = 1,
                                      finalStats
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

    if (tab === 'forteCircuit') skillMeta.skillType = 'ultimate'


    if (characterState?.activeStates?.yinAndYang && !mergedBuffs.__yinAndYang) {
        mergedBuffs.resonanceSkill = (mergedBuffs.resonanceSkill ?? 0) + 10;
        mergedBuffs.__yinAndYang = true;
    }

    if (characterState?.activeStates?.heavenEarthMind && !mergedBuffs.__heavenEarthMind) {
        mergedBuffs.resonanceSkill = (mergedBuffs.resonanceSkill ?? 0) + 30;
        mergedBuffs.__heavenEarthMind = true;
    }

    if (characterState?.activeStates?.exorcistInCommand && !mergedBuffs.__exorcistInCommand) {
        for (const elem of Object.values(elementToAttribute)) {
            mergedBuffs.elementDmgAmplify[elem] = (mergedBuffs.elementDmgAmplify[elem] ?? 0) + 15;
        }
        mergedBuffs.__exorcistInCommand = true;
    }

    if (isToggleActiveLocal('inherent1') && !mergedBuffs.__bulingInherent1) {
        mergedBuffs.healingBonus = (mergedBuffs.healingBonus ?? 0) + 25;
        mergedBuffs.__bulingInherent1 = true;
    }

    if (isActiveSequence(1) && !mergedBuffs.__bulingS1 && isToggleActive(1)) {
        mergedBuffs.critRate = (mergedBuffs.critRate ?? 0) + 20;
        mergedBuffs.__bulingS1 = true;
    }

    if (name.includes('blessed by fortune healing')) skillMeta.visible = isActiveSequence(4);

    if (isActiveSequence(6) &&
        !mergedBuffs.__bulingS6 &&
        isToggleActive(6) && characterState?.activeStates?.heavenEarthMind) {
        mergedBuffs.resonanceSkill = (mergedBuffs.resonanceSkill ?? 0) + 55;
        mergedBuffs.__bulingS6 = true;
    }

    if (name.includes('exorcist in command')) skillMeta.multiplier = 0.18;

    return {mergedBuffs, combatState, skillMeta};
}

export const bulingMultipliers = {
    normalAttack: [
        {
            name: "Heavy Attack - Twin Mountains Healing",
            scaling: { atk: 1 },
            healing: true
        },
        {
            name: "Heavy Attack - Twin Thunders Healing",
            scaling: { atl: 1 },
            healing: true
        }
    ],
    outroSkill: [
        {
            name: " Healing",
            scaling: { atk: 1 },
            healing: true
        }
    ],
    introSkill: [
        {
            name: "Skill Healing",
            scaling: { atk: 1 },
            healing: true
        }
    ],
    forteCircuit: [
        {
            name: "S4: Wanderer of Solaris, Blessed by Fortune Healing",
            scaling: { atk: 1 },
            healing: true,
            Param: [
                Array(20).fill("350 + 150%")
            ]
        }
    ]
};


export function bulingBuffsLogic({
                                   mergedBuffs, characterState
                               }) {
    const state = characterState?.activeStates ?? {};

    mergedBuffs.resonanceSkill = (mergedBuffs.resonanceSkill ?? 0) + (state.yinAndYang ? 10 : 0);
    mergedBuffs.resonanceSkill = (mergedBuffs.resonanceSkill ?? 0) + (state.heavenEarthMind ? 30 : 0);

    if (state.exorcistInCommand) {
        for (const elem of Object.values(elementToAttribute)) {
            mergedBuffs.elementDmgAmplify[elem] = (mergedBuffs.elementDmgAmplify[elem] ?? 0) + 15;
        }
    }

    mergedBuffs.resonanceSkill = (mergedBuffs.resonanceSkill ?? 0) +
    ((state.almightyCelestialLord && state.heavenEarthMind) ? 55 : 0);

    return { mergedBuffs };
}