const MAX_U32 = 0xFFFFFFFF;

function clampU32(value) {
    return value > MAX_U32 ? MAX_U32 : value;
}

export function buildCombinadicTable(n, kMax = 5) {
    const stride = kMax + 1;
    const out = new Uint32Array((n + 1) * stride);

    for (let i = 0; i <= n; i++) {
        out[i * stride + 0] = 1;
    }
    for (let k = 1; k <= kMax; k++) {
        out[0 * stride + k] = 0;
    }

    for (let i = 1; i <= n; i++) {
        for (let k = 1; k <= kMax; k++) {
            const without = out[(i - 1) * stride + k];
            const withItem = out[(i - 1) * stride + (k - 1)];
            out[i * stride + k] = clampU32(without + withItem);
        }
    }

    return out;
}

export function buildCombinadicIndexing({
    echoes,
    maxSize,
    lockedEchoId = null
}) {
    const n = echoes.length;
    let lockedIndex = -1;

    if (lockedEchoId != null) {
        for (let i = 0; i < n; i++) {
            if (echoes[i].id === lockedEchoId) {
                lockedIndex = i;
                break;
            }
        }
    }

    if (lockedEchoId != null && lockedIndex === -1) {
        return { totalCombos: 0 };
    }

    let comboK = maxSize;
    let indexMap;

    if (lockedIndex === -1) {
        indexMap = new Int32Array(n);
        for (let i = 0; i < n; i++) {
            indexMap[i] = i;
        }
    } else {
        comboK = maxSize - 1;
        indexMap = new Int32Array(n - 1);
        let cursor = 0;
        for (let i = 0; i < n; i++) {
            if (i === lockedIndex) continue;
            indexMap[cursor++] = i;
        }
    }

    const comboN = indexMap.length;
    const binom = buildCombinadicTable(comboN, maxSize);
    const stride = maxSize + 1;
    const totalCombos = binom[comboN * stride + comboK];

    return {
        totalCombos,
        comboN,
        comboK,
        lockedIndex,
        indexMap,
        binom,
    };
}

export function unrankCombinadic(index, comboIndexing, maxSize) {
    const {
        comboN,
        comboK,
        lockedIndex,
        indexMap,
        binom,
    } = comboIndexing;

    const stride = maxSize + 1;
    const out = new Array(maxSize).fill(-1);

    let rank = index >>> 0;
    let start = 0;
    let remainingK = comboK;

    for (let pos = 0; pos < comboK; pos++) {
        for (let i = start; i < comboN; i++) {
            const remaining = comboN - i - 1;
            const count = binom[remaining * stride + (remainingK - 1)];
            if (rank >= count) {
                rank -= count;
                continue;
            }
            out[pos] = indexMap[i];
            start = i + 1;
            remainingK -= 1;
            break;
        }
    }

    if (lockedIndex >= 0 && comboK < maxSize) {
        out[maxSize - 1] = lockedIndex;
    }

    return out;
}
