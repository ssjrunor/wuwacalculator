import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { toCompactCharacter } from './charactersCompactProposal.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INDEX_URL = 'https://api.encore.moe/en/character';
const DETAIL_URL = (id, lang = 'en') => `https://api.encore.moe/${lang}/character/${id}`;
const OUTPUT_PATH = path.join(__dirname, '../characters-mapped.json');

// Set true to keep existing entries and only fetch missing ones.
const SKIP_EXISTING = false;

function toNumber(value) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
        const parsed = Number.parseFloat(value);
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
}

function normalizeName(nameField, fallback = '') {
    if (typeof nameField === 'string') return nameField;
    if (nameField && typeof nameField === 'object') {
        const content = nameField.Content ?? nameField.content;
        if (typeof content === 'string') return content;
    }
    return fallback;
}

function buildStatsFromProperties(properties = []) {
    if (!Array.isArray(properties) || !properties.length) return {};

    const propMap = {};
    for (const prop of properties) {
        const key = String(prop?.Name ?? '').trim().toLowerCase();
        propMap[key] = prop;
    }

    const hpProp = propMap.hp ?? propMap.life ?? null;
    const atkProp = propMap.atk ?? propMap.attack ?? null;
    const defProp = propMap.def ?? propMap.defense ?? null;

    const stage = {};

    const upsertValues = (growthValues, statKey) => {
        if (!Array.isArray(growthValues)) return;
        for (const row of growthValues) {
            const level = row?.level;
            const value = toNumber(row?.value);
            if (!Number.isFinite(level) || value == null) continue;
            const levelKey = String(level);
            if (!stage[levelKey]) stage[levelKey] = {};
            stage[levelKey][statKey] = value;
        }
    };

    upsertValues(hpProp?.GrowthValues, 'Life');
    upsertValues(atkProp?.GrowthValues, 'Atk');
    upsertValues(defProp?.GrowthValues, 'Def');

    if (!Object.keys(stage).length) return {};
    return { 0: stage };
}

function buildSkillLevel(skillAttributes = []) {
    if (!Array.isArray(skillAttributes) || !skillAttributes.length) return {};

    const level = {};
    skillAttributes.forEach((attr, idx) => {
        const key = String(attr?.attributeId ?? idx + 1);
        const values = Array.isArray(attr?.values)
            ? attr.values.map(v => String(v))
            : [];

        level[key] = {
            Name: attr?.attributeName ?? attr?.Name ?? `Attribute ${idx + 1}`,
            Param: [values]
        };
    });

    return level;
}

function buildSkillTreesFromEncore(detail = {}) {
    const out = {};
    const usedKeys = new Set();

    const nextKey = (base) => {
        let key = String(base);
        if (!usedKeys.has(key)) {
            usedKeys.add(key);
            return key;
        }
        let i = 1;
        while (usedKeys.has(`${key}_${i}`)) i += 1;
        const deduped = `${key}_${i}`;
        usedKeys.add(deduped);
        return deduped;
    };

    const skills = Array.isArray(detail?.Skills) ? detail.Skills : [];
    for (const skill of skills) {
        const key = nextKey(skill?.SkillId ?? `skill_${Object.keys(out).length + 1}`);
        const level = buildSkillLevel(skill?.SkillAttributes);

        out[key] = {
            NodeType: skill?.SkillType === 'Inherent Skill' ? 2 : 1,
            Skill: {
                Type: skill?.SkillType ?? '',
                Name: skill?.SkillName ?? '',
                Desc: skill?.SkillDescribe ?? '',
                Param: Array.isArray(skill?.SkillDetailNum)
                    ? skill.SkillDetailNum.map(v => String(v))
                    : [],
                ...(Object.keys(level).length ? { Level: level } : {})
            }
        };
    }

    const traceNodes = Array.isArray(detail?.SkillTree) ? detail.SkillTree : [];
    for (const node of traceNodes) {
        const key = nextKey(`trace_${node?.Id ?? Object.keys(out).length + 1}`);
        const desc = node?.PropertyNodeDescribe ?? '';
        const firstPercent = String(desc).match(/-?\d+(\.\d+)?%/);

        out[key] = {
            NodeType: 4,
            Skill: {
                Type: 'Trace Node',
                Name: node?.PropertyNodeTitle ?? '',
                Desc: desc,
                Param: firstPercent ? [firstPercent[0]] : []
            }
        };
    }

    return out;
}

function buildChainsFromEncore(detail = {}) {
    const chains = Array.isArray(detail?.ResonantChain) ? detail.ResonantChain : [];
    const out = {};

    chains.forEach((node, idx) => {
        const key = String(node?.GroupIndex ?? idx + 1);
        out[key] = {
            Name: node?.NodeName ?? '',
            Desc: node?.AttributesDescription ?? '',
            Param: Array.isArray(node?.AttributesDescriptionParams)
                ? node.AttributesDescriptionParams.map(v => String(v))
                : []
        };
    });

    return out;
}

export function normalizeEncoreCharacter(detail = {}, indexEntry = {}) {
    const element =
        (typeof detail?.ElementId === 'number' ? detail.ElementId : null) ??
        (typeof detail?.Element === 'number' ? detail.Element : null) ??
        (typeof detail?.Element?.Id === 'number' ? detail.Element.Id : null) ??
        (typeof indexEntry?.Element?.Id === 'number' ? indexEntry.Element.Id : 0);

    const weapon =
        (typeof detail?.WeaponType === 'number' ? detail.WeaponType : null) ??
        (typeof detail?.Weapon === 'number' ? detail.Weapon : null) ??
        (typeof detail?.WeaponType?.Id === 'number' ? detail.WeaponType.Id : null) ??
        (typeof indexEntry?.WeaponType?.Id === 'number' ? indexEntry.WeaponType.Id : 0);

    const rarity =
        (typeof detail?.Rarity === 'number' ? detail.Rarity : null) ??
        (typeof detail?.QualityId === 'number' ? detail.QualityId : null) ??
        (typeof indexEntry?.QualityId === 'number' ? indexEntry.QualityId : null);

    const compactCandidate = {
        Id: detail?.Id ?? indexEntry?.Id ?? null,
        Name: normalizeName(detail?.Name, indexEntry?.Name ?? ''),
        Element: element,
        Weapon: weapon,
        Rarity: rarity,
        Chains: buildChainsFromEncore(detail),
        SkillTrees: buildSkillTreesFromEncore(detail),
        Stats: buildStatsFromProperties(detail?.Properties),
        ...(detail?.StatsWeakness?.WeaknessMastery != null
            ? { StatsWeakness: { WeaknessMastery: detail.StatsWeakness.WeaknessMastery } }
            : {}),
        ...(detail?.StatWeakness?.WeaknessMastery != null
            ? { StatWeakness: { WeaknessMastery: detail.StatWeakness.WeaknessMastery } }
            : {})
    };

    return toCompactCharacter(compactCandidate);
}

async function loadEncoreIndex() {
    const res = await fetch(INDEX_URL);
    if (!res.ok) throw new Error(`Index fetch failed (${res.status})`);

    const payload = await res.json();
    const roleList = Array.isArray(payload?.roleList) ? payload.roleList : [];
    if (!roleList.length) {
        throw new Error('Encore index did not return roleList entries');
    }
    return roleList;
}

export async function fetchCharactersFromEncore() {
    const roleList = await loadEncoreIndex();
    const ids = roleList
        .map(entry => String(entry?.Id ?? ''))
        .filter(Boolean);
    const indexById = new Map(roleList.map(entry => [String(entry?.Id ?? ''), entry]));

    let existing = [];
    if (SKIP_EXISTING) {
        try {
            const raw = await fs.readFile(OUTPUT_PATH, 'utf8');
            existing = JSON.parse(raw);
        } catch {
            existing = [];
        }
    }

    const existingMap = new Map(
        existing.map(char => [String(char?.Id ?? ''), char]).filter(([id]) => id.length > 0)
    );
    const results = SKIP_EXISTING ? [...existing] : [];

    for (const id of ids) {
        if (SKIP_EXISTING && existingMap.has(id)) {
            console.log(`Skipping ${id} (already exists)`);
            continue;
        }

        try {
            const url = DETAIL_URL(id, 'en');
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const detail = await res.json();
            const normalized = normalizeEncoreCharacter(detail, indexById.get(id));

            if (!normalized?.Id || !normalized?.Name) {
                console.log(`Skipping ${id} (missing Id/Name after normalization)`);
                continue;
            }

            if (existingMap.has(id)) {
                const idx = results.findIndex(x => String(x?.Id ?? '') === id);
                if (idx >= 0) results[idx] = normalized;
                console.log(`Updated ${id}`);
            } else {
                results.push(normalized);
                console.log(`Fetched ${id}`);
            }
        } catch (err) {
            console.warn(`Failed ${id}: ${err.message}`);
        }
    }

    results.sort((a, b) => Number(a?.Id ?? 0) - Number(b?.Id ?? 0));
    await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(results, null, 2)}\n`, 'utf8');

    console.log(`Saved ${results.length} characters to ${OUTPUT_PATH}`);
    return results;
}

export const fetchCharacters = fetchCharactersFromEncore;

if (import.meta.url === `file://${process.argv[1]}`) {
    fetchCharactersFromEncore().catch((err) => {
        console.error('Failed to build character list:', err.message);
        process.exit(1);
    });
}
