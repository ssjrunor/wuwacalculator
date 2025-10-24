import { attributeColors } from '../utils/attributeHelpers';

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

const echoSets = [
    {
        id: 1,
        name: 'Freezing Frost',
        twoPiece: 'Glacio DMG +10%',
        fivePiece: 'Upon using Basic Attack or Heavy Attack, Glacio DMG increases by 10%, stacking up to three times, lasting for15s.'
    },
    {
        id: 2,
        name: 'Molten Rift',
        twoPiece: 'Fusion DMG% +10%.',
        fivePiece: 'Upon using Resonance Skill, Fusion DMG increases by 30% for 15s.'
    },
    {
        id: 3,
        name: 'Void Thunder',
        twoPiece: 'Electro DMG +10%.',
        fivePiece: 'Upon using Heavy Attack or Resonance Skill, Electro DMG increases by 15%, stacking up to 2 times, each stack lasting for 15s.'
    },
    {
        id: 4,
        name: 'Sierra Gale',
        twoPiece: 'Aero DMG +10%.',
        fivePiece: 'Upon using Intro Skill, Aero DMG increases by 30% for 15s.'
    },
    {
        id: 5,
        name: 'Celestial Light',
        twoPiece: 'Spectro DMG +10%.',
        fivePiece: 'Upon using Intro Skill, Spectro DMG increases by 30% for 15s.'
    },
    {
        id: 6,
        name: 'Sun-sinking Eclipse',
        twoPiece: 'Havoc DMG +10%.',
        fivePiece: 'Upon using Basic Attack or Heavy Attack, Havoc DMG increases by 7.5%, stacking up to four times for 15s.'
    },
    {
        id: 7,
        name: 'Rejuvenating Glow',
        twoPiece: 'Healing +10%.',
        fivePiece: 'Upon healing allies, increase ATK of the entire team by 15%, lasting 30s.'
    },
    {
        id: 8,
        name: 'Moonlit Clouds',
        twoPiece: 'Energy Regen +10%.',
        fivePiece: 'Upon using Outro Skill, ATK of the next Resonator increases by 22.5% for 15s.'
    },
    {
        id: 9,
        name: 'Lingering Tunes',
        twoPiece: 'ATK +10%',
        fivePiece: 'While on the field, ATK increases by 5% every 1.5s, stacking up to 4 times. Outro Skill DMG increases by 60%.'
    },
    {
        id: 10,
        name: 'Frosty Resolve',
        twoPiece: 'Resonance Skill DMG +12%.',
        fivePiece: 'Casting Resonance Skill grants 22.5% Glacio DMG Bonus for 15s and casting Resonance Liberation increases Resonance Skill DMG by 18%, lasting for 5s. This effect stacks up to 2 times.'
    },
    {
        id: 11,
        name: 'Eternal Radiance',
        twoPiece: 'Spectro DMG +10%.',
        fivePiece: 'Inflicting enemies with Spectro Frazzle increases Crit. Rate by 20% for 15s. Attacking enemies with 10 stacks of Spectro Frazzle grants 15% Spectro DMG Bonus for 15s.'
    },
    {
        id: 12,
        name: 'Midnight Veil',
        twoPiece: 'Havoc DMG +10%.',
        fivePiece: 'When Outro Skill is triggered, deal additional 480% Havoc DMG to surrounding enemies, considered Outro Skill DMG, and grant the incoming Resonator 15% Havoc DMG Bonus for 15s.'
    },
    {
        id: 13,
        name: 'Empyrean Anthem',
        twoPiece: 'Energy Regen +10%.',
        fivePiece: 'Increase the Resonator\'s Coordinated Attack DMG by 80%. Upon a critical hit of Coordinated Attack, increase the active Resonator\'s ATK by 20% for 4s.'
    },
    {
        id: 14,
        name: 'Tidebreaking Courage',
        twoPiece: 'Energy Regen +10%.',
        fivePiece: 'Increase the Resonator\'s ATK by 15%. Reaching 250% Energy Regen increases all Attribute DMG by 30% for the Resonator.'
    },
    {
        id: 16,
        name: 'Gusts of Welkin',
        twoPiece: 'Aero DMG +10%.',
        fivePiece: 'Inflicting Aero Erosion upon enemies increases Aero DMG for all Resonators in the team by 15%, and for the Resonator triggering this effect by an additional 15%, lasting for 20s.'
    },
    {
        id: 17,
        name: 'Windward Pilgrimage',
        twoPiece: 'Aero DMG + 10%.',
        fivePiece: 'Hitting a target with Aero Erosion increases Crit. Rate by 10% and grants 30% Aero DMG Bonus, lasting for 10s.'
    },
    {
        id: 18,
        name: 'Flaming Clawprint',
        twoPiece: 'Fusion DMG + 10%.',
        fivePiece: 'Casting Resonance Liberation grants all Resonators in the team 15% Fusion DMG Bonus and the caster 20% Resonance Liberation DMG Bonus, lasting for 35s.'
    },
    {
        id: 19,
        name: 'Dream of the Lost',
        threePiece: 'Holding 0 Resonance Energy increases Crit. Rate by 20% and grants 35% Echo Skill DMG Bonus.'
    },
    {
        id: 20,
        name: 'Crown Of Valor',
        threePiece: 'Upon gaining a Shield, increase the Resonator\'s ATK by 6% and Crit. DMG by 4% for 4s. This effect can be triggered once every 0.5s and stacks up to 5 times.'
    },
    {
        id: 21,
        name: 'Law of Harmony',
        threePiece: 'Casting Echo Skill grants 30% Heavy Attack DMG Bonus to the caster for 4s. Additionally, all Resonators in the team gain 4% Echo Skill DMG Bonus for 30s, stacking up to 4 times. Echoes of the same name can only trigger this effect once. The record of Echo triggering this effect is cleared along with this effect. At 4 stacks, casting Echo Skill again resets the duration of this effect.'
    },
    {
        id: 22,
        name: 'Flamewing\'s Shadow',
        threePiece: 'Dealing Echo Skill DMG increases Heavy Attack Crit. Rate by 20% for 6s. Dealing Heavy Attack DMG increases Echo Skill Crit. Rate by 20% for 6s. While both effects are active, gain 16% Fusion DMG Bonus.'
    },
    {
        id: 23,
        name: 'Thread of Severed Fate',
        threePiece: 'Inflicting Havoc Bane increases the Resonator\'s ATK by 20% and grants 30% Resonance Liberation DMG Bonus for 5s.'
    }
];

export const setIconMap = {
    1: '/assets/echo-icons/freezingFrost.webp',
    2: '/assets/echo-icons/moltenRift.webp',
    3: '/assets/echo-icons/voidThunder.webp',
    4: '/assets/echo-icons/sierraGale.webp',
    5: '/assets/echo-icons/celestialLight.webp',
    6: '/assets/echo-icons/sun-sinkingEclipse.webp',
    7: '/assets/echo-icons/rejuvenatingGlow.webp',
    8: '/assets/echo-icons/moonlitClouds.webp',
    9: '/assets/echo-icons/lingeringTunes.webp',
    10: '/assets/echo-icons/frostyResolve.webp',
    11: '/assets/echo-icons/eternalRadiance.webp',
    12: '/assets/echo-icons/midnightVeil.webp',
    13: '/assets/echo-icons/empyreanAnthem.webp',
    14: '/assets/echo-icons/tidebreakingCourage.webp',
    16: '/assets/echo-icons/gustsOfWelkin.webp',
    17: '/assets/echo-icons/windwardPilgrimage.webp',
    18: '/assets/echo-icons/flamingClawprint.webp',
    19: '/assets/echo-icons/dreamOfTheLost.webp',
    20: '/assets/echo-icons/crownOfValor.webp',
    21: '/assets/echo-icons/lawOfHarmony.webp',
    22: '/assets/echo-icons/flamewing\'sShadow.webp',
    23: '/assets/echo-icons/threadOfSeveredFate.webp',
};

export default echoSets;