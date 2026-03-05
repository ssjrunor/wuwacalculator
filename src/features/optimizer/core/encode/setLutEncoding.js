import { OPTIMIZER_SET_SLOTS } from "../misc/config.js";
import { echoSets } from "@shared/constants/echoSetData2.js";

export const SET_CONST_LUT_SET_SLOTS = OPTIMIZER_SET_SLOTS;
export const SET_CONST_LUT_COUNT_BUCKETS = 4;
export const SET_CONST_LUT_BUCKET_THRESHOLDS = Object.freeze([0, 2, 3, 5]);

export const SET_CONST_LUT_STATS = Object.freeze([
    "atkP",
    "atkF",
    "hpP",
    "hpF",
    "defP",
    "defF",
    "critRate",
    "critDmg",
    "er",
    "basic",
    "heavy",
    "skill",
    "lib",
    "aero",
    "spectro",
    "fusion",
    "glacio",
    "havoc",
    "electro",
    "echoSkill",
    "coord",
    "bonusBase",
    "erSetBonus",
]);

const STAT_INDEX = {};
for (let i = 0; i < SET_CONST_LUT_STATS.length; i++) {
    STAT_INDEX[SET_CONST_LUT_STATS[i]] = i;
}

export const SET_CONST_LUT_STAT_INDEX = Object.freeze(STAT_INDEX);
export const SET_CONST_LUT_STAT_COUNT = SET_CONST_LUT_STATS.length;
export const SET_CONST_LUT_ROW_STRIDE = SET_CONST_LUT_STAT_COUNT;
export const SET_CONST_LUT_SIZE =
    SET_CONST_LUT_SET_SLOTS * SET_CONST_LUT_COUNT_BUCKETS * SET_CONST_LUT_ROW_STRIDE;

const LUT_PATH_TO_STAT = Object.freeze({
    "atk|percent": "atkP",
    "atk|flat": "atkF",
    "hp|percent": "hpP",
    "hp|flat": "hpF",
    "def|percent": "defP",
    "def|flat": "defF",
    "critRate": "critRate",
    "critDmg": "critDmg",
    "energyRegen": "erSetBonus",
    "skillType|basicAtk|dmgBonus": "basic",
    "skillType|heavyAtk|dmgBonus": "heavy",
    "skillType|resonanceSkill|dmgBonus": "skill",
    "skillType|resonanceLiberation|dmgBonus": "lib",
    "skillType|echoSkill|dmgBonus": "echoSkill",
    "skillType|coord|dmgBonus": "coord",
    "attribute|aero|dmgBonus": "aero",
    "attribute|spectro|dmgBonus": "spectro",
    "attribute|fusion|dmgBonus": "fusion",
    "attribute|glacio|dmgBonus": "glacio",
    "attribute|havoc|dmgBonus": "havoc",
    "attribute|electro|dmgBonus": "electro",
});

const SET_CONST_RULE_OVERRIDES = Object.freeze({
    22: Object.freeze([
        Object.freeze({ minPieces: 3, partKey: "flamewingsShadow2pcP1", fusion: 16 }),
    ]),
    23: Object.freeze([
        Object.freeze({ minPieces: 3, partKey: "threadOfSeveredFate3pc", atkP: 20, lib: 30 }),
    ]),
});

function getLutStatForPath(path) {
    if (!Array.isArray(path) || path.length === 0) return null;
    return LUT_PATH_TO_STAT[path.join("|")] ?? null;
}

function getPartMinPieces(setCfg, partKey) {
    if (partKey === "twoPiece") return 2;
    if (partKey === "fivePiece") return 5;
    return (setCfg?.setMax === 3) ? 3 : 5;
}

function getPartEntries(setCfg, partKey) {
    if (!setCfg || typeof setCfg !== "object" || typeof partKey !== "string") return [];

    if (partKey === "twoPiece") {
        return Array.isArray(setCfg.twoPiece) ? setCfg.twoPiece : [];
    }
    if (partKey === "fivePiece") {
        return Array.isArray(setCfg.fivePiece) ? setCfg.fivePiece : [];
    }

    const state = setCfg.states?.[partKey];
    if (!state || typeof state !== "object") return [];
    if (Array.isArray(state.max) && state.max.length) return state.max;
    if (Array.isArray(state.perStack) && state.perStack.length) return state.perStack;
    return [];
}

function buildRuleFromPart(setCfg, partKey) {
    const entries = getPartEntries(setCfg, partKey);
    if (!entries.length) return null;

    const rule = {
        minPieces: getPartMinPieces(setCfg, partKey),
        partKey,
    };

    let hasMappedStat = false;
    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const stat = getLutStatForPath(entry?.path);
        if (!stat) continue;
        const value = Number(entry?.value);
        if (!Number.isFinite(value)) continue;
        rule[stat] = (rule[stat] ?? 0) + value;
        hasMappedStat = true;
    }

    return hasMappedStat ? Object.freeze(rule) : null;
}

function mergeRulesWithOverrides(derivedRules, overrideRules) {
    if (!Array.isArray(overrideRules) || overrideRules.length === 0) {
        return derivedRules;
    }
    const merged = Array.isArray(derivedRules) ? [...derivedRules] : [];
    for (let i = 0; i < overrideRules.length; i++) {
        const override = overrideRules[i];
        const idx = merged.findIndex((rule) => rule?.partKey === override?.partKey);
        if (idx >= 0) {
            merged[idx] = override;
        } else {
            merged.push(override);
        }
    }
    return merged;
}

export function deriveSetConstRulesFromEchoSets(sourceEchoSets = echoSets) {
    const out = {};
    for (let setId = 0; setId < SET_CONST_LUT_SET_SLOTS; setId++) {
        const setCfg = sourceEchoSets?.[setId];
        const parts = setCfg?.parts;
        const rules = [];

        if (Array.isArray(parts)) {
            for (let p = 0; p < parts.length; p++) {
                const partKey = parts[p]?.key;
                if (typeof partKey !== "string") continue;
                const rule = buildRuleFromPart(setCfg, partKey);
                if (rule) rules.push(rule);
            }
        }

        const merged = mergeRulesWithOverrides(rules, SET_CONST_RULE_OVERRIDES[setId]);
        if (merged.length > 0) {
            out[setId] = Object.freeze(merged);
        }
    }
    return Object.freeze(out);
}

export const DEFAULT_SET_CONST_RULES = deriveSetConstRulesFromEchoSets();

export const SET_RUNTIME_TOGGLE_SET14_FIVE = 1 << 0;
export const SET_RUNTIME_TOGGLE_SET22_P1 = 1 << 1;
export const SET_RUNTIME_TOGGLE_SET22_P2 = 1 << 2;
export const SET_RUNTIME_TOGGLE_SET29_FIVE = 1 << 3;
export const SET_RUNTIME_TOGGLE_ALL =
    SET_RUNTIME_TOGGLE_SET14_FIVE |
    SET_RUNTIME_TOGGLE_SET22_P1 |
    SET_RUNTIME_TOGGLE_SET22_P2 |
    SET_RUNTIME_TOGGLE_SET29_FIVE;

function isCompactSetData(setData) {
    return !!setData
        && typeof setData === "object"
        && setData.encoding === "bitset-v1"
        && Array.isArray(setData.keys)
        && Array.isArray(setData.setIds)
        && Array.isArray(setData.masks)
        && Number.isInteger(setData.wordsPerSet)
        && setData.wordsPerSet >= 0;
}

function createSetDataLookup(setData) {
    if (!setData || typeof setData !== "object") return null;

    if (isCompactSetData(setData)) {
        return {
            mode: "compact",
            wordsPerSet: setData.wordsPerSet,
            masks: setData.masks,
            setRowById: new Map(setData.setIds.map((id, row) => [Number(id), row])),
            bitByKey: new Map(setData.keys.map((key, bit) => [key, bit])),
        };
    }

    return { mode: "raw", raw: setData };
}

function isSetPartEnabled(setDataLookup, setId, partKey) {
    if (!partKey || !setDataLookup) return true;

    if (setDataLookup.mode === "raw") {
        const setParts = setDataLookup.raw[setId] ?? setDataLookup.raw[String(setId)];
        if (!setParts || typeof setParts !== "object") return true;
        const value = setParts[partKey];
        return (typeof value === "boolean") ? value : true;
    }

    const row = setDataLookup.setRowById.get(Number(setId));
    const bit = setDataLookup.bitByKey.get(partKey);
    if (row == null || bit == null) return true;
    if (setDataLookup.wordsPerSet <= 0) return true;

    const word = bit >>> 5;
    if (word >= setDataLookup.wordsPerSet) return true;

    const offset = row * setDataLookup.wordsPerSet + word;
    if (offset < 0 || offset >= setDataLookup.masks.length) return true;

    const maskWord = setDataLookup.masks[offset] >>> 0;
    return ((maskWord >>> (bit & 31)) & 1) === 1;
}

export function buildSetRuntimeToggleMask(setData) {
    const setDataLookup = createSetDataLookup(setData);
    let mask = 0;

    if (isSetPartEnabled(setDataLookup, 14, "fivePiece")) {
        mask |= SET_RUNTIME_TOGGLE_SET14_FIVE;
    }
    if (isSetPartEnabled(setDataLookup, 22, "flamewingsShadow2pcP1")) {
        mask |= SET_RUNTIME_TOGGLE_SET22_P1;
    }
    if (isSetPartEnabled(setDataLookup, 22, "flamewingsShadow2pcP2")) {
        mask |= SET_RUNTIME_TOGGLE_SET22_P2;
    }
    if (isSetPartEnabled(setDataLookup, 29, "soundOfTrueName5pc")) {
        mask |= SET_RUNTIME_TOGGLE_SET29_FIVE;
    }

    return mask >>> 0;
}

export function getSetCountBucket(count) {
    return ((count >= 2) ? 1 : 0) + ((count >= 3) ? 1 : 0) + ((count >= 5) ? 1 : 0);
}

export function getSetConstLutRowOffset(setId, countBucket) {
    return ((setId * SET_CONST_LUT_COUNT_BUCKETS + countBucket) * SET_CONST_LUT_ROW_STRIDE);
}

export function buildSetConstLut(options = {}) {
    const rules = options.rules ?? DEFAULT_SET_CONST_RULES;
    const setDataLookup = createSetDataLookup(options.setData);
    const lut = new Float32Array(SET_CONST_LUT_SIZE);

    for (let setId = 0; setId < SET_CONST_LUT_SET_SLOTS; setId++) {
        const setRules = rules[setId];
        if (!Array.isArray(setRules) || setRules.length === 0) continue;

        for (let bucket = 1; bucket < SET_CONST_LUT_COUNT_BUCKETS; bucket++) {
            const thresholdCount = SET_CONST_LUT_BUCKET_THRESHOLDS[bucket];
            const base = getSetConstLutRowOffset(setId, bucket);

            for (let r = 0; r < setRules.length; r++) {
                const rule = setRules[r];
                const minPieces = rule?.minPieces ?? 0;
                if (thresholdCount < minPieces) continue;
                if (!isSetPartEnabled(setDataLookup, setId, rule?.partKey)) continue;

                for (const [stat, value] of Object.entries(rule)) {
                    if (stat === "minPieces" || stat === "partKey") continue;
                    const statIndex = SET_CONST_LUT_STAT_INDEX[stat];
                    if (statIndex == null) {
                        throw new Error(`buildSetConstLut: unknown stat "${stat}" for set ${setId}.`);
                    }
                    if (!Number.isFinite(value)) {
                        throw new Error(`buildSetConstLut: non-finite value for ${stat} in set ${setId}.`);
                    }
                    lut[base + statIndex] += value;
                }
            }
        }
    }

    return lut;
}
