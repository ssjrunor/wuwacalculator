// Instant Echo Combo Counter Worker
// Counts COMBINATIONS of size maxSize, respecting cost & optional locked echo.
// Also derives how many *rows* generateEchoPermutationBatches2() will emit:
// - no lock  → each combo produces maxSize rows (each echo main once)
// - with lock → each combo produces 1 row (locked echo as main)

import { ECHO_OPTIMIZER_MAX_COST, ECHO_OPTIMIZER_MAX_SIZE } from "../optimizerConfig.js";

self.onmessage = e => {
    const {
        echoes,
        maxCost = ECHO_OPTIMIZER_MAX_COST,
        maxSize = ECHO_OPTIMIZER_MAX_SIZE,
        lockedEchoId = null,
        countMode = "rows"
    } = e.data;

    const n = echoes.length;
    const costs = echoes.map(e => e.cost || 0);

    // Find locked echo index (if any). -1 = no lock.
    let lockedIndex = -1;
    if (lockedEchoId != null) {
        for (let i = 0; i < n; i++) {
            if (echoes[i].id === lockedEchoId) {
                lockedIndex = i;
                break;
            }
        }
    }

    // If lock was requested but not found → 0 combos
    if (lockedEchoId != null && lockedIndex === -1) {
        self.postMessage({ total: 0, combos: 0 });
        return;
    }

    // If locked exists but alone already violates cost → 0 combos
    if (lockedIndex !== -1 && costs[lockedIndex] > maxCost) {
        self.postMessage({ total: 0, combos: 0 });
        return;
    }

    // maxK = size of subset we DP over:
    //   - no lock: picking maxSize echoes from all
    //   - lock:    picking (maxSize - 1) from "others"
    const maxK = lockedIndex === -1 ? maxSize : maxSize - 1;

    const combinadicCount = (nVal, kVal) => {
        if (kVal < 0 || kVal > nVal) return 0;
        let num = 1;
        let den = 1;
        for (let i = 1; i <= kVal; i++) {
            num *= (nVal - (kVal - i));
            den *= i;
        }
        return Math.floor(num / den);
    };

    if (countMode === "combinadic") {
        const nAvail = lockedIndex === -1 ? n : n - 1;
        const k = lockedIndex === -1 ? maxSize : maxSize - 1;
        const combos = combinadicCount(nAvail, k);
        const totalRows = lockedIndex === -1 ? combos * maxSize : combos;
        self.postMessage({ total: totalRows });
        return;
    }

    // dp[k][c] = number of ways to pick k echoes (combinations)
    //            from the available pool with total cost exactly c.
    const dp = Array.from({ length: maxK + 1 }, () =>
        new Int32Array(maxCost + 1)
    );
    dp[0][0] = 1; // one way to pick 0 items with cost 0

    // Build DP from all echoes EXCEPT the locked one (if any)
    for (let i = 0; i < n; i++) {
        if (i === lockedIndex) continue;

        const cost = costs[i];

        // standard combinatorial DP: iterate k downward
        for (let k = maxK - 1; k >= 0; k--) {
            const dpCur = dp[k];
            const dpNext = dp[k + 1];

            // iterate cost upward
            for (let c = 0; c + cost <= maxCost; c++) {
                const ways = dpCur[c];
                if (ways !== 0) {
                    dpNext[c + cost] += ways;
                }
            }
        }
    }

    let comboCount = 0; // number of unique 5-echo sets

    if (lockedIndex === -1) {
        // -------- Case A: NO locked echo --------
        const row = dp[maxSize]; // choose exactly maxSize echoes
        for (let c = 0; c <= maxCost; c++) {
            comboCount += row[c];
        }
    } else {
        // -------- Case B: locked echo must be included --------
        const lockedCost = costs[lockedIndex];
        const remaining = maxCost - lockedCost;

        if (remaining < 0) {
            self.postMessage({ total: 0, combos: 0 });
            return;
        }

        const row = dp[maxSize - 1]; // we pick (maxSize - 1) from others
        for (let c = 0; c <= remaining; c++) {
            comboCount += row[c];
        }
    }

    let totalRows;
    if (lockedIndex === -1) {
        totalRows = comboCount * maxSize;
    } else {
        totalRows = comboCount;
    }

    const total = countMode === "combos" ? comboCount : totalRows;
    self.postMessage({ total });
};
