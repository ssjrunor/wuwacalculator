export const DEFAULT_CHAR_SET_PART_SELECTION = {
    1: {
        twoPiece: true,
        frost5pc: true,
    },
    2: {
        twoPiece: true,
        molten5: true,
    },
    3: {
        twoPiece: true,
        void5pc: true,
    },
    4: {
        twoPiece: true,
        sierra5: true,
    },
    5: {
        twoPiece: true,
        celestial5: true,
    },
    6: {
        twoPiece: true,
        eclipse5pc: true,
    },
    7: {
        twoPiece: true,
        rejuvenating5: true,
    },
    8: {
        twoPiece: true,
    },
    9: {
        twoPiece: true,
        fivePiece: true,
        lingering5p1: true,
    },
    10: {
        twoPiece: true,
        frosty5p1: true,
        frosty5p2: true,
    },
    11: {
        twoPiece: true,
        radiance5p1: true,
        radiance5p2: true,
    },
    12: {
        twoPiece: true,
    },
    13: {
        twoPiece: true,
        fivePiece: true,
        empyrean5: true,
    },
    14: {
        twoPiece: true,
        fivePiece: true,
    },
    16: {
        twoPiece: true,
        welkin5: true,
    },
    17: {
        twoPiece: true,
        windward5: true,
    },
    18: {
        twoPiece: true,
        clawprint5: true,
    },
    19: {
        dreamOfTheLost3pc: true,
    },
    20: {
        crownOfValor3pc: true,
    },
    21: {
        lawOfHarmony3p: true,
    },
    22: {
        flamewingsShadow2pcP1: true,
        flamewingsShadow2pcP2: true,
    },
    23: {
        threadOfSeveredFate3pc: true,
    },
    24: {
        twoPiece: true,
    },
    25: {
        twoPiece: true,
        starryRadiance5pc: true,
    },
    26: {
        twoPiece: true,
        gildedRevelationStacks: true,
        gildedRevelationBasicBuff: true,
    },
    27: {
        twoPiece: true,
        trailblazingStar5pc: true,
    },
    28: {
        twoPiece: true,
        chromaticFoamSelf: true,
    },
    29: {
        twoPiece: true,
        soundOfTrueName5pc: true,
    },
};

const BIT_WORD_SIZE = 32;
const COMPACT_ENCODING = 'bitset-v1';
const DEFAULT_COMPACT_VERSION = 1;
const compactIndexCache = new WeakMap();

export function convertRawCharSetDataToCompact(rawSelection = DEFAULT_CHAR_SET_PART_SELECTION) {
    const source = (rawSelection && typeof rawSelection === 'object')
        ? rawSelection
        : {};

    const setIds = Object.keys(source)
        .map((setId) => Number(setId))
        .filter((setId) => Number.isFinite(setId))
        .sort((a, b) => a - b);

    const keys = [];
    const keyToBit = new Map();

    for (const setId of setIds) {
        const setParts = source[setId];
        if (!setParts || typeof setParts !== 'object') continue;

        for (const [partKey, checked] of Object.entries(setParts)) {
            if (typeof checked !== 'boolean') continue;
            if (keyToBit.has(partKey)) continue;
            keyToBit.set(partKey, keys.length);
            keys.push(partKey);
        }
    }

    const wordsPerSet = Math.ceil(keys.length / BIT_WORD_SIZE);
    const masks = new Array(setIds.length * wordsPerSet).fill(0);

    for (let row = 0; row < setIds.length; row++) {
        const setId = setIds[row];
        const setParts = source[setId];
        if (!setParts || typeof setParts !== 'object') continue;

        for (const [partKey, checked] of Object.entries(setParts)) {
            if (!checked) continue;
            const bitIndex = keyToBit.get(partKey);
            if (bitIndex == null) continue;

            const wordIndex = bitIndex >>> 5;
            const bitMask = (1 << (bitIndex & 31)) >>> 0;
            const offset = row * wordsPerSet + wordIndex;
            masks[offset] = ((masks[offset] >>> 0) | bitMask) >>> 0;
        }
    }

    return {
        version: DEFAULT_COMPACT_VERSION,
        encoding: COMPACT_ENCODING,
        keys,
        setIds,
        wordsPerSet,
        masks,
    };
}

export function isCompactCharSetData(value) {
    return !!value
        && typeof value === 'object'
        && value.encoding === COMPACT_ENCODING
        && Array.isArray(value.keys)
        && Array.isArray(value.setIds)
        && Array.isArray(value.masks)
        && Number.isInteger(value.wordsPerSet)
        && value.wordsPerSet >= 0;
}

function getCompactIndexes(compactSelection) {
    if (!isCompactCharSetData(compactSelection)) return null;
    const cached = compactIndexCache.get(compactSelection);
    if (cached) return cached;

    const setRowById = new Map(
        compactSelection.setIds.map((setId, row) => [Number(setId), row])
    );
    const bitByKey = new Map(
        compactSelection.keys.map((partKey, bitIndex) => [partKey, bitIndex])
    );

    const indexes = { setRowById, bitByKey };
    compactIndexCache.set(compactSelection, indexes);
    return indexes;
}

export function getCompactCharSetPart(compactSelection, setId, partKey, fallback = false) {
    if (!isCompactCharSetData(compactSelection)) return fallback;
    if (compactSelection.wordsPerSet === 0) return fallback;

    const indexes = getCompactIndexes(compactSelection);
    if (!indexes) return fallback;

    const row = indexes.setRowById.get(Number(setId));
    const bitIndex = indexes.bitByKey.get(partKey);
    if (row == null || bitIndex == null) return fallback;

    const wordIndex = bitIndex >>> 5;
    if (wordIndex >= compactSelection.wordsPerSet) return fallback;

    const offset = row * compactSelection.wordsPerSet + wordIndex;
    if (offset < 0 || offset >= compactSelection.masks.length) return fallback;

    const word = compactSelection.masks[offset] >>> 0;
    return ((word >>> (bitIndex & 31)) & 1) === 1;
}

export function withCompactCharSetUpdates(compactSelection, updates = []) {
    const base = isCompactCharSetData(compactSelection)
        ? compactSelection
        : convertRawCharSetDataToCompact(compactSelection ?? {});

    if (!Array.isArray(updates) || updates.length === 0) return base;
    if (base.wordsPerSet === 0) return base;

    const indexes = getCompactIndexes(base);
    if (!indexes) return base;

    const nextMasks = base.masks.slice();
    let changed = false;

    for (const update of updates) {
        const setId = Number(update?.setId);
        const partKey = update?.partKey;
        const checked = Boolean(update?.checked);
        if (!Number.isFinite(setId) || typeof partKey !== 'string') continue;

        const row = indexes.setRowById.get(setId);
        const bitIndex = indexes.bitByKey.get(partKey);
        if (row == null || bitIndex == null) continue;

        const wordIndex = bitIndex >>> 5;
        if (wordIndex >= base.wordsPerSet) continue;

        const offset = row * base.wordsPerSet + wordIndex;
        if (offset < 0 || offset >= nextMasks.length) continue;

        const bitMask = (1 << (bitIndex & 31)) >>> 0;
        const prev = nextMasks[offset] >>> 0;
        const next = checked
            ? ((prev | bitMask) >>> 0)
            : ((prev & ((~bitMask) >>> 0)) >>> 0);

        if (next !== prev) {
            nextMasks[offset] = next;
            changed = true;
        }
    }

    if (!changed) return base;

    return {
        ...base,
        masks: nextMasks,
    };
}

export const charSetData = {
    '1506': {
        22: {
            flamewingsShadow2pcP1: false
        },
        19: {
            dreamOfTheLost3pc: false
        },
        20: {
            crownOfValor3pc: false
        },
        27: {
            trailblazingStar5pc: false
        },
        21: {
            lawOfHarmony3p: false
        },
        23: {
            threadOfSeveredFate3pc: false
        },
    }
};

function cloneRawSelection(rawSelection = {}) {
    const out = {};
    for (const [setId, setParts] of Object.entries(rawSelection)) {
        out[setId] = { ...(setParts ?? {}) };
    }
    return out;
}

export function loadCharSetData(charId = null) {
    const mergedRaw = cloneRawSelection(DEFAULT_CHAR_SET_PART_SELECTION);
    if (charId == null) {
        return convertRawCharSetDataToCompact(mergedRaw);
    }

    const overrides = charSetData[String(charId)];
    if (!overrides || typeof overrides !== 'object') {
        return convertRawCharSetDataToCompact(mergedRaw);
    }

    for (const [setId, setParts] of Object.entries(overrides)) {
        if (!setParts || typeof setParts !== 'object') continue;
        mergedRaw[setId] = {
            ...(mergedRaw[setId] ?? {}),
            ...setParts,
        };
    }

    return convertRawCharSetDataToCompact(mergedRaw);
}
