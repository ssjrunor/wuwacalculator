import weaponsSummary from './weapons.json';
import weaponDetails from './weaponDetails.json';
import { getWeaponOverride } from './weapons/behavior/index.js';
import { getWeaponUIComponent } from './weapons/ui/index.js';

/**
 * @typedef {string} WeaponId
 */

/**
 * @typedef {Object} WeaponConfig
 * @property {WeaponId} id
 * @property {string} name
 * @property {string | undefined} description
 * @property {number | undefined} rarity
 * @property {number | undefined} type
 * @property {string | undefined} icon        - Preferred icon URL.
 * @property {string | undefined} iconPath    - Local sprite path.
 * @property {string | undefined} model
 * @property {Object | undefined} stats       - Level/ascension stat tables.
 * @property {Object | undefined} ascensions
 * @property {string | undefined} effect
 * @property {string | undefined} effectName
 * @property {Array  | undefined} param
 * @property {{applyWeaponLogic?: Function, updateSkillMeta?: Function} | null} behaviourModule
 * @property {Function | null} uiComponent
 * @property {{summary?: any, detail?: any}} sources  - Raw source entries for traceability.
 */

// Index summaries by ID for quick lookup.
const summaryById = weaponsSummary.reduce((acc, entry) => {
    const id = String(entry.id ?? entry.Id);
    acc[id] = entry;
    return acc;
}, {});

/** @type {Record<WeaponId, WeaponConfig>} */
export const weaponRegistry = {};

/**
 * Build a normalized WeaponConfig from raw summary + detail.
 *
 * @param {WeaponId} id
 * @param {any | undefined} summary
 * @param {any | undefined} detail
 * @returns {WeaponConfig}
 */
function buildWeaponConfig(id, summary, detail) {
    const s = summary ?? {};
    const d = detail ?? {};

    return {
        id,
        name:
            d.Name ??
            s.Name ??
            s.name ??
            '',

        description:
            d.Desc ??
            s.Desc ??
            s.description ??
            undefined,

        rarity:
            d.Rarity ??
            s.Rarity ??
            s.rank ??
            undefined,

        type:
            d.Type ??
            s.Type ??
            s.type ??
            undefined,

        icon:
            s.icon ??
            d.icon ??
            d.Icon ??
            undefined,

        // Local icon path; adjust if your assets live elsewhere.
        iconPath: `/assets/weapon-icons/${id}.webp`,

        model: d.Model,

        stats: d.Stats,
        ascensions: d.Ascensions,

        effect: d.Effect,
        effectName: d.EffectName,
        param: d.Param,

        behaviourModule: getWeaponOverride(id),
        uiComponent: getWeaponUIComponent(id),

        sources: {
            summary: summary ?? null,
            detail: detail ?? null,
        },
    };
}

// First, build entries for everything that appears in weaponDetails.json.
const seenIds = new Set();

for (const detail of weaponDetails) {
    const id = String(detail.Id ?? detail.id);
    const summary = summaryById[id];
    weaponRegistry[id] = buildWeaponConfig(id, summary, detail);
    seenIds.add(id);
}

// Then, catch any summaries that did not appear in weaponDetails.json.
for (const entry of weaponsSummary) {
    const id = String(entry.id ?? entry.Id);
    if (seenIds.has(id)) continue;

    weaponRegistry[id] = buildWeaponConfig(id, entry, null);
}

/**
 * @param {WeaponId} weaponId
 * @returns {WeaponConfig | null}
 */
export function getWeaponConfig(weaponId) {
    return weaponRegistry[String(weaponId)] ?? null;
}
