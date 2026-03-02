import fs from 'fs/promises';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import weaponData from '../weaponDetails.json' assert { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const iconFolder = path.resolve(__dirname, '../../../public/assets/weapon-icons');

function toEncoreResourceUrl(assetPath, ext = 'png') {
    if (typeof assetPath !== 'string' || !assetPath) return '';
    if (assetPath.startsWith('http://') || assetPath.startsWith('https://')) return assetPath;
    const normalized = assetPath.split('.')[0];
    if (!normalized.startsWith('/Game/')) return '';
    return `https://api.encore.moe/resource/Data${normalized}.${ext}`;
}

async function downloadIcons() {
    await fs.mkdir(iconFolder, { recursive: true });

    for (const weapon of weaponData) {
        const id = weapon.Id;
        const iconUrl =
            weapon.icon ||
            toEncoreResourceUrl(weapon.Icon, 'png') ||
            `https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon/T_IconWeapon_${id}_UI.png`;
        const savePath = path.join(iconFolder, `${id}.png`);

        try {
            const res = await fetch(iconUrl);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const buffer = await res.arrayBuffer();
            await fs.writeFile(savePath, Buffer.from(buffer));
            console.log(`Saved ${id}.png`);
        } catch (err) {
            console.warn(`Failed ${id}: ${err.message}`);
        }
    }
}

downloadIcons();
