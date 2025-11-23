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

export function* generateEchoPermutationBatches2({
                                                     echoes,
                                                     maxCost = 12,
                                                     maxSize = 5,
                                                     batchSize = 5000,
                                                     lockedEchoId = null,
                                                 }) {
    const n = echoes.length;
    const costArr = echoes.map(e => e.cost || 0);

    // Map locked ID → index in echoes[]
    const lockedIndex =
        lockedEchoId == null
            ? null
            : echoes.findIndex(e => e.id === lockedEchoId);

    // Early exit if locked echo alone already breaks cost
    if (
        lockedIndex != null &&
        lockedIndex !== -1 &&
        costArr[lockedIndex] > maxCost
    ) {
        return;
    }

    // current COMBINATION (indices into echoes[])
    const combo = new Int32Array(maxSize);

    // batching buffer
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

    /**
     * Emit one permutation of the current combination, with
     * `combo[mainPos]` forced into slot 0.
     *
     * Returns a batch Int32Array if the batch filled up,
     * otherwise null.
     */
    function emitPermutation(mainPos) {
        const base = cursor * maxSize;

        const mainIdx = combo[mainPos];
        scratch[base + 0] = mainIdx;

        let outPos = 1;
        for (let j = 0; j < maxSize; j++) {
            if (j === mainPos) continue;
            scratch[base + outPos] = combo[j];
            outPos++;
        }

        cursor++;

        if (cursor >= batchSize) {
            const out = scratch.slice(0, cursor * maxSize);
            cursor = 0;
            return out;
        }
        return null;
    }

    /**
     * depth: how many picks we’ve placed so far (0..maxSize)
     * start: next index in echoes[] we’re allowed to use (enforces strictly increasing → combinations)
     * costSum: current total cost
     * hasLocked: whether lockedIndex is already in this combo
     */
    function* dfs(depth, start, costSum, hasLocked) {
        if (depth === maxSize) {
            // If we require a locked echo, only emit if we actually used it
            if (
                lockedIndex != null &&
                lockedIndex !== -1 &&
                !hasLocked
            ) {
                return;
            }

            // We now have one full COMBINATION in combo[0..maxSize-1]
            if (lockedIndex == null || lockedIndex === -1) {
                // -------- No locked main: every echo gets a turn in slot 0 --------
                for (let mainPos = 0; mainPos < maxSize; mainPos++) {
                    const batch = emitPermutation(mainPos);
                    if (batch) {
                        yield batch;
                    }
                }
            } else {
                // -------- Locked echo: only it is allowed to be main --------
                let lockedPos = -1;
                for (let i = 0; i < maxSize; i++) {
                    if (combo[i] === lockedIndex) {
                        lockedPos = i;
                        break;
                    }
                }
                if (lockedPos === -1) {
                    // Shouldn't happen because hasLocked is true, but be safe
                    return;
                }

                const batch = emitPermutation(lockedPos);
                if (batch) {
                    yield batch;
                }
            }

            return;
        }

        // standard combinations DFS
        for (let i = start; i < n; i++) {
            const newCost = costSum + costArr[i];
            if (newCost > maxCost) continue;

            combo[depth] = i;
            const nextHasLocked =
                hasLocked || (lockedIndex != null && i === lockedIndex);

            yield* dfs(depth + 1, i + 1, newCost, nextHasLocked);
        }
    }

    // Kick off DFS: start at depth 0, index 0, cost 0, no locked yet
    yield* dfs(0, 0, 0, false);

    const leftover = flush();
    if (leftover) yield leftover;
}