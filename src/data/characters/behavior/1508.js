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

    if (tab === 'forteCircuit') skillMeta.skillType = 'ultimate';
    if (name.includes('death snip')) skillMeta.skillType = 'ultimate';

    if (name === 'bonus dmg multiplier per ring of chainsaw') {
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
        mergedBuffs.attribute.all.defIgnore += 18;
        mergedBuffs.__threadOfBane = true
    }

    if (characterState.activeStates.myriadConvergence && (name.includes('sawring - blitz') ||
        name.includes('sawring - eradication') ||
        name.includes('ring of chainsaw')) && !name.includes('shield'))
        skillMeta.multiplier *= 2.2;

    if (isToggleActiveLocal('inherent2') && !mergedBuffs.__chisaInherent2) {
        mergedBuffs.healingBonus += 20;
        mergedBuffs.attribute.havoc.dmgBonus += 20;
        mergedBuffs.__chisaInherent2 = true;
    }

    if (isActiveSequence(1) && !mergedBuffs.__chisaS1 && isToggleActive(1)) {
        mergedBuffs.atk.percent += 30;
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

    if (isActiveSequence(2) && !mergedBuffs.__chisaS21) {
        mergedBuffs.attribute.havoc.resShred += 10;
        if (!mergedBuffs.__chisaS2 && characterState.activeStates.threadOfBane) {
            mergedBuffs.attribute.all.dmgBonus += 50;
            mergedBuffs.__chisaS2 = true;
        }
        mergedBuffs.__chisaS21 = true;
    }

    if (isActiveSequence(3) && (name.includes('sawring - blitz') ||
        name.includes('sawring - eradication') ||
        name.includes('ring of chainsaw')) && !name.includes('shield'))
        skillMeta.multiplier *= 2.2;

    if(isActiveSequence(5) && tab === 'resonanceLiberation') skillMeta.skillDmgBonus = (skillMeta.skillDmgBonus ?? 0) + 100;

    if (isActiveSequence(6) && isToggleActive(6) && !mergedBuffs.__chisaS6) {
        mergedBuffs.attribute.all.dmgVuln += 40;
        for (const status in negativeStatus) {
            mergedBuffs.skillType[negativeStatus[status]].dmgVuln += 30;
        }
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

    if (state.threadOfBane) {
        mergedBuffs.attribute.all.defIgnore += 18;
    }

    if (state.endlessBonds && state.threadOfBane) {
        mergedBuffs.attribute.all.dmgBonus += 50;
    }

    for (const i in negativeStatus) {
        mergedBuffs.skillType[negativeStatus[i]].dmgVuln += (state.risingDawn ? 30 : 0);
    }

    return { mergedBuffs };
}