import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const masterUrl = 'https://api.hakush.in/ww/data/character.json';
const detailUrl = id => `https://api.hakush.in/ww/data/en/character/${id}.json`;

const OUTPUT_PATH = path.join(__dirname, '../data/characters-mapped.json');

const SKIP_EXISTING = true;

async function buildFullCharacterList() {
    try {
        const res = await fetch(masterUrl);
        const master = await res.json();
        const ids = Object.keys(master);

        let existingCharacters = [];
        try {
            const existingData = await fs.readFile(OUTPUT_PATH, 'utf8');
            existingCharacters = JSON.parse(existingData);
        } catch {
        }

        const existingIds = new Set(existingCharacters.map(c => String(c?.Id ?? c?.id)));
        const allCharacters = [...existingCharacters];

        for (const _id of ids) {
            const id = String(_id);

            if (SKIP_EXISTING && existingIds.has(id)) {
                console.log(`Skipping character ${id} (already exists)`);
                continue;
            }

            const url = detailUrl(id);
            try {
                const detailRes = await fetch(url);
                const characterData = await detailRes.json();
                allCharacters.push(characterData);
                console.log(`Fetched and added character ${id}`);
            } catch (err) {
                console.warn(`Failed to fetch character ${id}: ${err.message}`);
            }
        }

        await fs.writeFile(OUTPUT_PATH, JSON.stringify(allCharacters, null, 2));
        console.log(`Saved ${allCharacters.length} characters to characters-mapped.json`);
    } catch (err) {
        console.error('Failed to build character list:', err.message);
    }
}

buildFullCharacterList();