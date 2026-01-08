// Instant Echo Combo Counter Worker
// Counts COMBINATIONS of size maxSize, respecting cost & optional locked echo.
// Also derives how many *rows* the optimizer will evaluate:
// - no lock  → each combo produces maxSize rows (each echo main once)
// - with lock → each combo produces 1 row (locked echo as main)

import { ECHO_OPTIMIZER_MAX_COST, ECHO_OPTIMIZER_MAX_SIZE } from "../misc/config.js";

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

    // Locked echo indices (type-level lock, can match multiple echoes in the bag).
    const lockedIndices = [];
    if (lockedEchoId != null) {
        for (let i = 0; i < n; i++) {
            if (echoes[i].id === lockedEchoId) lockedIndices.push(i);
        }
    }

    // If lock was requested but nothing matched → 0 rows
    if (lockedEchoId != null && lockedIndices.length === 0) {
        self.postMessage({ total: 0, combos: 0 });
        return;
    }

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
        if (!lockedIndices.length) {
            const combos = combinadicCount(n, maxSize);
            self.postMessage({ total: combos * maxSize });
            return;
        }

        const combosPerMain = combinadicCount(n - 1, maxSize - 1);
        self.postMessage({ total: combosPerMain * lockedIndices.length });
        return;
    }

    const buildDpExcluding = (excludedIndex) => {
        const maxK = excludedIndex == null ? maxSize : (maxSize - 1);
        const dp = Array.from({ length: maxK + 1 }, () =>
            new Int32Array(maxCost + 1)
        );
        dp[0][0] = 1;

        for (let i = 0; i < n; i++) {
            if (excludedIndex != null && i === excludedIndex) continue;

            const cost = costs[i];
            for (let k = maxK - 1; k >= 0; k--) {
                const dpCur = dp[k];
                const dpNext = dp[k + 1];
                for (let c = 0; c + cost <= maxCost; c++) {
                    const ways = dpCur[c];
                    if (ways !== 0) {
                        dpNext[c + cost] += ways;
                    }
                }
            }
        }

        return dp;
    };

    // -------- Case A: NO locked echo --------
    if (!lockedIndices.length) {
        const dp = buildDpExcluding(null);
        let combos = 0;
        const row = dp[maxSize];
        for (let c = 0; c <= maxCost; c++) combos += row[c];
        const total = countMode === "combos" ? combos : combos * maxSize;
        self.postMessage({ total });
        return;
    }

    // -------- Case B: locked echo type (can match multiple indices) --------
    let totalCombos = 0;
    for (const lockedIndex of lockedIndices) {
        const lockedCost = costs[lockedIndex];
        const remaining = maxCost - lockedCost;
        if (remaining < 0) continue;

        const dp = buildDpExcluding(lockedIndex);
        let combosForMain = 0;
        const row = dp[maxSize - 1];
        for (let c = 0; c <= remaining; c++) combosForMain += row[c];
        totalCombos += combosForMain;
    }

    self.postMessage({ total: totalCombos });
};
