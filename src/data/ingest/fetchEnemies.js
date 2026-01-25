import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try these in order until one returns a usable index
const INDEX_URLS = [
    'https://api.hakush.in/ww/data/monster.json',
    'https://api.hakush.in/ww/data/en/monster.json'
];

const DETAIL_BASE = 'https://api-v2.encore.moe/en/monster';
const OUTPUT_PATH = path.resolve(__dirname, '../enemies.json');

// Set to true to keep existing entries and only fetch missing ones
const SKIP_EXISTING = false;

// IDs to exclude from ingestion (will be skipped even if present in index)
const EXCLUDE_IDS = new Set([
    '310000231','310000232','310000233','310000234','310000235',
    '310000241','310000242','310000243','310000244','310000245',
    '310000251','320000111','340000112','330000131','340000181',
    '330000111','340000101','340000122', '340000111'
]);

const RES_FIELD_TO_ELEMENT_ID = {
    DamageResistancePhys: 0,   // Physical
    DamageResistanceElement1: 1, // Glacio
    DamageResistanceElement2: 2, // Fusion
    DamageResistanceElement3: 3, // Electro
    DamageResistanceElement4: 4, // Aero
    DamageResistanceElement5: 5, // Spectro
    DamageResistanceElement6: 6  // Havoc
};

async function loadIndex() {
    for (const url of INDEX_URLS) {
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const data = await res.json();
            const ids = Array.isArray(data)
                ? data.map(String)
                : Object.keys(data ?? {}).map(String);

            if (!ids.length) throw new Error('Empty index');

            console.log(`Loaded ${ids.length} ids from ${url}`);
            return ids;
        } catch (err) {
            console.warn(`Index fetch failed from ${url}: ${err.message}`);
        }
    }
    throw new Error('Unable to load enemy index from Hakushin');
}

async function fetchEnemyDetail(id) {
    const url = `${DETAIL_BASE}/${id}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

function normalizeEnemy(detail) {
    const properties = detail?.Properties ?? {};

    const getPropValue = (key) => {
        const val = properties?.[key];
        if (val == null) return null;
        if (typeof val === 'number') return val;
        if (typeof val?.Value === 'number') return val.Value;
        return null;
    };

    const res = {};

    for (const [field, elementId] of Object.entries(RES_FIELD_TO_ELEMENT_ID)) {
        const val = getPropValue(field);
        if (typeof val === 'number') res[elementId] = val / 100;
    }

    const baseData = Object.keys(res).length ? { res } : {};

    const baseHp = getPropValue('LifeMax');
    const baseAtk = getPropValue('Atk');
    const baseDef = getPropValue('Def');

    const statsRaw = detail?.GrowthRates ?? {};
    const stats = {};
    for (const [level, values] of Object.entries(statsRaw)) {
        const hpRatio = values?.LifeMaxRatio;
        const atkRatio = values?.AtkRatio;
        const defRatio = values?.DefRatio;

        const hp = (baseHp != null && hpRatio != null) ? baseHp * (hpRatio / 10000) : null;
        const atk = (baseAtk != null && atkRatio != null) ? baseAtk * (atkRatio / 10000) : null;
        const def = (baseDef != null && defRatio != null) ? baseDef * (defRatio / 10000) : null;

        if (hp == null && atk == null && def == null) continue;

        stats[level] = {};
        if (hp != null) stats[level].hp = hp;
        if (atk != null) stats[level].atk = atk;
        if (def != null) stats[level].def = def;
    }

    const id = detail.Id ?? detail.id ?? detail.monsterId ?? null;
    const localIcon = `/assets/enemies/${id}.webp`;


    return {
        Id: id,
        Name: detail.Name,
        Desc: detail.UndiscoveredDes ?? detail.Desc ?? '',
        DescOpen: detail.DiscoveredDes ?? detail.DescOpen ?? detail.UndiscoveredDes ?? '',
        Class: detail.RarityId ?? detail.Rarity,
        Element: detail.Element ?? detail.ElementIdArray?.[0],
        ElementArray: detail.ElementIdArray ?? detail.ElementArray,
        Icon: localIcon,
        Echo: detail.Echo,
        baseData,
        Stats: stats
    };
}

async function run() {
    const ids = await loadIndex();

    let existing = [];
    if (SKIP_EXISTING) {
        try {
            const raw = await fs.readFile(OUTPUT_PATH, 'utf8');
            existing = JSON.parse(raw);
        } catch {
            existing = [];
        }
    }

    const existingIndex = new Map(
        existing.map((entry, idx) => [String(entry?.Id ?? entry?.id ?? entry?.monsterId ?? ''), idx])
    );

    const results = SKIP_EXISTING ? [...existing] : [];

    for (const id of ids) {
        const idStr = String(id);

        if (EXCLUDE_IDS.has(idStr)) {
            console.log(`Skipping ${idStr} (excluded)`);
            continue;
        }

        if (SKIP_EXISTING && existingIndex.has(idStr)) {
            console.log(`Skipping ${idStr} (already exists)`);
            continue;
        }

        try {
            const detail = await fetchEnemyDetail(idStr);
            const name = typeof detail?.Name === 'string' ? detail.Name.trim() : '';
            if (!name) {
                console.log(`Skipping ${idStr} (empty name)`);
                continue;
            }
            if (name.startsWith('Phantom:')) {
                console.log(`Skipping ${idStr} (${name})`);
                continue;
            }
            const payload = normalizeEnemy(detail);

            if (existingIndex.has(idStr)) {
                results[existingIndex.get(idStr)] = payload;
                console.log(`Updated ${idStr}`);
            } else {
                results.push(payload);
                console.log(`Fetched ${idStr}`);
            }
        } catch (err) {
            console.warn(`Failed ${idStr}: ${err.message}`);
        }
    }

    await fs.writeFile(OUTPUT_PATH, JSON.stringify(results, null, 2));
    console.log(`Saved ${results.length} enemies to ${OUTPUT_PATH}`);
}

run().catch(err => {
    console.error('Fatal error:', err.message);
});
