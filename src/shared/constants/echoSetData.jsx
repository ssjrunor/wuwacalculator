import { attributeColors } from '@shared/utils/attributeHelpers';

export const skillKeywords = [
    'resonance liberation', 'outro skill', 'intro Skill',
    'resonance skill', 'basic attack', 'heavy attack'
];

export const statKeywords = [
    'ATK', 'Max HP', 'HP', 'DEF', 'Crit. Rate', 'Crit. DMG', 'Energy Regen', 'Healing Bonus',
    'Basic Attack', 'Heavy Attack', 'Intro Skill', 'Outro Skill', 'Echo Skill',
    'Resonance Skills', 'Resonance Liberation', 'Attribute', 'Basic DMG Bonus',
    'Heavy DMG Bonus', 'Resonance Skill', 'Resonance Skill DMG Bonus', 'Resonance Liberation DMG Bonus',
    'Basic Attack DMG Bonus', 'Heavy Attack DMG Bonus',
];

const elementKeywords = Object.keys(attributeColors);
const elementPhrases = elementKeywords.flatMap(el => [
    `${el} dmg bonus`,
    `${el} damage bonus`,
    `${el} dmg`,
    `${el} damage`,
    `${el} erosion dmg`,
    `${el} frazzle dmg`,
    `${el} erosion`,
    `${el} frazzle`,
    `${el} bane dmg`,
    `${el} bane`,
    `${el} flare dmg`,
    `${el} flare`,
    el
]);

export function highlightKeywordsInText(text, extraKeywords = []) {
    if (typeof text !== 'string') return text;

    const elementKeywords = Object.keys(attributeColors);
    const skillWords = [...skillKeywords];
    const statWords = [...statKeywords];
    const additionalWords = Array.isArray(extraKeywords) ? extraKeywords : [];

    const escapeRegex = (str) => str.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');

    const resPhrases = elementKeywords.map(el => `${el.charAt(0).toUpperCase() + el.slice(1)} RES`);
    const escapedResPhrases = resPhrases.map(escapeRegex);
    const resRegex = new RegExp(`(${escapedResPhrases.join('|')})`, 'g');

    const staticKeywords = [...elementPhrases];
    const escapedInsensitiveKeywords = staticKeywords.map(escapeRegex);
    const percentPattern = '\\d+(\\.\\d+)?%';
    const ciRegex = new RegExp(`(${[...escapedInsensitiveKeywords, percentPattern].join('|')})`, 'gi');

    const escapedSensitiveKeywords = additionalWords.map(escapeRegex);
    const csRegex = new RegExp(`(${escapedSensitiveKeywords.join('|')})`, 'g');

    let processed = text.replace(csRegex, (match) => {
        return `<strong class="highlight">${match}</strong>`;
    });

    processed = processed.replace(resRegex, (match) => {
        const color = attributeColors[match.split(' ')[0].toLowerCase()];
        return `<strong style="color: ${color}; font-weight: bold;">${match}</strong>`;
    });

    processed = processed.replace(ciRegex, (match) => {
        const lower = match.toLowerCase();
        if (/^\d+(\.\d+)?%$/.test(match)) {
            return `<strong class="highlight">${match}</strong>`;
        }

        const elementPrefix = elementKeywords.find(el => lower.startsWith(el));
        if (elementPrefix) {
            const color = attributeColors[elementPrefix];
            return `<strong style="color: ${color}; font-weight: bold;">${match}</strong>`;
        }

        return `<strong class="highlight">${match}</strong>`;
    });

    return <span dangerouslySetInnerHTML={{ __html: processed }} />;
}