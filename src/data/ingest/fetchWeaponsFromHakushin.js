import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputPath = path.resolve(__dirname, '../weapons.json');
const weaponApiUrl = 'https://api.hakush.in/ww/data/weapon.json';

async function fetchAndSaveWeapons() {
    try {
        console.log('Fetching weapon data from Hakushin...');
        const response = await fetch(weaponApiUrl);
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);

        const weaponRaw = await response.json();

        if (typeof weaponRaw !== 'object' || Array.isArray(weaponRaw)) {
            throw new Error('Unexpected weapon data format: expected object');
        }

        // Load existing file if available
        let existingWeapons = [];
        try {
            const existingData = await fs.readFile(outputPath, 'utf8');
            existingWeapons = JSON.parse(existingData);
        } catch {
            // file might not exist, ignore
        }

        const projectionPrefixes = ['Projection:', 'Projection -', 'Projection-'];

        const weaponIndexById = new Map();
        const mergedWeapons = existingWeapons.map((weapon, index) => {
            const id = String(weapon?.id ?? weapon?.Id);
            if (id) weaponIndexById.set(id, index);
            return weapon;
        });

        for (const [id, weapon] of Object.entries(weaponRaw)) {
            const idStr = String(id);

            const name = weapon.en;

            if (projectionPrefixes.some(prefix => name?.startsWith(prefix))) {
                console.log(`Skipping ${idStr} (${name})`);
                continue;
            }

            const nextEntry = {
                id: idStr,
                name,
                description: weapon.desc,
                icon: `https://api.hakush.in/ww${weapon.icon}.webp`,
                rank: weapon.rank,
                type: weapon.type
            };

            if (weaponIndexById.has(idStr)) {
                mergedWeapons[weaponIndexById.get(idStr)] = nextEntry;
                console.log(`${idStr} updated`);
            } else {
                mergedWeapons.push(nextEntry);
                console.log(`${idStr} added`);
            }
        }
        await fs.writeFile(outputPath, JSON.stringify(mergedWeapons, null, 2));
        console.log(`Saved ${mergedWeapons.length} weapons to weapons.json`);
    } catch (err) {
        console.error('Error fetching weapon data:', err.message);
    }
}

fetchAndSaveWeapons();
