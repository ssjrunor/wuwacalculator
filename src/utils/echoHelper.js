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
        critValue: 'Crit Value',
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
    const idealScore = idealSubScoreMap[key];
    const substatScore = idealSubScoreMap.critDmg;
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