import { TopKHeap } from "../misc/utils.js";

const MAX_CANDIDATE_LIMIT = 0x10000;

export function createProgressTracker({ totalForProgress = 0, mainFactor = 1, onProgress }) {
    let totalProcessed = 0;
    const startTime = performance.now();
    let lastUpdateTime = startTime;
    let avgSpeed = 0;
    let speedSamples = 0;

    return function applyProgress(comboDelta) {
        totalProcessed += comboDelta * mainFactor;

        const now = performance.now();
        const elapsedSinceLast = now - lastUpdateTime;

        if (elapsedSinceLast > 0) {
            const speed = (comboDelta * mainFactor) / elapsedSinceLast;
            avgSpeed = (avgSpeed * speedSamples + speed) / (speedSamples + 1);
            speedSamples++;
            lastUpdateTime = now;
        }

        if (!onProgress) return;

        let remainingMs = Infinity;
        if (avgSpeed > 0) {
            const combosLeft = Math.max(0, totalForProgress - totalProcessed);
            remainingMs = combosLeft / avgSpeed;
        }

        const progress = totalForProgress > 0
            ? totalProcessed / totalForProgress
            : 0;

        onProgress({
            progress,
            elapsedMs: now - startTime,
            remainingMs,
            processed: totalProcessed,
            speed: avgSpeed * 1000,
        });
    };
}

function clampCandidateLimit(limit, oversample) {
    const baseLimit = Math.max(1, Math.floor(limit ?? 1));
    return Math.min(
        Math.max(Math.floor(baseLimit * oversample), baseLimit),
        MAX_CANDIDATE_LIMIT
    );
}

export function mapIdsToUids(ids, echoes) {
    return ids.map((idx) => {
        if (idx < 0) return null;
        const echo = echoes?.[idx];
        return echo?.uid ?? null;
    });
}

function packKey(a, b, c, d, e) {
    const A = BigInt(a >>> 0);
    const B = BigInt(b >>> 0);
    const C = BigInt(c >>> 0);
    const D = BigInt(d >>> 0);
    const E = BigInt(e >>> 0);
    return (((((A << 32n) | B) << 32n | C) << 32n | D) << 32n) | E;
}

export function makeSortedKey5BigInt(a, b, c, d, e) {
    if (a > b) [a, b] = [b, a];
    if (c > d) [c, d] = [d, c];
    if (a > c) [a, c] = [c, a];
    if (b > d) [b, d] = [d, b];
    if (b > c) [b, c] = [c, b];
    let e0 = e;
    if (e0 < b) {
        if (e0 < a) {
            return packKey(e0, a, b, c, d);
        }
        return packKey(a, e0, b, c, d);
    }
    if (e0 < d) {
        if (e0 < c) {
            return packKey(a, b, e0, c, d);
        }
        return packKey(a, b, c, e0, d);
    }
    return packKey(a, b, c, d, e0);
}

export function createResultCollector({ resultsLimit, oversample = 1 }) {
    const candidateLimit = clampCandidateLimit(resultsLimit, oversample);
    const heap = new TopKHeap(candidateLimit);
    const globalBestBySet = new Map();
    const baseLimit = Math.max(1, Math.floor(resultsLimit ?? 1));

    const push = ({ dmg, ids }) => {
        if (!ids || dmg <= 0) return;

        const key = makeSortedKey5BigInt(ids[0], ids[1], ids[2], ids[3], ids[4]);
        const prev = globalBestBySet.get(key);

        if (prev == null || dmg > prev) {
            globalBestBySet.set(key, dmg);
            heap.push({ dmg, ids });
        }
    };

    const sorted = (limit = baseLimit) => heap.sorted().slice(0, limit);

    const toResults = ({ echoes, limit = baseLimit } = {}) =>
        sorted(limit).map(({ dmg, ids }) => ({
            ids,
            uids: mapIdsToUids(ids, echoes),
            damage: dmg,
        }));

    return { push, sorted, toResults, bestBySet: globalBestBySet };
}

export function mergePendingInt32Arrays(pending, pendingInts) {
    if (pending.length === 1) return pending[0];

    const merged = new Int32Array(pendingInts);
    let off = 0;
    for (const b of pending) {
        merged.set(b, off);
        off += b.length;
    }
    return merged;
}

export async function flushPendingBatches({
    pending,
    pendingInts,
    runJob,
    applyProgress,
}) {
    if (pendingInts <= 0) {
        return { cancelled: false, pending, pendingInts };
    }

    const merged = mergePendingInt32Arrays(pending, pendingInts);

    const { cancelled, comboCount } = await runJob(merged);
    if (cancelled) {
        return { cancelled: true, pending: [], pendingInts: 0 };
    }

    if (applyProgress) {
        applyProgress(comboCount);
    }

    return { cancelled: false, pending: [], pendingInts: 0 };
}
