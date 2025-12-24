import fs from 'fs/promises';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import weaponData from '../weaponDetails.json' assert { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const iconFolder = path.resolve(__dirname, '../../../public/assets/weapon-icons');

async function downloadIcons() {
    await fs.mkdir(iconFolder, { recursive: true });

    for (const weapon of weaponData) {
        const id = weapon.Id;
        const iconUrl = `https://api.hakush.in/ww/UI/UIResources/Common/Image/IconWeapon/T_IconWeapon${id}_UI.webp`;
        const savePath = path.join(iconFolder, `${id}.webp`);

        try {
            const res = await fetch(iconUrl);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const buffer = await res.arrayBuffer();
            await fs.writeFile(savePath, Buffer.from(buffer));
            console.log(`Saved ${id}.webp`);
        } catch (err) {
            console.warn(`Failed ${id}: ${err.message}`);
        }
    }
}

downloadIcons();
