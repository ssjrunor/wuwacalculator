import { useEffect } from 'react';
import characterStatesRaw from '@/data/characterStates.json';
import { traceIcons } from '@/features/characters/model/traceNodeIcons.js';

export const attributeMap = {
    glacio: 1,
    fusion: 2,
    electro: 3,
    aero: 4,
    spectro: 5,
    havoc: 6,
};

export const weaponMap = {
    broadblade: 1,
    sword: 2,
    pistols: 3,
    gauntlets: 4,
    rectifier: 5,
};

const toolbarIconNames = [
    'character',
    'rotations',
    'buffs',
    'echoes',
    'enemy',
    'weapon',
    'teams',
];

const darkIcons = toolbarIconNames.map(name => `/assets/icons/dark/${name}.png`);
const lightIcons = toolbarIconNames.map(name => `/assets/icons/light/${name}.png`);

const buildSkillIconPaths = () => traceIcons.flatMap(name => [
    `/assets/skills/icons/light/${name}.webp?v=light`,
    `/assets/skills/icons/dark/${name}.webp?v=dark`
]);

const baseImages = [
    '/assets/sample-import-image.png',
    '/assets/weapon-icons/default.webp',
    '/assets/echoes/default.webp'
];

const attributeIconPaths = Object.keys(attributeMap).flatMap(attr => [
    `/assets/attributes/attributes alt/${attr}.webp`,
    `/assets/attributes/${attr}.png`
]);

const weaponIconPaths = Object.keys(weaponMap).map(weapon =>
    `/assets/weapons/${weapon}.webp`
);

export const imageCache = {};
const preloadedImages = new Set();
const loadingImages = new Set();

export const preloadImages = (srcList = []) => {
    srcList.forEach(src => {
        if (preloadedImages.has(src) || loadingImages.has(src)) return;
        loadingImages.add(src);
        const img = new Image();
        img.onload = () => {
            imageCache[src] = src;
            preloadedImages.add(src);
            loadingImages.delete(src);
        };
        img.onerror = () => {
            console.warn(`Failed to preload image: ${src}`);
            loadingImages.delete(src);
        };
        img.src = src;
    });
};

export function loadCalculatorBaseAssets() {
    useEffect(() => {
        let splashPaths = [];
        if (characterStatesRaw) {
            splashPaths = Object.values(characterStatesRaw)
                .map(char => char.SplashArt)
                .filter(Boolean);
        }

        preloadImages([
            ...darkIcons,
            ...lightIcons,
            ...buildSkillIconPaths(),
            ...baseImages,
            ...attributeIconPaths,
            ...weaponIconPaths,
            ...splashPaths
        ]);
    }, []);
}
