import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputPath = path.resolve(__dirname, '../weapons.json');
const weaponApiUrl = 'https://api.encore.moe/en/weapon';
const weaponDetailBase = 'https://api.encore.moe/en/weapon/';

async function fetchAndSaveWeapons() {
    try {
        console.log('Fetching weapon data from Encore...');
        const response = await fetch(weaponApiUrl);
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);

        const weaponRaw = await response.json();
        const weaponList = Array.isArray(weaponRaw?.weapons) ? weaponRaw.weapons : [];

        if (!weaponList.length) {
            throw new Error('Unexpected weapon data format: expected { weapons: [...] }');
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

        for (const weapon of weaponList) {
            const idStr = String(weapon?.Id ?? '');
            if (!idStr) continue;
            const name = weapon?.Name ?? '';

            if (projectionPrefixes.some(prefix => name?.startsWith(prefix))) {
                console.log(`Skipping ${idStr} (${name})`);
                continue;
            }

            let description = '';
            try {
                const detailRes = await fetch(`${weaponDetailBase}${idStr}`);
                if (detailRes.ok) {
                    const detail = await detailRes.json();
                    description =
                        detail?.AttributesDescription ??
                        detail?.BgDescription ??
                        detail?.Desc ??
                        '';
                }
            } catch {
                // Keep summary-only payload if detail fetch fails.
            }

            const nextEntry = {
                id: idStr,
                name,
                description,
                icon: weapon?.Icon ?? `https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon/T_IconWeapon${idStr}_UI.png`,
                rank: weapon?.QualityId ?? 1,
                type: weapon?.Type ?? 0
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
