import {getWeight, getWeightObj} from '@shared/constants/charStatWeights.js';
import {echoes} from "@/data/ingest/getEchoes.js";
import {makeBaseBuffs, makeModBuffs} from "./getUnifiedStatPool.js";
import {applyStatToMerged} from "@/data/buffs/setEffect.js";

export const formatStatKey = (key, compact) => {
    if (compact) {
        switch (key) {
            case "resonanceSkill": return "Res. Skill";
            case "resonanceLiberation": return "Res. Liberation";
            case "heavyAtk": return "Heavy Atk";
            case "basicAtk": return "Basic Atk";
        }
    }
    return statLabelMap[key] ?? key;
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
    let stats = {};
    switch (cost) {
        case 1:
            stats = { hpPercent: 22.8, atkPercent: 18, defPercent: 18 };
            break;
        case 3:
            stats = {
                hpPercent: 30, atkPercent: 30, defPercent: 38,
                energyRegen: 32,
                aero: 30, glacio: 30, electro: 30, fusion: 30, havoc: 30, spectro: 30
            };
            break;
        case 4:
            stats = {
                hpPercent: 33, atkPercent: 33, defPercent: 41.5,
                critRate: 22, critDmg: 44, healingBonus: 26
            };
            break;
    }

    return stats;
};

export const applyFixedSecondMainStat = (mainStats, cost) => {
    const updated = { ...mainStats };
    switch (cost) {
        case 1: updated.hpFlat = 2280; break;
        case 3: updated.atkFlat = 100; break;
        case 4: updated.atkFlat = 150; break;
    }
    return updated;
};

export function formatDescription(rawDesc, paramArray) {
    if (!rawDesc || !Array.isArray(paramArray)) return rawDesc ?? '';

    return rawDesc.replace(/{(\d+)}/g, (_, index) => paramArray[index] ?? `{${index}}`);
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

export function buildMultipleRandomEchoes(recipes = [], setId = null, mainEchoId = null) {
    if (!Array.isArray(echoes) || echoes.length === 0) {
        console.warn("⚠️ No echo templates available to build from.");
        return [];
    }

    const results = [];
    const usedIds = new Set();
    let mainEchoBuilt = null;

    const isMultiSet = Array.isArray(setId);
    const remaining = new Map();
    if (isMultiSet) {
        let total = 0;
        for (const s of setId) {
            const c = Math.max(0, Number(s.count ?? 0));
            if (c > 0) {
                remaining.set(s.setId, c);
                total += c;
            }
        }
        if (total <= 0 || total > 5) {
            console.warn("⚠️ Invalid multi-set configuration. Using random sets instead.");
            remaining.clear();
        }
    }

    function chooseBestSetForEcho(echo) {
        const sets = echo.sets ?? [];
        const candidates = sets.filter(sid => remaining.get(sid) > 0);

        if (candidates.length === 0) {
            return sets[0] ?? null;
        }

        candidates.sort((a, b) => (remaining.get(b) ?? 0) - (remaining.get(a) ?? 0));
        return candidates[0];
    }

    function pickEcho(candidates, cost) {
        if (candidates.length === 1) return structuredClone(candidates[0]);

        const scored = candidates.map(e => {
            const sets = e.sets ?? [];
            const coverage = sets.reduce((acc, sid) => acc + (remaining.get(sid) > 0 ? 1 : 0), 0);
            const quality = Number(e._score ?? 0.1);
            return { e, score: coverage * 10 + quality }; // coverage dominates
        });

        // Weighted random by score (favor higher coverage)
        const total = scored.reduce((a, b) => a + b.score, 0);
        let roll = Math.random() * total;
        for (const item of scored) {
            roll -= item.score;
            if (roll <= 0) return structuredClone(item.e);
        }
        return structuredClone(scored[scored.length - 1].e);
    }

    for (const recipe of recipes) {
        const { cost, mainStats = {}, subStats = {} } = recipe;

        let candidates = [];

        if (mainEchoId != null) {
            candidates = echoes.filter(
                e => e.cost === cost && e.id === String(mainEchoId) && !usedIds.has(e.id)
            );
        }

        if (candidates.length === 0 && remaining.size > 0) {
            const needSetIds = new Set([...remaining.keys()].filter(sid => remaining.get(sid) > 0));
            candidates = echoes.filter(
                e => e.cost === cost
                    && !usedIds.has(e.id)
                    && (e.sets ?? []).some(sid => needSetIds.has(sid))
            );
        }

        if (candidates.length === 0) {
            candidates = echoes.filter(
                e => e.cost === cost && !usedIds.has(e.id)
            );
        }

        if (candidates.length === 0) {
            console.warn(`⚠️ No unused echoes found for cost ${cost}.`);
            continue;
        }

        const base = pickEcho(candidates, cost);

        base.originalSets = base.sets ? [...base.sets] : [];
        let chosenSet = chooseBestSetForEcho(base);

        if (chosenSet != null && remaining.get(chosenSet) > 0) {
            remaining.set(chosenSet, remaining.get(chosenSet) - 1);
        }

        base.selectedSet = chosenSet;

        base.mainStats = structuredClone(mainStats);
        base.subStats  = structuredClone(subStats);

        base.uid = crypto.randomUUID?.() ?? Date.now().toString();
        base.generated = true;

        usedIds.add(base.id);
        results.push(base);

        if (mainEchoId && base.id === String(mainEchoId)) {
            mainEchoBuilt = base;
        }
    }

    if (mainEchoBuilt) {
        const idx = results.findIndex(e => e.id === String(mainEchoId));
        if (idx > 0) {
            const [main] = results.splice(idx, 1);
            results.unshift(main);
        }
    }

    return results;
}

// This is the "echo buffs" object we’ll return
function createEmptyEchoBuffs() {
    return {
        atk: makeBaseBuffs(),
        hp: makeBaseBuffs(),
        def: makeBaseBuffs(),

        attribute: {
            aero:    makeModBuffs(),
            glacio:  makeModBuffs(),
            spectro: makeModBuffs(),
            fusion:  makeModBuffs(),
            electro: makeModBuffs(),
            havoc:   makeModBuffs(),
            physical: makeModBuffs()
        },

        skillType: {
            all: makeModBuffs(),
            basicAtk: makeModBuffs(),
            heavyAtk: makeModBuffs(),
            resonanceSkill: makeModBuffs(),
            resonanceLiberation: makeModBuffs(),
            introSkill: makeModBuffs(),
            outroSkill: makeModBuffs(),
            coord: makeModBuffs(),
            echoSkill: makeModBuffs(),
            spectroFrazzle: makeModBuffs(),
            aeroErosion: makeModBuffs()
        },
        critRate: 0,
        critDmg: 0,
        energyRegen: 0,
        healingBonus: 0,
        shieldBonus: 0,
    };
}

/**
 * Normalize legacy flat echo stats (atkFlat, atkPercent, aero, basicAtk, etc.)
 * into the unified buff structure.
 */
export function normalizeLegacyEchoStats(legacyStats = {}) {
    const out = createEmptyEchoBuffs();

    for (const [key, valueRaw] of Object.entries(legacyStats)) {
        const value = Number(valueRaw) || 0;
        if (!value) continue;

        switch (key) {
            // main stats
            case 'atkFlat':
                out.atk.flat += value;
                break;
            case 'atkPercent':
                out.atk.percent += value;
                break;

            case 'hpFlat':
                out.hp.flat += value;
                break;
            case 'hpPercent':
                out.hp.percent += value;
                break;

            case 'defFlat':
                out.def.flat += value;
                break;
            case 'defPercent':
                out.def.percent += value;
                break;

            // scalar stats
            case 'energyRegen':
                out.energyRegen += value;
                break;
            case 'critRate':
                out.critRate += value;
                break;
            case 'critDmg':
                out.critDmg += value;
                break;

            // skill-type dmg bonus → dmgBonus on skillType buckets
            case 'basicAtk':
                out.skillType.basicAtk.dmgBonus += value;
                break;
            case 'heavyAtk':
                out.skillType.heavyAtk.dmgBonus += value;
                break;
            case 'resonanceSkill':
                out.skillType.resonanceSkill.dmgBonus += value;
                break;
            case 'resonanceLiberation':
                out.skillType.resonanceLiberation.dmgBonus += value;
                break;

            // elemental dmg bonus → dmgBonus on attributes
            case 'aero':
                out.attribute.aero.dmgBonus += value;
                break;
            case 'glacio':
                out.attribute.glacio.dmgBonus += value;
                break;
            case 'spectro':
                out.attribute.spectro.dmgBonus += value;
                break;
            case 'fusion':
                out.attribute.fusion.dmgBonus += value;
                break;
            case 'electro':
                out.attribute.electro.dmgBonus += value;
                break;
            case 'havoc':
                out.attribute.havoc.dmgBonus += value;
                break;

            default:
                break;
        }
    }

    return out;
}

export function getEchoStatsFromEquippedEchoes(equippedEchoes = []) {
    const legacy = {};

    for (const echo of equippedEchoes) {
        if (!echo) continue;

        for (const [key, value] of Object.entries(echo.mainStats ?? {})) {
            legacy[key] = (legacy[key] ?? 0) + (Number(value) || 0);
        }

        for (const [key, value] of Object.entries(echo.subStats ?? {})) {
            legacy[key] = (legacy[key] ?? 0) + (Number(value) || 0);
        }
    }

    return normalizeLegacyEchoStats(legacy);
}

function remove(totalEchoStats, newBuffs) {
    for (const [key, total] of Object.entries(totalEchoStats)) {
        if (!total) continue;
        switch (key) {
            case 'atkFlat': {
                newBuffs.atk = newBuffs.atk ?? { percent: 0, flat: 0 };
                newBuffs.atk.flat = (newBuffs.atk.flat ?? 0) - total;
                break;
            }
            case 'hpFlat': {
                newBuffs.hp = newBuffs.hp ?? { percent: 0, flat: 0 };
                newBuffs.hp.flat = (newBuffs.hp.flat ?? 0) - total;
                break;
            }
            case 'defFlat': {
                newBuffs.def = newBuffs.def ?? { percent: 0, flat: 0 };
                newBuffs.def.flat = (newBuffs.def.flat ?? 0) - total;
                break;
            }
            default: {
                applyStatToMerged(newBuffs, key, -total);
                break;
            }
        }
    }
}

export function removeEchoArrayFromBuffs(mergedBuffs, echoes) {
    if (!mergedBuffs || !Array.isArray(echoes)) return mergedBuffs ?? {};

    const newBuffs = structuredClone(mergedBuffs);

    const totalEchoStats = {};

    for (const echo of echoes) {
        if (!echo) continue;

        for (const [key, rawVal] of Object.entries(echo.mainStats ?? {})) {
            const value = Number(rawVal ?? 0);
            if (!value) continue;
            totalEchoStats[key] = (totalEchoStats[key] ?? 0) + value;
        }

        for (const [key, rawVal] of Object.entries(echo.subStats ?? {})) {
            const value = Number(rawVal ?? 0);
            if (!value) continue;
            totalEchoStats[key] = (totalEchoStats[key] ?? 0) + value;
        }
    }

    remove(totalEchoStats, newBuffs)

    return newBuffs;
}

export function removeMainStatsFromBuffs(mergedBuffs, echoData) {
    if (!mergedBuffs || !Array.isArray(echoData)) return mergedBuffs ?? {};

    const newBuffs = structuredClone(mergedBuffs);
    const totalMainStats = {};

    for (const echo of echoData) {
        if (!echo || !echo.mainStats) continue;

        for (const [key, value] of Object.entries(echo.mainStats)) {
            if (value == null) continue;
            totalMainStats[key] = (totalMainStats[key] ?? 0) + Number(value);
        }
    }

    remove(totalMainStats, newBuffs)

    return newBuffs;
}