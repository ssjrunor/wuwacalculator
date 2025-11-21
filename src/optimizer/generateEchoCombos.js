export function countEchoCombos({
                                    echoes,
                                    maxCost = 12,
                                    maxSize = 5,
                                    lockedEchoId = null
                                }) {
    return new Promise(resolve => {
        const worker = new Worker(
            new URL("./workers/CountCombosWorker.js", import.meta.url),
            { type: "module" }
        );
        worker.onmessage = e => {
            resolve(e.data.total);
            worker.terminate();
        };

        worker.postMessage({ echoes, maxCost, maxSize, lockedEchoId });
    });
}

export function* generateEchoComboBatches({
                                              echoes,
                                              maxCost = 12,
                                              maxSize = 5,
                                              batchSize = 5000,
                                              lockedEchoId = null
                                          }) {
    const count = echoes.length;
    const costArr = echoes.map(e => e.cost || 0);

    const lockedIndices = lockedEchoId == null
        ? []
        : echoes
            .map((e, i) => e.id === lockedEchoId ? i : -1)
            .filter(i => i !== -1);

    if (!lockedIndices.length) {
        yield* generateNormal();
        return;
    }

    for (const idx of lockedIndices) {
        yield* generateLocked(idx);
    }

    function* generateNormal() {
        const batchCapacity = batchSize * maxSize;
        let scratch = new Int32Array(batchCapacity);
        let cursor = 0;
        const combo = new Int32Array(maxSize);
        function* dfs(start, depth, costSum) {
            if (depth === maxSize) {
                const offset = cursor * maxSize;
                for (let k = 0; k < maxSize; k++) {
                    const offset = cursor * maxSize;

                    for (let p = 0; p < maxSize; p++) {
                        const src = (p + k) % maxSize;
                        scratch[offset + p] = combo[src];
                    }

                    cursor++;

                    if (cursor >= batchSize) {
                        yield scratch.slice(0, cursor * maxSize);
                        cursor = 0;
                    }
                }

                if (cursor >= batchSize) {
                    yield scratch.slice(0, cursor * maxSize);
                    cursor = 0;
                }
                return;
            }
            for (let i = start; i < count; i++) {
                const newCost = costSum + costArr[i];
                if (newCost > maxCost) continue;

                combo[depth] = i;
                yield* dfs(i + 1, depth + 1, newCost);
            }
        }
        yield* dfs(0, 0, 0);
        if (cursor > 0) {
            yield scratch.slice(0, cursor * maxSize);
        }
    }

    function* generateLocked(lockedIndex) {
        const batchCapacity = batchSize * maxSize;
        let scratch = new Int32Array(batchCapacity);
        let cursor = 0;
        const combo = new Int32Array(maxSize);
        combo[0] = lockedIndex;
        const initialCost = costArr[lockedIndex];
        function* dfs(start, depth, costSum) {
            if (depth === maxSize) {
                const offset = cursor * maxSize;
                scratch.set(combo, offset);
                cursor++;

                if (cursor >= batchSize) {
                    yield scratch.slice(0, cursor * maxSize);
                    cursor = 0;
                }
                return;
            }
            for (let i = start; i < count; i++) {
                if (i === lockedIndex) continue;

                const newCost = costSum + costArr[i];
                if (newCost > maxCost) continue;

                combo[depth] = i;
                yield* dfs(i + 1, depth + 1, newCost);
            }
        }
        yield* dfs(lockedIndex + 1, 1, initialCost);
        if (cursor > 0) {
            yield scratch.slice(0, cursor * maxSize);
        }
    }
}

export function* generateEchoPermutationBatches({
                                                    echoes,
                                                    maxCost = 12,
                                                    maxSize = 5,
                                                    batchSize = 5000,
                                                    lockedEchoId = null
                                                }) {
    const n = echoes.length;
    const costArr = echoes.map(e => e.cost || 0);

    // Map locked ID → index
    const lockedIndex =
        lockedEchoId == null
            ? null
            : echoes.findIndex(e => e.id === lockedEchoId);

    const used = new Array(n).fill(false);
    const combo = new Int32Array(maxSize);

    const batchCapacity = batchSize * maxSize;
    let scratch = new Int32Array(batchCapacity);
    let cursor = 0;

    function flush() {
        if (cursor > 0) {
            const out = scratch.slice(0, cursor * maxSize);
            cursor = 0;
            return out;
        }
    }

    function* emitCombo() {
        const offset = cursor * maxSize;
        scratch.set(combo, offset);
        cursor++;

        if (cursor >= batchSize) {
            yield scratch.slice(0, cursor * maxSize);
            cursor = 0;
        }
    }

    // ---------------------------------------------------
    // Case 1: NO locking → normal full permutation
    // ---------------------------------------------------
    if (lockedIndex === null || lockedIndex === -1) {
        yield* dfsFull(0, 0);
        const leftover = flush();
        if (leftover) yield leftover;
        return;
    }

    // ---------------------------------------------------
    // Case 2: Locking → slot 1 fixed to lockedIndex
    // ---------------------------------------------------
    // Mark locked echo as used
    used[lockedIndex] = true;

    const cost0 = costArr[lockedIndex];
    if (cost0 > maxCost) {
        // No valid permutations exist
        return;
    }

    // Put locked echo in slot 0
    combo[0] = lockedIndex;

    yield* dfsLocked(1, cost0);

    const leftover = flush();
    if (leftover) yield leftover;

    // ---------------------------------------------------
    // DFS: full permutations
    // ---------------------------------------------------
    function* dfsFull(depth, costSum) {
        if (depth === maxSize) {
            yield* emitCombo();
            return;
        }

        for (let i = 0; i < n; i++) {
            if (used[i]) continue;

            const newCost = costSum + costArr[i];
            if (newCost > maxCost) continue;

            used[i] = true;
            combo[depth] = i;

            yield* dfsFull(depth + 1, newCost);

            used[i] = false;
        }
    }

    // ---------------------------------------------------
    // DFS: permutations with slot 0 locked
    // ---------------------------------------------------
    function* dfsLocked(depth, costSum) {
        if (depth === maxSize) {
            yield* emitCombo();
            return;
        }

        for (let i = 0; i < n; i++) {
            if (used[i]) continue;

            const newCost = costSum + costArr[i];
            if (newCost > maxCost) continue;

            used[i] = true;
            combo[depth] = i;

            yield* dfsLocked(depth + 1, newCost);

            used[i] = false;
        }
    }
}