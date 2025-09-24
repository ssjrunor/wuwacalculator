import {elementToAttribute} from "../../utils/attributeHelpers.js";

export function applyCartethyiaLogic({
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
        amplify: skillMeta?.amplify ?? 0
    };
    skillMeta.scaling = { atk: 0, hp: 1, def: 0, energyRegen: 0 };

    const name = skillMeta.name?.toLowerCase();
    const tab = skillMeta.tab ?? '';

    if (tab === 'normalAttack') {
        if (name.includes('mid-air')) {
            skillMeta.skillType = ['basic', 'aeroErosion'];
        } else {
            skillMeta.skillType = ['basic'];
        }
    } else if (tab === 'forteCircuit' || tab === 'resonanceSkill') {
        skillMeta.skillType = ['basic'];
        if (name === 'sword to answer waves\' call dmg' || name === 'may tempest break the tides dmg') {
            skillMeta.skillType = ['skill'];
        } else if (name.includes('heavy attack')) {
            skillMeta.skillType = ['heavy'];
        }
    }

    if (characterLevel >= 70 && tab.includes('o')) {
        const stacks = combatState.aeroErosion ?? 0;
        let bonus = 0;

        if (stacks >= 1 && stacks <= 3) {
            bonus = 30;
        } else if (stacks >= 4) {
            bonus = Math.min(10 * stacks, 60);
        }

        skillMeta.skillDmgBonus = (skillMeta.skillDmgBonus ?? 0) + bonus;
    }

    if (tab === 'resonanceLiberation') {
        skillMeta.amplify = (skillMeta.amplify ?? 0) + Math.min(combatState.aeroErosion * 20, 100);
    }

    if (characterState?.activeStates?.divinity && characterState?.activeStates?.manifestActive && !mergedBuffs.__divinity) {
        mergedBuffs.damageTypeAmplify.aeroErosion = (mergedBuffs.damageTypeAmplify.aeroErosion ?? 0) + 50;
        mergedBuffs.__divinity = true;
    }

    const seq1Value = (characterState?.toggles?.['1_value'] ?? 0) / 30;
    if (isActiveSequence(1) && seq1Value > 0) {
        if (!mergedBuffs.__cartethyiaSeq1) {
            mergedBuffs.critDmg = (mergedBuffs.critDmg ?? 0) + (seq1Value * 25);
            mergedBuffs.__cartethyiaSeq1 = true;
        }
    } else {
        mergedBuffs.__cartethyiaSeq1 = false;
    }

    if (isActiveSequence(2)) {
        if (tab === 'normalAttack' && name !== 'heavy attack dmg' && !name.includes('plunging')) {
            skillMeta.multiplier *= 1.5;
        } else if (tab === 'introSkill') {
            skillMeta.multiplier *= 1.5;
        } else if (tab === 'normalAttack' && name === 'plunging attack') {
            skillMeta.multiplier *= 3;
        }
    }

    if (isActiveSequence(3) && tab === 'resonanceLiberation') {
        skillMeta.multiplier *= 2;
    }

    if (isToggleActive(4) && isActiveSequence(4)) {
        if (!mergedBuffs.__cartethyiaSeq4) {
            for (const elem of Object.values(elementToAttribute)) {
                mergedBuffs[elem] = (mergedBuffs[elem] ?? 0) + 20;
            }
            mergedBuffs.__cartethyiaSeq4 = true;
        }
    } else {
        mergedBuffs.__cartethyiaSeq4 = false;
    }

    if (isActiveSequence(6)) {
        if (!mergedBuffs.__cartethyiaSeq6) {
            mergedBuffs.dmgReduction = (mergedBuffs.dmgReduction ?? 0) + 40;
            mergedBuffs.__cartethyiaSeq6 = true;
        }
    } else {
        mergedBuffs.__cartethyiaSeq6 = false;
    }

    if (name.includes('hope reshaped')) {
        skillMeta.multiplier = 0.2;
        skillMeta.visible = isActiveSequence(4);
    }

    return { mergedBuffs, combatState, skillMeta };
}

export const cartethyiaMultipliers = {
    normalAttack: [
        {
            name: 'Hope Reshaped in Storms Shield',
            scaling: { hp: 1 },
            shielding: true
        }
    ]
};

export function cartBuffsLogic({
                                      mergedBuffs, characterState, combatState
                                  }) {
    const state = characterState?.activeStates ?? {};

    if (state.wishes) {
        mergedBuffs.healingBonus = (mergedBuffs.healingBonus ?? 0) + 20;
    }

    if (state.sacrifice) {
        for (const elem of Object.values(elementToAttribute)) {
            mergedBuffs[elem] = (mergedBuffs[elem] ?? 0) + 20;
        }
    }

    if (state.blessing && (combatState.aeroErosion > 0 || combatState.spectroFrazzle > 0)) {
        mergedBuffs.elementDmgAmplify.aero = (mergedBuffs.elementDmgAmplify.aero ?? 0) + 17.5;
    }

    return { mergedBuffs };
}