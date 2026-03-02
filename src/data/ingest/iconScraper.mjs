import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ICONS_DIR = path.resolve(__dirname, '../../assets/characters/icons');
const OUTPUT_JSON = path.resolve(__dirname, '../iconLinks.json');
const baseUrl = 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconRoleHead256/T_IconRoleHead256_';

if (!fs.existsSync(ICONS_DIR)) {
    fs.mkdirSync(ICONS_DIR, { recursive: true });
}

async function downloadImage(url, dest) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode !== 200) return resolve(false);

            const fileStream = fs.createWriteStream(dest);
            res.pipe(fileStream);
            fileStream.on('finish', () => {
                fileStream.close();
                resolve(true);
            });
        }).on('error', (err) => {
            resolve(false);
        });
    });
}

async function run() {
    const foundIcons = [];

    for (let id = 1; id <= 60; id++) {
        const url = `${baseUrl}${id}_UI.png`;
        const dest = path.join(ICONS_DIR, `${id}.png`);
        const downloaded = await downloadImage(url, dest);

        if (downloaded) {
            console.log(`Downloaded icon ${id}`);
            foundIcons.push({ id, url: `/icons/${id}.png` });
        } else {
            console.log(`Not found: ${id}`);
        }
    }

    //fs.writeFileSync(OUTPUT_JSON, JSON.stringify(foundIcons, null, 2));
    console.log(`Saved ${foundIcons.length} icon links to ${OUTPUT_JSON}`);
}

run();
