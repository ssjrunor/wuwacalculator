import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { toCompactCharacters } from './charactersCompactProposal.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function normalizeCharactersMappedOnce({
    inputPath = path.join(__dirname, '../characters-mapped.json'),
    outputPath = inputPath,
    makeBackup = true
} = {}) {
    const raw = await fs.readFile(inputPath, 'utf8');
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
        throw new Error('characters-mapped.json must be an array.');
    }

    const compact = toCompactCharacters(parsed);

    if (makeBackup) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = `${inputPath}.backup-${timestamp}`;
        await fs.writeFile(backupPath, raw, 'utf8');
        console.log(`Backup created: ${backupPath}`);
    }

    await fs.writeFile(outputPath, `${JSON.stringify(compact, null, 2)}\n`, 'utf8');
    console.log(`Wrote compact characters to: ${outputPath}`);
    console.log(`Characters processed: ${compact.length}`);

    return compact.length;
}

if (import.meta.url === `file://${process.argv[1]}`) {
    normalizeCharactersMappedOnce().catch((err) => {
        console.error(err);
        process.exit(1);
    });
}

