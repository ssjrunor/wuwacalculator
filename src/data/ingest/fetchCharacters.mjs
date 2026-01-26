import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const masterUrl = 'https://api.hakush.in/ww/data/character.json';
const detailUrl = id => `https://api.hakush.in/ww/data/en/character/${id}.json`;

const OUTPUT_PATH = path.join(__dirname, '../characters-mapped.json');

// --- toggle this ---
const SKIP_EXISTING = false;

/**
 * Keep only the fields the app actually consumes.
 * We still preserve SkillTrees/Chains/Stats because the UI and damage
 * calculations read them directly from `raw`.
 */
function normalizeCharacter(detail) {
    const Id = detail?.Id ?? detail?.id ?? detail?.link ?? null;
    const Name = detail?.Name ?? detail?.name ?? '';
    const Element = detail?.Element ?? detail?.element ?? 0;
    const Weapon = detail?.Weapon ?? detail?.weapon ?? 0;
    const Rarity = detail?.Rarity ?? detail?.rarity ?? null;

    // Some characters expose tune break related mastery here.
    const StatsWeakness = detail?.StatWeakness ?? detail?.StatsWeakness ?? null;

    // Stats, SkillTrees, and Chains are used throughout the calculator;
    // keep them verbatim but drop everything else to shrink the payload.
    const Stats = detail?.Stats ?? {};
    const SkillTrees = detail?.SkillTrees ?? {};
    const Chains = detail?.Chains ?? {};

    return { Id, Name, Element, Weapon, Rarity, Stats, SkillTrees, Chains, StatsWeakness };
}

async function buildFullCharacterList() {
    try {
        const res = await fetch(masterUrl);
        const master = await res.json();
        const ids = Object.keys(master);

        let existingCharacters = [];
        if (SKIP_EXISTING) {
            try {
                const existingData = await fs.readFile(OUTPUT_PATH, 'utf8');
                existingCharacters = JSON.parse(existingData);
            } catch {
                // file may not exist, ignore
            }
        }

        const existingIds = new Set(existingCharacters.map(c => String(c?.Id ?? c?.id)));
        const allCharacters = SKIP_EXISTING ? [...existingCharacters] : [];

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

                const normalized = normalizeCharacter(characterData);
                if (!normalized.Id || !normalized.Name) {
                    console.warn(`Skipping character ${id} (missing Id/Name)`);
                    continue;
                }

                allCharacters.push(normalized);
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
