// Instant Echo Combo Counter Worker
// Computes EXACT same count as your DFS but in milliseconds.

self.onmessage = e => {
    const { echoes, maxCost, maxSize, lockedEchoId } = e.data;

    const n = echoes.length;
    const costs = echoes.map(e => e.cost || 0);

    // Precompute factorials up to maxSize (K!) for permutations.
    const fact = [1];
    for (let i = 1; i <= maxSize; i++) {
        fact[i] = fact[i - 1] * i;
    }

    // Find locked echo index
    let lockedIndex = null;
    if (lockedEchoId != null) {
        for (let i = 0; i < n; i++) {
            if (echoes[i].id === lockedEchoId) {
                lockedIndex = i;
                break;
            }
        }
    }

    // If locked but not found — zero
    if (lockedEchoId != null && lockedIndex === null) {
        self.postMessage({ total: 0 });
        return;
    }

    // If locked and cost too high
    if (lockedIndex !== null && costs[lockedIndex] > maxCost) {
        self.postMessage({ total: 0 });
        return;
    }

    // ----------------------------------------------------------
    // DP SUBSET COUNTING
    // dp[k][c] = number of ways to choose k echoes with total cost exactly c
    // ----------------------------------------------------------

    // We need sizes up to maxSize or (maxSize-1) if locked.
    const maxK = lockedIndex === null ? maxSize : maxSize - 1;

    // dp array: (maxK+1) x (maxCost+1)
    const dp = Array.from({ length: maxK + 1 }, () =>
        new Int32Array(maxCost + 1)
    );
    dp[0][0] = 1; // one way to pick 0 items with cost 0

    // Build DP from all echoes except the locked one
    for (let i = 0; i < n; i++) {
        if (i === lockedIndex) continue; // skip locked echo

        const cost = costs[i];

        // Update from high k to low k to avoid reuse in same iteration
        for (let k = maxK - 1; k >= 0; k--) {
            const dpNext = dp[k + 1];
            const dpCur = dp[k];
            for (let c = 0; c + cost <= maxCost; c++) {
                const ways = dpCur[c];
                if (ways !== 0) {
                    dpNext[c + cost] += ways;
                }
            }
        }
    }

    let subsetCount = 0;

    if (lockedIndex === null) {
        // ------------------------------------------------------
        // Case A: no locked echo — use dp[maxSize][cost <= maxCost]
        // ------------------------------------------------------
        const row = dp[maxSize];
        for (let c = 0; c <= maxCost; c++) {
            subsetCount += row[c];
        }
    } else {
        // ------------------------------------------------------
        // Case B: locked echo fixed in slot 0
        // Remaining cost allowed:
        //   maxCost - cost(locked echo)
        // We need dp[maxSize-1][c <= remainingCost]
        // ------------------------------------------------------
        const lockedCost = costs[lockedIndex];
        const remain = maxCost - lockedCost;
        const row = dp[maxSize - 1];
        for (let c = 0; c <= remain; c++) {
            subsetCount += row[c];
        }
    }

    // Convert subset count → permutation count
    const k = maxSize;
    const total = subsetCount * fact[k];

    self.postMessage({ total });
};