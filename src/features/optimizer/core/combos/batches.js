import {
    ECHO_OPTIMIZER_BATCH_SIZE_DEFAULT,
    ECHO_OPTIMIZER_MAX_COST,
    ECHO_OPTIMIZER_MAX_SIZE
} from "../misc/index.js";

export function countEchoCombos({
    echoes,
    maxCost = ECHO_OPTIMIZER_MAX_COST,
    maxSize = ECHO_OPTIMIZER_MAX_SIZE,
    lockedEchoId = null,
    countMode = "rows",
}) {
    return new Promise(resolve => {
        const worker = new Worker(
            new URL("../workers/countCombos.worker.js", import.meta.url),
            { type: "module" }
        );
        worker.onmessage = e => {
            resolve(e.data.total);
            worker.terminate();
        };

        worker.postMessage({ echoes, maxCost, maxSize, lockedEchoId, countMode });
    });
}

export function* generateEchoCombinationBatches({
    echoes,
    maxCost = ECHO_OPTIMIZER_MAX_COST,
    maxSize = ECHO_OPTIMIZER_MAX_SIZE,
    batchSize = ECHO_OPTIMIZER_BATCH_SIZE_DEFAULT,
    lockedEchoId = null,
    lockedEchoIndex = null,
}) {
    const n = echoes.length;
    const costArr = echoes.map(e => e.cost || 0);

    // Resolve locked echo to a concrete index in echoes[].
    const lockedIndex = Number.isInteger(lockedEchoIndex)
        ? lockedEchoIndex
        : (lockedEchoId == null ? null : echoes.findIndex(e => e.id === lockedEchoId));

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

    function* emitCombo() {
        const offset = cursor * maxSize;
        scratch.set(combo, offset);
        cursor++;

        if (cursor >= batchSize) {
            yield scratch.slice(0, cursor * maxSize);
            cursor = 0;
        }
    }

    /**
     * depth: how many picks we’ve placed so far (0..maxSize)
     * start: next index in echoes[] we’re allowed to use (enforces strictly increasing → combinations)
     * costSum: current total cost
     * hasLocked: whether lockedIndex is already in this combo
     */
    function* dfs(depth, start, costSum, hasLocked) {
        if (depth === maxSize) {
            if (
                lockedIndex != null &&
                lockedIndex !== -1 &&
                !hasLocked
            ) {
                return;
            }

            yield* emitCombo();
            return;
        }

        for (let i = start; i < n; i++) {
            const newCost = costSum + costArr[i];
            if (newCost > maxCost) continue;

            combo[depth] = i;
            const nextHasLocked =
                hasLocked || (lockedIndex != null && i === lockedIndex);

            yield* dfs(depth + 1, i + 1, newCost, nextHasLocked);
        }
    }

    yield* dfs(0, 0, 0, false);

    const leftover = flush();
    if (leftover) yield leftover;
}
