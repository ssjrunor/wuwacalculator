import {elementToAttribute} from "../../utils/attributeHelpers.js";

export function applyGalbrenaLogic({
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

    const isToggleActiveLocal = (key) => characterState?.activeStates?.[key] === true;
    const name = skillMeta.name?.toLowerCase();
    const tab = skillMeta.tab ?? '';

    const isEcho = [
        'basic attack stage 4',
        'Basic Attack - Seraphic Execution Stage 4',
        'Basic Attack - Seraphic Execution Stage 5',
        'Heavy Attack - Flamewing Verdict Stage 3',
        'Resonance Liberation - Hellfire Absolution'
    ].some(n => name.includes(n.toLowerCase()));

    if (tab === 'normalAttack' || tab === 'forteCircuit') {
        skillMeta.skillType = 'heavy';
    }

    if (isEcho) {
        skillMeta.skillType = 'echoSkill';
    }

    if (characterState?.activeStates?.demonHypostasis && (tab === 'forteCircuit' && !name.includes('resonance skill'))) {
        skillMeta.multiplier *= 1.85;
    }

    if ( characterState?.activeStates?.demonHypostasis && tab === 'forteCircuit' ) {
        const bonus = Math.min((characterState?.activeStates?.afterflame ?? 0) * 1.5, 60);
        skillMeta.skillDmgBonus = (skillMeta.skillDmgBonus ?? 0) + bonus;
    }

    if (characterState?.activeStates?.burningDrive && !mergedBuffs.__burningDrive) {
        mergedBuffs.atkPercent = (mergedBuffs.atkPercent ?? 0) + 20;
        mergedBuffs.__burningDrive = true;
    }

    if ( !tab.includes('echoAttacks' ) ) {
        const bonus = Math.min((characterState?.activeStates?.oathbound ?? 0) * 5, 5 * 4);
        skillMeta.amplify = (skillMeta.amplify ?? 0) + bonus;
    }

    if ( isActiveSequence(1) && isToggleActive(1) && characterState?.activeStates?.demonHypostasis && tab === 'forteCircuit' ) {
        const bonus = Math.min((characterState?.activeStates?.afterflame ?? 0) * 2, 80);
        skillMeta.skillCritDmg = (skillMeta.skillCritDmg ?? 0) + bonus;
    }

    if (isActiveSequence(2) && isToggleActive(2) && !mergedBuffs.__galbrenaS2) {
        mergedBuffs.atkPercent = (mergedBuffs.atkPercent ?? 0) + 350;
        mergedBuffs.__galbrenaS2 = true;
    }

    if (isActiveSequence(3) && name.includes('resonance liberation - hellfire absolution')) {
        skillMeta.multiplier *= 2.3;
    }

    if (isActiveSequence(4) && isToggleActive(4) && !mergedBuffs.__galbrenaS4) {
        for (const elem of Object.values(elementToAttribute)) {
            mergedBuffs[elem] = (mergedBuffs[elem] ?? 0) + 20;
        }
        mergedBuffs.__galbrenaS4 = true;
    }

    if ( isActiveSequence(5) && name.includes('resonance skill')) {
        skillMeta.multiplier *= 2.5;
    }

    if ( isActiveSequence(6)) {
        if (!name.includes('resonance skill') && tab === 'forteCircuit') {
            skillMeta.multiplier *= 1.6;
        }

        if ( isToggleActive(6) && characterState?.activeStates?.demonHypostasis && tab === 'forteCircuit' ) {
            const bonus = Math.min((characterState?.activeStates?.afterflame ?? 0) * 0.625, 25);
            skillMeta.amplify = (skillMeta.amplify ?? 0) + bonus;
        }
    }

    if ( name.includes('ashen pursuit dmg')) {
        skillMeta.multiplier = (79.5*3+556.5)/100;
    }

    if ( name.includes('outro skill dmg')) {
        skillMeta.visible = false;
    }

    return {mergedBuffs, combatState, skillMeta};
}

export const galbrenaMultipliers = {
    outroSkill: [
        {
            name: 'Ashen Pursuit DMG',
            scaling: { atk: 1},
        }
    ]
};

export function GalbrenaBuffsLogic({
                                    mergedBuffs, characterState,
                                }) {
    const state = characterState?.activeStates ?? {};

    if (state.fadingSpark) {
        for (const elem of Object.values(elementToAttribute)) {
            mergedBuffs[elem] = (mergedBuffs[elem] ?? 0) + 20;
        }
    }

    return { mergedBuffs };
}