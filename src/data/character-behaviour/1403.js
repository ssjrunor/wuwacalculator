export function applyAaltoLogic({
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

    if (name.includes('mist avatar hp')) skillMeta.visible = false;

    if (name.includes('gate of quandary atk increase')) skillMeta.visible = false;

    if (tab === 'forteCircuit')

    if (name.includes('aimed')) skillMeta.skillType = 'heavy';

    if (isToggleActiveLocal('inherent1') && skillMeta.skillType === 'heavy') {
        skillMeta.critRateBonus = (skillMeta.critRateBonus ?? 0) + 999999;
    }

    if (characterState?.activeStates?.quandary && !mergedBuffs.__aaltoQuandary) {
        mergedBuffs.atkPercent = (mergedBuffs.atkPercent ?? 0) + 10;
        mergedBuffs.__aaltoQuandary = true;
    }

    if (isToggleActive(2) && isActiveSequence(2) && !mergedBuffs.__aaltoS2) {
        mergedBuffs.atkPercent = (mergedBuffs.atkPercent ?? 0) + 15;
        mergedBuffs.__aaltoS2 = true;
    }

    if (name.includes('hazey transition')) {
        skillMeta.skillType = 'basic';
        skillMeta.multiplier /= 2;
        skillMeta.visible = isActiveSequence(3);
    }

    if (isActiveSequence(4) && name.includes('mist bullets')) {
        skillMeta.skillDmgBonus = (skillMeta.skillDmgBonus ?? 0) + 30;
    }

    if (isActiveSequence(5) && !mergedBuffs.__aaltoS5 && isToggleActive(5)) {
        mergedBuffs.aero = (mergedBuffs.aero ?? 0) + 25;
        mergedBuffs.__aaltoS5 = true;
    }

    if (isActiveSequence(5) && isToggleActive(6)) {
        if (!mergedBuffs.__aaltoS6) {
            mergedBuffs.critRate = (mergedBuffs.critRate ?? 0) + 8;
            mergedBuffs.__aaltoS6 = true;
        }

        if (skillMeta.skillType === 'heavy') {
            skillMeta.skillDmgBonus = (skillMeta.skillDmgBonus ?? 0) + 50;
        }
    }

    return {mergedBuffs, combatState, skillMeta};
}

export const aaltoMultipliers = {
    normalAttack: [
        {
            name: "Hazey Transition: Stage 1 DMG",
            scaling: { atk: 1 },
            Param : [
                [
                    "16%",
                    "17.32%",
                    "18.63%",
                    "20.47%",
                    "21.78%",
                    "23.29%",
                    "25.39%",
                    "27.48%",
                    "29.58%",
                    "31.81%",
                    "34.44%",
                    "37.06%",
                    "39.69%",
                    "42.31%",
                    "44.93%",
                    "47.56%",
                    "50.18%",
                    "52.81%",
                    "55.43%",
                    "58.05%"
                ]
            ]
        },
        {
            name: "Hazey Transition: Stage 2 DMG",
            scaling: { atk: 1 },
            Param : [
                [
                    "26.67%",
                    "28.86%",
                    "31.04%",
                    "34.11%",
                    "36.29%",
                    "38.81%",
                    "42.31%",
                    "45.8%",
                    "49.3%",
                    "53.02%",
                    "57.39%",
                    "61.77%",
                    "66.14%",
                    "70.51%",
                    "74.89%",
                    "79.26%",
                    "83.63%",
                    "88.01%",
                    "92.38%",
                    "96.75%"
                ]
            ]
        },
        {
            name: "Hazey Transition: Stage 3 DMG",
            scaling: { atk: 1 },
            Param : [
                [
                    "24%*2",
                    "25.97%*2",
                    "27.94%*2",
                    "30.7%*2",
                    "32.66%*2",
                    "34.93%*2",
                    "38.08%*2",
                    "41.22%*2",
                    "44.37%*2",
                    "47.72%*2",
                    "51.66%*2",
                    "55.59%*2",
                    "59.53%*2",
                    "63.46%*2",
                    "67.4%*2",
                    "71.34%*2",
                    "75.27%*2",
                    "79.21%*2",
                    "83.14%*2",
                    "87.08%*2"
                ]
            ]
        },
        {
            name: "Hazey Transition: Stage 4 DMG",
            scaling: { atk: 1 },
            Param : [
                [
                    "25.34%*2",
                    "27.42%*2",
                    "29.49%*2",
                    "32.4%*2",
                    "34.48%*2",
                    "36.87%*2",
                    "40.19%*2",
                    "43.51%*2",
                    "46.84%*2",
                    "50.37%*2",
                    "54.52%*2",
                    "58.68%*2",
                    "62.83%*2",
                    "66.99%*2",
                    "71.14%*2",
                    "75.3%*2",
                    "79.45%*2",
                    "83.61%*2",
                    "87.76%*2",
                    "91.92%*2"
                ]
            ]
        },
        {
            name: "Hazey Transition: Stage 5 DMG",
            scaling: { atk: 1 },
            Param : [
                [
                    "90.4%",
                    "97.82%",
                    "105.23%",
                    "115.61%",
                    "123.02%",
                    "131.55%",
                    "143.41%",
                    "155.27%",
                    "167.13%",
                    "179.73%",
                    "194.55%",
                    "209.38%",
                    "224.21%",
                    "239.03%",
                    "253.86%",
                    "268.68%",
                    "283.51%",
                    "298.33%",
                    "313.16%",
                    "327.99%"
                ]
            ]
        },
        {
            name: "Hazey Transition: Mid-air Attack",
            scaling: { atk: 1 },
            Param : [
                [
                    "30%",
                    "32.46%",
                    "34.92%",
                    "38.37%",
                    "40.83%",
                    "43.66%",
                    "47.59%",
                    "51.53%",
                    "55.47%",
                    "59.65%",
                    "64.57%",
                    "69.49%",
                    "74.41%",
                    "79.33%",
                    "84.25%",
                    "89.17%",
                    "94.09%",
                    "99.01%",
                    "103.93%",
                    "108.85%"
                ]
            ]
        }
    ]
};

export function aaltoBuffsLogic({
                                    mergedBuffs, characterState, activeCharacter
                                }) {
    const state = characterState?.activeStates ?? {};
    const elementMap = {
        1: 'glacio',
        2: 'fusion',
        3: 'electro',
        4: 'aero',
        5: 'spectro',
        6: 'havoc'
    };
    const element = elementMap?.[activeCharacter?.attribute];

    if (state.dissolving) {
        mergedBuffs.elementDmgAmplify.aero = (mergedBuffs.elementDmgAmplify.aero ?? 0) + 23;
    }

    return { mergedBuffs };
}