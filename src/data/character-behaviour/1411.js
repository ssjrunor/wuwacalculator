import {elementToAttribute} from "../../utils/attributeHelpers.js";

export function applyQYLogic({
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

    if (tab === 'forteCircuit' || tab === 'introSkill' || name.includes('dodge counter')) {
        skillMeta.skillType = 'heavy';
    } else if (tab === 'resonanceLiberation' || tab === 'resonanceSkill' || tab === 'outroSkill') {
        skillMeta.skillType = 'echoSkill';
    }

    if (name.includes('strike before ready')) {
        skillMeta.multiplier = 1;
    }

    const inherent1 = [
        'Thus Spoke the Blade: To Teach',
        'Thus Spoke the Blade: To Save',
        'Thus Spoke the Blade: To Sacrifice'
    ].some(n => name.includes(n.toLowerCase()));

    if (isToggleActiveLocal('inherent1') && inherent1) {
        skillMeta.skillDmgTaken = (skillMeta.skillDmgTaken ?? 0) + 50;
    }

    if (isToggleActiveLocal('inherent2') && !mergedBuffs.__qyInherent2) {
        mergedBuffs.atkPercent = (mergedBuffs.atkPercent ?? 0) + 10;
        mergedBuffs.__qyInherent2 = true;
    }

    let critDmg = 0;

    if (mergedBuffs.critRate + 5 > 50) {
        critDmg = (mergedBuffs.critRate + 5 - 50) * 2;

        if (critDmg > 30) {
            critDmg = 30;
        }
    }

    if (characterState?.activeStates?.sunderingStrike && !mergedBuffs.__sunderingStrike) {
        mergedBuffs.critDmg = (mergedBuffs.critDmg ?? 0) + critDmg;
        mergedBuffs.__sunderingStrike = true;
    }

    if (characterState?.activeStates?.bambooShade && !mergedBuffs.__bambooShade) {
        mergedBuffs.echoSkill = (mergedBuffs.echoSkill ?? 0) + 30;
        mergedBuffs.__bambooShade = true;
    }

    if (isActiveSequence(1) && !mergedBuffs.__qyS1) {
        mergedBuffs.critRate = (mergedBuffs.critRate ?? 0) + 20;
        mergedBuffs.__qyS1 = true;
    }

    if (isActiveSequence(2) && characterState?.activeStates?.bambooShade && !mergedBuffs.__qyS2) {
        mergedBuffs.damageTypeAmplify.echoSkill = (mergedBuffs.damageTypeAmplify.echoSkill ?? 0) + 30;
        mergedBuffs.__qyS2 = true;
    }

    if (isActiveSequence(3)) {
        if (tab === 'resonanceLiberation') {
            skillMeta.multiplier += 5;
        }

        if (isToggleActive(3) && inherent1) {
            skillMeta.multiplier += 6;
        }
    }

    if (name.includes('straw cape in dizzy rain')) {
        skillMeta.multiplier = 5;
        skillMeta.visible = isActiveSequence(3);
        skillMeta.skillType = 'echoSkill';
    }

    if (name.includes('sheath fallen, new shoots revealed')) {
        skillMeta.multiplier = 5;
        skillMeta.visible = isActiveSequence(3);
    }

    if (isActiveSequence(4) && !mergedBuffs.__qyS4) {
        mergedBuffs.atkPercent = (mergedBuffs.atkPercent ?? 0) + 20;
        mergedBuffs.__qyS4 = true;
    }

    if (isActiveSequence(5) && !mergedBuffs.__qyS5) {
        mergedBuffs.enemyDefIgnore = (mergedBuffs.enemyDefIgnore ?? 0) + 15;
        mergedBuffs.__qyS5 = true;
    }

    if (name.includes('inksplash of mind dmg')) {
        skillMeta.multiplier = 6;
        skillMeta.visible = isActiveSequence(6);
        skillMeta.skillType = 'echoSkill';
    }

    if (isActiveSequence(6) && isToggleActive(6) && !mergedBuffs.__qyS6) {
        mergedBuffs.critDmg = (mergedBuffs.critDmg ?? 0) + 100;
        mergedBuffs.__qyS6 = true;
    }

    return {mergedBuffs, combatState, skillMeta};
}

export const qyMultipliers = {
    resonanceSkill: [
        {
            name: "O Blade, I, Who Save No More: Straw Cape In Dizzy Rain DMG",
            scaling: { atk: 1 },
        }
    ],
    forteCircuit: [
        {
            name: "Thus I Heard, Thus I Saw, Thus I Spoke: Inksplash of Mind DMG",
            scaling: { atk: 1 },
        }
    ],
    outroSkill: [
        {
            name: "Strike Before Ready DMG",
            scaling: { atk: 1 },
        },
        {
            name: "O Blade, I, Who Save No More: Sheath Fallen, New Shoots Revealed DMG",
            scaling: { atk: 1 },
        }
    ]
};

export function QYBuffsLogic({
                                    mergedBuffs, characterState,
                                }) {
    const state = characterState?.activeStates ?? {};
    const critDmg = Math.min((state.sunderingCr ?? 0) * 2, 30);

    if (state.strikeBeforeReady) {
        mergedBuffs.damageTypeAmplify.echoSkill = (mergedBuffs.damageTypeAmplify.echoSkill ?? 0) + 50;
    }

    if (state.sunderingStrike) {
        mergedBuffs.critDmg = (mergedBuffs.critDmg ?? 0) + critDmg;
    }

    if (state.bambooShade) {
        mergedBuffs.echoSkill = (mergedBuffs.echoSkill ?? 0) + 30;
    }

    if (state.bambooShade && state.qiuyuanS2) {
        mergedBuffs.damageTypeAmplify.echoSkill = (mergedBuffs.damageTypeAmplify.echoSkill ?? 0) + 30;
    }

    return { mergedBuffs };
}

/*
export function QYSkillMetaBuffsLogic({
                                 characterState, skillMeta,
                             }) {
    const state = characterState?.activeStates ?? {};
    const skillType = skillMeta?.skillType;

    if (state.qiuyuanS6 && skillType.includes('echoSkill')) {
        skillMeta.skillResIgnore = (skillMeta.skillResIgnore ?? 0) + 10;
    }

    return { skillMeta };
}

*/
