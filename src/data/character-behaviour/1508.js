import {elementToAttribute} from "../../utils/attributeHelpers.js";

const negativeStatus = [
    'aeroErosion',
    'spectroFrazzle',
    'havocBane',
    'electroFlare'
]

export function applyChisaLogic({
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
    //const havocBane = combatState.havocBane ?? 0;

    if (tab === 'forteCircuit') skillMeta.skillType = 'ultimate';
    if (name.includes('death snip')) skillMeta.skillType = 'ultimate';

    if (name === 'additional multiplier from ring of chainsaw per point') {
        characterState.activeStates.__ringOfChainsaw = skillMeta.multiplier;
        skillMeta.visible = false;
    }

    if (name.includes('sawring - eradication dmg')) {
        const stacks = characterState?.activeStates?.ringOfChainsaw ?? 0;
        const perStack = characterState.activeStates.__ringOfChainsaw ?? 0;

        const bonusMultiplier = Math.min(stacks * perStack, perStack * 100);
        skillMeta.multiplier += bonusMultiplier;
    }

    if (!mergedBuffs.__threadOfBane && characterState.activeStates.threadOfBane) {
        //const bonusDefIgnore = Math.min(havocBane * 3, 18);
        mergedBuffs.enemyDefIgnore = (mergedBuffs.enemyDefIgnore ?? 0) + 18;
        mergedBuffs.__threadOfBane = true
    }

    if (characterState.activeStates.myriadConvergence && (name.includes('sawring - blitz') ||
        name.includes('sawring - eradication') ||
        name.includes('ring of chainsaw')) && !name.includes('shield'))
        skillMeta.multiplier *= 2.2;

    if (isToggleActiveLocal('inherent2') && !mergedBuffs.__chisaInherent2) {
        mergedBuffs.healingBonus = (mergedBuffs.healingBonus ?? 0) + 20;
        mergedBuffs.havoc = (mergedBuffs.havoc ?? 0) + 20;
        mergedBuffs.__chisaInherent2 = true;
    }

    if (isActiveSequence(1) && !mergedBuffs.__chisaS1 && isToggleActive(1)) {
        mergedBuffs.atkPercent = (mergedBuffs.atkPercent ?? 0) + 30;
        mergedBuffs.__chisaS1 = true;
    }

    if (name.includes('unseen snare execution dmg')) {
        const fixedDmg = 61803;
        const enemyHp = characterState?.activeStates?.chisaSeq1EnemyHP ?? 0;
        if (enemyHp > 100_000) {
            skillMeta.fixedDmg = fixedDmg;
        } else {
            const calculatedDmg = enemyHp * 0.61803;
            skillMeta.fixedDmg = (calculatedDmg > fixedDmg) ? fixedDmg : calculatedDmg;
            skillMeta.visible = enemyHp > 0 && isActiveSequence(1);
        }
    }

    if (isActiveSequence(2)) {
        skillMeta.skillResIgnore = (skillMeta.skillResIgnore ?? 0) + (skillMeta.element === 'havoc' ? 10 : 0);
        if (!mergedBuffs.__chisaS2 && characterState.activeStates.threadOfBane) {
            for (const elem of Object.values(elementToAttribute)) {
                mergedBuffs[elem] = (mergedBuffs[elem] ?? 0) + 50;
            }
            mergedBuffs.__chisaS2 = true;
        }
    }

    if (isActiveSequence(3) && (name.includes('sawring - blitz') ||
        name.includes('sawring - eradication') ||
        name.includes('ring of chainsaw')) && !name.includes('shield'))
        skillMeta.multiplier *= 2.2;

    if(isActiveSequence(5) && tab === 'resonanceLiberation') skillMeta.skillDmgBonus = (skillMeta.skillDmgBonus ?? 0) + 100;

    if (isActiveSequence(6) && isToggleActive(6) && !mergedBuffs.__chisaS6) {
        mergedBuffs.dmgReduction = (mergedBuffs.dmgReduction ?? 0) + 30;
        mergedBuffs.negativeStatus.dmgReduction = (mergedBuffs.negativeStatus?.dmgReduction ?? 0) + 30;
        mergedBuffs.__chisaS6 = true;
    }

    return {mergedBuffs, combatState, skillMeta};
}

export const chisaMultipliers = {
    normalAttack: [
        {
            name: "Death Snip Healing",
            scaling: { Atk: 1 },
            healing: true
        }
    ],
    forteCircuit: [
        {
            name: "Sawring - Eradication Shield",
            scaling: { Atk: 1 },
            shielding: true
        },
        {
            name: "S1: Unseen Snare Execution DMG",
            scaling: { Atk: 1 }
        }
    ],
    resonanceLiberation: [
        {
            name: "Healing",
            scaling: { atk: 1 },
            healing: true
        }
    ]
};


export function chisaBuffsLogic({
                                   mergedBuffs, characterState, combatState
                               }) {
    const state = characterState?.activeStates ?? {};
    //const havocBane = combatState.havocBane ?? 0;

    if (state.threadOfBane) {
        //const bonusDefIgnore = Math.min(havocBane * 3, 18);
        mergedBuffs.enemyDefIgnore = (mergedBuffs.enemyDefIgnore ?? 0) + 18;
    }

    if (state.endlessBonds && state.threadOfBane) {
        for (const elem of Object.values(elementToAttribute)) {
            mergedBuffs[elem] = (mergedBuffs[elem] ?? 0) + 50;
        }
    }
    mergedBuffs.negativeStatus.dmgReduction = (mergedBuffs.negativeStatus?.dmgReduction ?? 0) +
        (state.risingDawn ? 30 : 0)


    return { mergedBuffs };
}