import { echoes } from '../json-data-scripts/getEchoes.js';
import { setIconMap } from '../constants/echoSetData.jsx';
import {applyFixedSecondMainStat, getValidMainStats} from "./echoHelper.js";

const labelToKey = {
    'Crit. Rate': 'critRate',
    'Crit. DMG': 'critDmg',
    'ATK': 'atk',
    'LULS': 'atk',
    'HP': 'hp',
    'HESS': 'HP',
    '1': 'hp',
    'def': 'def',
    'Energy Regen': 'energyRegen',
    'Basic Attack DMG Bonus': 'basicAtk',
    'Basic': 'basicAtk',
    'Basic Attack': 'basicAtk',
    'Basic Attack DMG': 'basicAtk',
    'Heavy Attack DMG Bonus': 'heavyAtk',
    'Heavy': 'heavyAtk',
    'Heavy Attack': 'heavyAtk',
    'Heavy Attack DMG': 'heavyAtk',
    'Resonance Skill DMG Bonus': 'resonanceSkill',
    'Resonance Skill': 'resonanceSkill',
    'Resonance Skill DMG': 'resonanceSkill',
    'Resonance Liberation DMG Bonus': 'resonanceLiberation',
    'Resonance Liberation': 'resonanceLiberation',
    'Resonance Liberation DMG': 'resonanceLiberation',
    'Glacio DMG Bonus': 'glacio',
    'Fusion DMG Bonus': 'fusion',
    'Spectro DMG Bonus': 'spectro',
    'Electro DMG Bonus': 'electro',
    'Havoc DMG Bonus': 'havoc',
    'Aero DMG Bonus': 'aero',
    'Healing Bonus': 'healingBonus',
};

const setNameToId = {};
for (const [id, path] of Object.entries(setIconMap)) {
    const filename = path.split('/').pop().replace(/\.[^.]+$/, '');
    const name = filename
        .replace(/[-_]/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/\b\w/g, char => char.toUpperCase())
        .trim();
    setNameToId[name] = Number(id);
}

const parseSubstats = (substats = []) => {
    const result = {};

    const keyEntries = Object.entries(labelToKey).map(([label, key]) => ({
        label: label.toLowerCase().replace(/\./g, '').replace(/\s+/g, ''),
        key
    }));

    for (const raw of substats) {
        const match = raw.match(/^([\w\s.]+?)\s+([\d.]+)\s*%?/);
        if (!match) continue;

        let [_, rawLabel, rawValue] = match;
        rawValue = fixOCRNumber(rawValue.trim());
        const value = parseFloat(rawValue);
        const hasPercent = raw.includes('%');
        if (isNaN(value)) continue;

        let cleanedLabel = rawLabel.toLowerCase()
            .replace(/\./g, '')
            .replace(/bonus/g, '')
            .replace(/\s+/g, '');

        let matchKey = null;

        for (const { label, key } of keyEntries) {
            if (cleanedLabel.includes(label)) {
                matchKey = key;
                break;
            }
        }

        if (matchKey) {
            if (['atk', 'hp', 'def'].includes(matchKey)) {
                matchKey = hasPercent ? `${matchKey}Percent` : `${matchKey}Flat`;
            }
            if (['luls'].includes(matchKey)) {
                matchKey = hasPercent ? `atkPercent` : `atkFlat`;
            }
            if (['1', 'hess'].includes(matchKey)) {
                matchKey = hasPercent ? `hpPercent` : `hpFlat`;
            }
        }

        if (matchKey) {
            result[matchKey] = value;
        } else {
            //console.warn('[Unmatched substat]', raw);
        }
    }

    return result;
};

export function getEchoIdSetIdAndMainStats(parsedList) {
    return parsedList.map(item => {
        const echoId = echoes.find(e => e.name === item.echo)?.id ?? null;
        const setId = setNameToId[item.set] ?? null;
        const cost = Number(item.cost);

        const baseMainStats = getValidMainStats(cost);
        let mainKey = labelToKey[item.mainStatLabel];
        if (!mainKey) {
            return {
                echoId: null,
                setId: null,
                mainStats: {},
                subStats: {}
            };
        }

        if (['atk', 'hp', 'def'].includes(mainKey)) {
            mainKey = `${mainKey}Percent`;
        }

        const mainStatValue = baseMainStats?.[mainKey];

        let mainStats = {};
        if (mainStatValue !== undefined) {
            mainStats[mainKey] = mainStatValue;
            mainStats = applyFixedSecondMainStat(mainStats, cost);
        }

        const subStats = parseSubstats(item.substats);

        return {
            echoId,
            setId,
            mainStats,
            subStats
        };
    });
}

const correctionMap = {
    '1.9': '7.9',
    '1.8': '7.8',
    '1.7': '7.7',
    '1.6': '7.6',
    '1.5': '7.5',
    '1.4': '7.4',
    '1.3': '7.3',
    '1.2': '7.2',
    '1.1': '7.1',
    '1.0': '7.0',
};

const fixOCRNumber = (str) => correctionMap[str] ?? str;

export function applyParsedEchoesToEquipped(parsedList) {
    const mapped = getEchoIdSetIdAndMainStats(parsedList);

    return mapped.map((result) => {
        const baseEcho = echoes.find(e => String(e.id) === String(result.echoId));
        if (!baseEcho) return null;

        const validSets = baseEcho.sets ?? [];
        let selectedSet = result.setId;
        if (result.setId === 18 && !validSets.includes(18)) {
            selectedSet = 6;
        }

        return {
            ...baseEcho,
            id: result.echoId,
            setId: selectedSet,
            selectedSet: validSets.includes(selectedSet) ? selectedSet : validSets[0],
            originalSets: validSets,
            mainStats: result.mainStats,
            subStats: result.subStats,
            uid: crypto.randomUUID?.() ?? Date.now().toString(),
        };
    });
}