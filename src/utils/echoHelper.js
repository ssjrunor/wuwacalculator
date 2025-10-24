import {getWeight, getWeightObj} from "../constants/charStatWeights.js";

export const formatStatKey = (key) => {
    const labelMap = {
        atkPercent: 'ATK', atkFlat: 'ATK',
        hpPercent: 'HP', hpFlat: 'HP',
        defPercent: 'DEF', defFlat: 'DEF',
        critRate: 'Crit Rate', critDmg: 'Crit DMG',
        energyRegen: 'Energy Regen', healingBonus: 'Healing Bonus',
        basicAtk: 'Basic Attack DMG Bonus',
        heavyAtk: 'Heavy Attack DMG Bonus', resonanceSkill: 'Resonance Skill DMG Bonus',
        resonanceLiberation: 'Resonance Liberation DMG Bonus',
        aero: 'Aero DMG Bonus', spectro: 'Spectro DMG Bonus', fusion: 'Fusion DMG Bonus',
        glacio: 'Glacio DMG Bonus', havoc: 'Havoc DMG Bonus', electro: 'Electro DMG Bonus',
        critValue: 'Crit Value', percentScore: 'Build Score'
    };
    return labelMap[key] ?? key;
};

export const statIconMap = {
    'ATK': '/assets/stat-icons/atk.png',
    'ATK%': '/assets/stat-icons/atk.png',
    'HP': '/assets/stat-icons/hp.png',
    'HP%': '/assets/stat-icons/hp.png',
    'DEF': '/assets/stat-icons/def.png',
    'DEF%': '/assets/stat-icons/def.png',
    'Energy Regen': '/assets/stat-icons/energyregen.png',
    'Crit Rate': '/assets/stat-icons/critrate.png',
    'Crit DMG': '/assets/stat-icons/critdmg.png',
    'Healing Bonus': '/assets/stat-icons/healing.png',
    'Basic Attack DMG Bonus': '/assets/stat-icons/basic.png',
    'Heavy Attack DMG Bonus': '/assets/stat-icons/heavy.png',
    'Resonance Skill DMG Bonus': '/assets/stat-icons/skill.png',
    'Resonance Liberation DMG Bonus': '/assets/stat-icons/liberation.png',
    'Aero DMG Bonus': '/assets/stat-icons/aero.png',
    'Glacio DMG Bonus': '/assets/stat-icons/glacio.png',
    'Spectro DMG Bonus': '/assets/stat-icons/spectro.png',
    'Fusion DMG Bonus': '/assets/stat-icons/fusion.png',
    'Electro DMG Bonus': '/assets/stat-icons/electro.png',
    'Havoc DMG Bonus': '/assets/stat-icons/havoc.png'
};

export const getValidMainStats = (cost) => {
    if (cost === 1) {
        return { hpPercent: 22.8, atkPercent: 18, defPercent: 18 };
    } else if (cost === 3) {
        return {
            hpPercent: 30, atkPercent: 30, defPercent: 38,
            energyRegen: 32,
            aero: 30, glacio: 30, electro: 30, fusion: 30, havoc: 30, spectro: 30
        };
    } else if (cost === 4) {
        return {
            hpPercent: 33, atkPercent: 33, defPercent: 41.5,
            critRate: 22, critDmg: 44, healingBonus: 26
        };
    }
    return {};
};

export const applyFixedSecondMainStat = (mainStats, cost) => {
    const updated = { ...mainStats };

    if (cost === 1) {
        updated.hpFlat = 2280;
    }
    if (cost === 3) {
        updated.atkFlat = 100;
    }
    if (cost === 4) {
        updated.atkFlat = 150;
    }

    return updated;
};

export function formatDescription(rawDesc, paramArray) {
    if (!rawDesc || !Array.isArray(paramArray)) return rawDesc ?? '';

    return rawDesc.replace(/{(\d+)}/g, (_, index) => paramArray[index] ?? `{${index}}`);
}

export function getEchoStatsFromEquippedEchoes(equippedEchoes = []) {
    const echoStats = {};

    for (const echo of equippedEchoes) {
        if (!echo) continue;

        for (const [key, value] of Object.entries(echo.mainStats ?? {})) {
            echoStats[key] = (echoStats[key] ?? 0) + value;
        }

        for (const [key, value] of Object.entries(echo.subStats ?? {})) {
            echoStats[key] = (echoStats[key] ?? 0) + value;
        }
    }

    return echoStats;
}

export const statDisplayOrder = [
    'hpFlat', 'hpPercent',
    'atkFlat', 'atkPercent',
    'defFlat', 'defPercent',
    'critRate', 'critDmg',
    'energyRegen', 'healingBonus',
    'basicAtk', 'heavyAtk', 'skill', 'ultimate',
    'aero', 'glacio', 'spectro', 'fusion', 'electro', 'havoc'
];

export function getSetCounts(equippedEchoes) {
    const counts = {};
    const seenEchoIdsPerSet = {};

    for (const echo of equippedEchoes) {
        const setId = echo?.selectedSet;
        const echoId = echo?.id;

        if (!setId || !echoId) continue;

        if (!seenEchoIdsPerSet[setId]) {
            seenEchoIdsPerSet[setId] = new Set();
        }

        if (!seenEchoIdsPerSet[setId].has(echoId)) {
            seenEchoIdsPerSet[setId].add(echoId);
            counts[setId] = (counts[setId] ?? 0) + 1;
        }
    }

    return counts;
}

export function getSubstatScore(key) {
    const idealScore = validSubstatRanges[key]?.max;
    const substatScore = validSubstatRanges?.critDmg.max;
    return substatScore/idealScore;
}

export function getMainstatScore(key, cost) {
    const idealScore = idealMainScoreMap(cost)[key];
    const substatScore = idealSubScoreMap.critDmg;
    return substatScore/idealScore;
}

const idealSubScoreMap = {
    hpPercent: 30, atkPercent: 30, defPercent: 38,
    critRate: 22, critDmg: 44, energyRegen: 32,
    resonanceLiberation: 30, basicAtk: 30, resonanceSkill: 30, heavyAtk: 30
}

function idealMainScoreMap(cost) {
    if (cost === 1) {
        return {hpPercent: 22.8, atkPercent: 18, defPercent: 18,}
    } else if (cost === 3) {
        return {
            hpPercent: 30,
            atkPercent: 30,
            defPercent: 38,
            aero: 30, glacio: 30, electro: 30, fusion: 30, havoc: 30, spectro: 30,
            energyRegen: 32
        }
    } else {
        return {
            hpPercent: 33, atkPercent: 33, defPercent: 41.5,
            critRate: 22, critDmg: 44
        }
    }
}

export function computeRollForStat(key, value) {
    const spec = validSubstatRanges[key];
    if (!spec) return null;

    const { min, max, divisions } = spec;
    const step = (max - min) / divisions;

    const v = Math.min(Math.max(value, min), max);

    const kFloat = (v - min) / step;
    const k = Math.round(kFloat);

    let grade;

    if (divisions === 7) {
        const MIN_GRADE = 30;
        const MAX_GRADE = 100;
        grade = MIN_GRADE + (k / divisions) * (MAX_GRADE - MIN_GRADE);
    } else if (divisions === 3) {
        const MIN_GRADE = 40;
        grade = MIN_GRADE + k * 20;
    } else {
        grade = (k / divisions) * 100;
    }

    return Number(grade.toFixed(2));
}

export function getRollValue(echo) {
    const out = {};
    for (const [key, value] of Object.entries(echo?.subStats ?? {})) {
        const grade = computeRollForStat(key, value);
        if (grade != null) out[key] = grade;
    }

    return out;
}

export const statLabelMap = {
    atkFlat: 'ATK',
    atkPercent: 'ATK',
    hpFlat: 'HP',
    hpPercent: 'HP',
    defFlat: 'DEF',
    defPercent: 'DEF',
    energyRegen: 'Energy Regen',
    critRate: 'Crit Rate',
    critDmg: 'Crit DMG',
    basicAtk: 'Basic Attack DMG Bonus',
    heavyAtk: 'Heavy Attack DMG Bonus',
    resonanceSkill: 'Resonance Skill DMG Bonus',
    resonanceLiberation: 'Resonance Liberation DMG Bonus',
    aero: 'Aero DMG Bonus',
    glacio: 'Glacio DMG Bonus',
    spectro: 'Spectro DMG Bonus',
    fusion: 'Fusion DMG Bonus',
    electro: 'Electro DMG Bonus',
    havoc: 'Havoc DMG Bonus',
};

const FLAT_TO_PERCENT = {
    atkFlat: 'atkPercent',
    hpFlat: 'hpPercent',
    defFlat: 'defPercent',
};

function resolveScoreValue(key, isSubStat, cost) {
    if (key in FLAT_TO_PERCENT) {
        const pctKey = FLAT_TO_PERCENT[key];
        const factor = key === 'hpFlat' ? 0.05 : 0.6;
        return factor * getSubstatScore(key);
    }
    return isSubStat ? getSubstatScore(key) : getMainstatScore(key, cost);
}

export function getEchoScores(charId, echo) {
    if (!echo) return { mainScore: 0, subScore: 0, totalScore: 0 };

    const cost = echo?.cost ?? 1;
    let mainScore = 0;
    let subScore = 0;

    for (const [key, val] of Object.entries(echo.mainStats ?? {})) {
        if (typeof val === 'number' && !Number.isNaN(val) && !key.endsWith('Flat')) {
            const scoreVal = resolveScoreValue(key, false, cost);
            const weight = getWeight(charId, key);
            mainScore += scoreVal * val * weight;
        }
    }

    for (const [key, val] of Object.entries(echo.subStats ?? {})) {
        if (typeof val === 'number' && !Number.isNaN(val)) {
            const scoreVal = resolveScoreValue(key, true, cost);
            const weight = getWeight(charId, key);
            subScore += scoreVal * val * weight;
        }
    }

    mainScore = isNaN(mainScore) ? 0 : mainScore;

    return { mainScore, subScore, totalScore: mainScore + subScore };
}

function isValidSubstatKey(key) {
    return key in validSubstatRanges;
}

function safeNumber(x, fallback = 0) {
    return (typeof x === 'number' && Number.isFinite(x)) ? x : fallback;
}

export function getTop5SubstatScoreSum(charId) {
    const weights = getWeightObj(charId) ?? {};


    const scored = Object.entries(weights)
        .filter(([key]) => isValidSubstatKey(key))
        .map(([key]) => {
            const rawScore = safeNumber(resolveScoreValue(key, true, undefined));
            const spec = validSubstatRanges[key];
            const specMax = spec?.max ?? 0;
            const computedScore = rawScore * specMax;
            return { key, rawScore, specMax, computedScore };
        })
        .filter(item => item.specMax > 0 && Number.isFinite(item.computedScore));


    const top5 = scored.sort((a, b) => b.computedScore - a.computedScore).slice(0, 5);
    return top5.reduce((acc, it) => acc + it.computedScore, 0) + 44;
}

export function getTop5SubstatScoreDetails(charId) {
    const weights = getWeightObj(charId) ?? {};

    const scored = Object.entries(weights)
        .filter(([key]) => isValidSubstatKey(key))
        .map(([key, weight]) => {
            const rawScore = safeNumber(resolveScoreValue(key, true, undefined)) * weight;
            const spec = validSubstatRanges[key];
            const specMax = spec?.max ?? 0;
            const computedScore = rawScore * specMax;

            return {
                key,
                weight,
                rawScore,
                computedScore,
                max: spec?.max,
                min: spec?.min,
                divisions: spec?.divisions,
            };
        })
        .filter(it => it?.max > 0 && Number.isFinite(it.computedScore))
        .sort((a, b) => b.computedScore - a.computedScore);

    const top5 = scored.slice(0, 5);
    const total = top5.reduce((acc, it) => acc + it.computedScore, 0) + 44;
    return { total, top5, allItems: scored };
}

export function getSubstatStepOptions(key) {
    const range = validSubstatRanges[key];
    if (!range) return [];

    const { min, max, divisions } = range;
    const step = (max - min) / divisions;

    const isFlatStat = key.endsWith('Flat');

    let values = [];
    for (let i = 0; i <= divisions; i++) {
        let val = min + step * i;
        if (isFlatStat) {
            val = Math.ceil(val / 10) * 10;
        } else {
            val = parseFloat(val.toFixed(1));
        }
        if (!values.includes(val)) values.push(val);
    }

    if (key === 'hpFlat') {
        values = [320, 360, 390, 430, 470, 510, 540, 580]
    }

    return values;
}

export function snapToNearestSubstatValue(key, value) {
    const options = getSubstatStepOptions(key);
    if (!options.length) return value;

    let closest = options[0];
    let minDiff = Math.abs(value - closest);

    for (const opt of options) {
        const diff = Math.abs(value - opt);
        if (diff < minDiff) {
            minDiff = diff;
            closest = opt;
        }
    }
    return closest;
}

export const validSubstatRanges = {
    atkPercent:              { min: 6.4,  max: 11.6, divisions: 7 },
    atkFlat:                 { min: 30,   max: 60,   divisions: 3 },
    hpPercent:               { min: 6.4,  max: 11.6, divisions: 7 },
    hpFlat:                  { min: 320,  max: 580,  divisions: 7 },
    defPercent:              { min: 8.1,  max: 14.7, divisions: 7 },
    defFlat:                 { min: 40,   max: 70,   divisions: 3 },
    critRate:                { min: 6.3,  max: 10.5, divisions: 7 },
    critDmg:                 { min: 12.6, max: 21.0, divisions: 7 },
    energyRegen:             { min: 6.8,  max: 12.4, divisions: 7 },
    basicAtk:                { min: 6.4,  max: 11.6, divisions: 7 },
    heavyAtk:                { min: 6.4,  max: 11.6, divisions: 7 },
    resonanceSkill:          { min: 6.4,  max: 11.6, divisions: 7 },
    resonanceLiberation:     { min: 6.4,  max: 11.6, divisions: 7 }
};