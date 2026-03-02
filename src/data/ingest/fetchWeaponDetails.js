import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const weaponListUrl = 'https://api.encore.moe/en/weapon';
const weaponDetailBase = 'https://api.encore.moe/en/weapon/';
const outputPath = path.resolve(__dirname, '../weaponDetails.json');

function toNumber(value) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
        const parsed = Number.parseFloat(value.replace('%', ''));
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
}

function stripHtml(text = '') {
    return String(text)
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]*>/g, '')
        .trim();
}

function replaceFirst(haystack, needle, replacement) {
    if (!needle) return haystack;
    const index = haystack.indexOf(needle);
    if (index === -1) return haystack;
    return haystack.slice(0, index) + replacement + haystack.slice(index + needle.length);
}

function normalizeParams(descParams = []) {
    return descParams.map((entry) =>
        Array.isArray(entry?.ArrayString) ? entry.ArrayString.map(v => String(v)) : []
    );
}

function normalizeEffect(effectRaw = '', params = []) {
    let effect = stripHtml(effectRaw);
    params.forEach((group, index) => {
        const joined = group.join('/');
        if (!joined) return;
        effect = replaceFirst(effect, joined, `{${index}}`);
    });
    return effect;
}

function parseGrowthValue(rawValue, isRatio) {
    const raw = String(rawValue ?? '').trim();
    if (!raw) return null;

    const percent = raw.includes('%');
    const value = toNumber(raw);
    if (value == null) return null;

    if (percent && isRatio) return value / 100;
    if (percent && !isRatio) return value * 100;
    return value;
}

function buildGrowthMap(property, isRatio) {
    const map = new Map();
    const growth = Array.isArray(property?.GrowthValues) ? property.GrowthValues : [];

    for (const row of growth) {
        const level = Number(row?.Level ?? row?.level);
        if (!Number.isFinite(level)) continue;

        const value = parseGrowthValue(row?.Value ?? row?.value, isRatio);
        if (value == null) continue;

        map.set(level, value);
    }

    return map;
}

function getGrowthValue(map, level) {
    if (map.has(level)) return map.get(level);
    for (const [key, value] of map.entries()) {
        if (Math.abs(key - level) < 1e-6) return value;
    }
    return null;
}

function hasPercentGrowth(property) {
    const sample = property?.GrowthValues?.[0]?.Value ?? property?.GrowthValues?.[0]?.value ?? '';
    return String(sample).includes('%');
}

function buildStats(detail) {
    const properties = Array.isArray(detail?.Properties) ? detail.Properties : [];
    const primary = properties[0] ?? null;
    const secondary = properties[1] ?? null;

    const firstIsRatio = !!detail?.FirstPropId?.IsRatio;
    const secondIsRatio = !!detail?.SecondPropId?.IsRatio;

    const primaryMap = buildGrowthMap(primary, firstIsRatio);
    const secondaryMap = buildGrowthMap(secondary, secondIsRatio);

    const stageDefs = [
        [0, 1, 20],
        [1, 20, 40],
        [2, 40, 50],
        [3, 50, 60],
        [4, 60, 70],
        [5, 70, 80],
        [6, 80, 90]
    ];

    const stats = {};

    for (const [stage, min, max] of stageDefs) {
        const stageKey = String(stage);
        stats[stageKey] = {};

        for (let level = min; level <= max; level += 1) {
            const sourceLevel = stage === 0 ? level : (level === min ? level + 0.5 : level);

            const primaryValue = getGrowthValue(primaryMap, sourceLevel);
            if (primaryValue == null) continue;

            const rows = [{
                Name: primary?.Name ?? 'ATK',
                Value: primaryValue,
                IsRatio: firstIsRatio,
                IsPercent: !firstIsRatio && hasPercentGrowth(primary)
            }];

            const secondaryValue = getGrowthValue(secondaryMap, sourceLevel);
            if (secondaryValue != null) {
                rows.push({
                    Name: secondary?.Name ?? 'ATK',
                    Value: secondaryValue,
                    IsRatio: secondIsRatio,
                    IsPercent: !secondIsRatio && hasPercentGrowth(secondary)
                });
            }

            stats[stageKey][String(level)] = rows;
        }
    }

    return stats;
}

function buildAscensions(detail) {
    const out = {};
    const breaches = Array.isArray(detail?.Breaches) ? detail.Breaches : [];

    for (const breach of breaches) {
        const level = String(breach?.Level ?? Object.keys(out).length);
        const consume = Array.isArray(breach?.Consume)
            ? breach.Consume.map((entry) => ({ Key: entry?.Key, Value: entry?.Value }))
            : [];
        const gold = Number(breach?.GoldConsume ?? 0);

        out[level] = [...consume, { Key: 2, Value: gold }];
    }

    return out;
}

function toEncoreResourceUrl(assetPath, ext = 'png') {
    if (typeof assetPath !== 'string' || !assetPath) return '';
    if (assetPath.startsWith('http://') || assetPath.startsWith('https://')) return assetPath;

    const normalized = assetPath.split('.')[0];
    if (!normalized.startsWith('/Game/')) return '';
    return `https://api.encore.moe/resource/Data${normalized}.${ext}`;
}

function normalizeWeaponDetail(detail) {
    const id = Number(detail?.ItemId ?? detail?.Id);
    const name = detail?.WeaponName ?? detail?.Name ?? '';
    const params = normalizeParams(detail?.DescParams ?? []);

    const normalized = {
        Id: id,
        Rarity: Number(detail?.QualityId ?? detail?.Rarity ?? 1),
        Type: Number(detail?.WeaponType ?? detail?.Type ?? 0),
        Name: name,
        Desc: detail?.AttributesDescription ?? detail?.BgDescription ?? detail?.Desc ?? '',
        Effect: normalizeEffect(detail?.Desc ?? '', params),
        EffectName: detail?.ResonName ?? detail?.EffectName ?? '',
        Param: params,
        Icon: detail?.Icon ?? '',
        icon: toEncoreResourceUrl(detail?.Icon, 'png') || `https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon/T_IconWeapon_${id}_UI.png`,
        Model: detail?.Mesh ?? null,
        Stats: buildStats(detail),
        Ascensions: buildAscensions(detail)
    };

    return normalized;
}

async function fetchWeaponDetails() {
    try {
        console.log('Fetching weapon list...');
        const listResponse = await fetch(weaponListUrl);
        if (!listResponse.ok)
            throw new Error(`Failed to fetch weapon list: ${listResponse.status}`);
        const weaponListPayload = await listResponse.json();
        const weapons = Array.isArray(weaponListPayload?.weapons) ? weaponListPayload.weapons : [];
        const weaponIds = weapons.map(w => String(w?.Id ?? '')).filter(Boolean);

        // Load existing file if it exists
        let existingWeapons = [];
        try {
            const existingData = await fs.readFile(outputPath, 'utf8');
            existingWeapons = JSON.parse(existingData);
        } catch {
            // file may not exist, ignore
        }

        const weaponIndexById = new Map();
        const weaponDetails = existingWeapons.map((weapon, index) => {
            const id = String(weapon?.Id ?? weapon?.id);
            if (id) weaponIndexById.set(id, index);
            return weapon;
        });
        console.log(`Fetching details for ${weaponIds.length} weapons...`);

        for (const id of weaponIds) {
            // normalize id to string
            const idStr = String(id);

            try {
                const res = await fetch(`${weaponDetailBase}${idStr}`);
                if (!res.ok) throw new Error(`Failed to fetch weapon ${idStr}: ${res.status}`);
                const detail = await res.json();

                const projectionPrefixes = ['Projection:', 'Projection -', 'Projection-'];
                const weaponName = detail?.WeaponName ?? detail?.Name ?? '';
                if (projectionPrefixes.some(prefix => weaponName.startsWith(prefix))) {
                    console.log(`Skipping ${idStr} (${weaponName})`);
                    continue;
                }

                const normalized = normalizeWeaponDetail(detail);
                if (weaponIndexById.has(idStr)) {
                    weaponDetails[weaponIndexById.get(idStr)] = normalized;
                    console.log(`${idStr} updated`);
                } else {
                    weaponDetails.push(normalized);
                    console.log(`${idStr} loaded`);
                }
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
