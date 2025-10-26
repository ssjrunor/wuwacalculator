export function getDefaultRotationEntries(charId) {
    return defaultRotationEntries[charId] ?? {};
}

const defaultRotationEntries = {
    '1409': {
        entries: [
            { name: "Sword to Mark Tide's Trace DMG", multiplier: 1 },
            { name: "Stage 2 DMG", multiplier: 1 },
            { name: "Stage 3 DMG", multiplier: 1 },
            { name: "Stage 4 DMG", multiplier: 1 },
            { name: "Sword to Bear Their Names DMG", multiplier: 1 },
            { name: "Mid-air Attack 3 Sword Shadows Recalled", multiplier: 1 },
            { name: "Sword to Answer Waves' Call DMG", multiplier: 1 },
            { name: "Mid-air Attack 3 DMG", multiplier: 1 },
            { name: "Basic Attack Stage 3 DMG", multiplier: 2 },
            { name: "Basic Attack Stage 4 DMG", multiplier: 2 },
            { name: "Basic Attack Stage 5 DMG", multiplier: 2 },
            { name: "May Tempest Break the Tides DMG", multiplier: 1 },
            { name: "Blade of Howling Squall DMG", multiplier: 1 }
        ],
        link: 'https://www.prydwen.gg/wuthering-waves/characters/cartethyia'
    },
    '1208': {
        entries: [
            { name: "Intro Skill - Hellflare Overload DMG", multiplier: 1 },
            { name: "Basic Attack Stage 2 DMG", multiplier: 2 },
            { name: "Basic Attack Stage 3 DMG", multiplier: 2 },
            { name: "Basic Attack Stage 4 DMG", multiplier: 1 },
            { name: "Resonance Skill - Ascent of Malice DMG", multiplier: 1 },
            { name: "Resonance Liberation - Hellfire Absolution DMG", multiplier: 1 },
            { name: "Basic Attack - Seraphic Execution Stage 2 DMG", multiplier: 1 },
            { name: "Basic Attack - Seraphic Execution Stage 3 DMG", multiplier: 2 },
            { name: "Basic Attack - Seraphic Execution Stage 4 DMG", multiplier: 2 },
            { name: "Basic Attack - Seraphic Execution Stage 5 DMG", multiplier: 2 },
            { name: "Ashen Pursuit DMG", multiplier: 2 },
        ],
        link: 'https://www.prydwen.gg/wuthering-waves/characters/galbrena'
    },
};