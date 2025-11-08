import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const weaponListUrl = 'https://api.hakush.in/ww/data/weapon.json';
const weaponDetailBase = 'https://api.hakush.in/ww/data/en/weapon/';
const outputPath = path.resolve(__dirname, '../data/weaponDetails.json');

// --- toggle this ---
const SKIP_EXISTING = false;

async function fetchWeaponDetails() {
    try {
        console.log('Fetching weapon list...');
        const listResponse = await fetch(weaponListUrl);
        if (!listResponse.ok)
            throw new Error(`Failed to fetch weapon list: ${listResponse.status}`);
        const weaponMap = await listResponse.json();

        const weaponIds = Object.keys(weaponMap);

        // Load existing file if it exists
        let existingWeapons = [];
        try {
            const existingData = await fs.readFile(outputPath, 'utf8');
            existingWeapons = JSON.parse(existingData);
        } catch {
            // file may not exist, ignore
        }

        const existingIds = new Set(
            existingWeapons.map(w => String(w?.Id ?? w?.id))
        );

        const weaponDetails = [...existingWeapons];
        console.log(`Fetching details for ${weaponIds.length} weapons...`);

        for (const id of weaponIds) {
            // normalize id to string
            const idStr = String(id);

            if (SKIP_EXISTING && existingIds.has(idStr)) {
                console.log(`Skipping ${idStr} (already exists)`);
                continue;
            }

            try {
                const res = await fetch(`${weaponDetailBase}${idStr}.json`);
                if (!res.ok) throw new Error(`Failed to fetch weapon ${idStr}: ${res.status}`);
                const detail = await res.json();

                const projectionPrefixes = ['Projection:', 'Projection -', 'Projection-'];

                if (projectionPrefixes.some(prefix => detail?.Name?.startsWith(prefix))) {
                    console.log(`Skipping ${idStr} (${detail.Name})`);
                    continue;
                }

                detail.icon = `https://api.hakush.in/ww/UI/UIResources/Common/Image/IconWeapon/T_IconWeapon${idStr}_UI.webp`;

                weaponDetails.push(detail);
                console.log(`${idStr} loaded`);
            } catch (err) {
                console.warn(`Skipped ${id}: ${err.message}`);
            }
        }

        await fs.writeFile(outputPath, JSON.stringify(weaponDetails, null, 2));
        console.log(`Done! Saved ${weaponDetails.length} entries to weaponDetails.json`);
    } catch (err) {
        console.error('Fatal error:', err.message);
    }
}

fetchWeaponDetails();