import {
    snapToNearestSubstatValue,
    validSubstatRanges,
} from "@/utils/echoHelper.js";
import { getSubstatScore } from "./substats.js";

const ER_RANGE = validSubstatRanges.energyRegen;
const ER_POSSIBLE_ROLLS = (() => {
    const step = (ER_RANGE.max - ER_RANGE.min) / (ER_RANGE.divisions - 1);
    const arr = new Float32Array(ER_RANGE.divisions);
    for (let i = 0; i < ER_RANGE.divisions; i++) {
        arr[i] = Math.round((ER_RANGE.min + step * i) * 10) / 10;
    }
    return arr;
})();

function findBestERSplit(target, maxEchoes = 5, rollQuality = 0.5) {
    if (!ER_RANGE) return { sum: 0, combo: [] };
    if (target <= 0 || maxEchoes <= 0) {
        return { sum: 0, combo: Array(maxEchoes).fill(0) };
    }

    const targetIndex = Math.round(rollQuality * (ER_RANGE.divisions - 1));
    const windowStart = Math.max(0, targetIndex - 1);
    const windowEnd = Math.min(ER_RANGE.divisions - 1, targetIndex + 1);

    const rawER = ER_POSSIBLE_ROLLS.subarray(windowStart, windowEnd + 1);
    const ER = Array.from(rawER, (v) => snapToNearestSubstatValue("energyRegen", v));

    const maxPossible = ER[ER.length - 1] * maxEchoes;
    const clampedTarget = Math.min(target, maxPossible);

    let bestSum = Infinity;
    let bestCombo = [];

    const stack = [{ combo: [], sum: 0 }];
    const n = ER.length;
    const maxRoll = ER[n - 1];

    while (stack.length) {
        const { combo, sum } = stack.pop();

        if (sum >= clampedTarget) {
            if (sum < bestSum) {
                bestSum = sum;
                bestCombo = combo.slice();
            }
            continue;
        }

        if (combo.length === maxEchoes) continue;

        const remainingSlots = maxEchoes - combo.length;
        const maxReachable = sum + remainingSlots * maxRoll;
        if (maxReachable < clampedTarget) continue;

        for (let j = 0; j < n; j++) {
            const nextSum = sum + ER[j];
            if (nextSum >= bestSum) continue;

            const nextCombo = combo.concat(ER[j]);
            stack.push({ combo: nextCombo, sum: nextSum });
        }
    }

    if (!isFinite(bestSum) || !bestCombo.length) {
        bestCombo = Array(maxEchoes).fill(ER[0]);
        bestSum = ER[0] * maxEchoes;
    }

    return { sum: bestSum, combo: bestCombo };
}

function injectErIntoEcho(echo, erValue, statWeight, erKey = "energyRegen") {
    if (!erValue || erValue <= 0) return echo;

    const clone = { ...echo };
    const raw = echo.subStats ?? echo.substats ?? {};
    const subStats = { ...raw };

    const entries = Object.entries(subStats);

    if (Object.prototype.hasOwnProperty.call(subStats, erKey)) {
        subStats[erKey] = erValue;
        clone.subStats = subStats;
        return clone;
    }

    if (entries.length < 5) {
        subStats[erKey] = erValue;
        clone.subStats = subStats;
        return clone;
    }

    let worstKey = null;
    let worstScore = Infinity;

    for (const [key, value] of entries) {
        if (key === erKey) continue;
        const score = getSubstatScore(key, value, statWeight);
        if (score < worstScore) {
            worstScore = score;
            worstKey = key;
        }
    }

    if (worstKey != null) {
        delete subStats[worstKey];
    }
    subStats[erKey] = erValue;

    clone.subStats = subStats;
    return clone;
}

export function applyErPlanToEchoes({
    echoes,
    targetEnergyRegen,
    rollQuality,
    statWeight,
}) {
    if (!targetEnergyRegen || targetEnergyRegen <= 0) {
        return echoes;
    }

    const maxEchoes = echoes.length;

    const existingER = echoes.reduce((sum, echo) => {
        const ms = echo.mainStats ?? {};
        const ss = echo.subStats ?? echo.substats ?? {};
        return sum + (ms.energyRegen ?? 0) + (ss.energyRegen ?? 0);
    }, 0);

    const remainingTarget = Math.max(0, targetEnergyRegen - existingER);
    if (remainingTarget <= 0) {
        return echoes;
    }

    const erPlan = findBestERSplit(remainingTarget, maxEchoes, rollQuality);
    const erCombo = erPlan.combo;

    return echoes.map((echo, i) => {
        const erVal = erCombo[i] ?? 0;
        if (!erVal) return echo;
        return injectErIntoEcho(echo, erVal, statWeight, "energyRegen");
    });
}
