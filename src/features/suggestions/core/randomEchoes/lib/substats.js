import {
    snapToNearestSubstatValue,
    validSubstatRanges,
} from "@/utils/echoHelper.js";

const round1 = (n) => Math.round(n * 10) / 10;

export function randomSubValue(statKey, rollQuality = 0) {
    const range = validSubstatRanges[statKey];
    if (!range) return 0;

    const step = (range.max - range.min) / (range.divisions - 1);
    const targetIndex = Math.round(rollQuality * (range.divisions - 1));
    const windowStart = Math.max(0, targetIndex - 1);
    const windowEnd = Math.min(range.divisions - 1, targetIndex + 1);

    const randomIndex =
        Math.floor(Math.random() * (windowEnd - windowStart + 1)) + windowStart;
    const value = range.min + step * randomIndex;

    return snapToNearestSubstatValue(statKey, round1(value));
}

export function getRandomSubstat(
    bias = 0.5,
    includeEnergyRegen = false,
    statWeight,
) {
    const weights = statWeight ?? {};
    const allKeys = Object.keys(validSubstatRanges);

    const filteredKeys = allKeys.filter(
        (k) => includeEnergyRegen || k !== "energyRegen",
    );

    const nonZeroKeys = filteredKeys.filter((k) => (weights[k] ?? 0) > 0);
    const zeroKeys = filteredKeys.filter((k) => (weights[k] ?? 0) <= 0);

    if (
        includeEnergyRegen &&
        !nonZeroKeys.includes("energyRegen") &&
        filteredKeys.includes("energyRegen")
    ) {
        nonZeroKeys.push("energyRegen");
        const idx = zeroKeys.indexOf("energyRegen");
        if (idx !== -1) zeroKeys.splice(idx, 1);
    }

    const baseChance = 0.6;
    const scaledChance = baseChance * 1.3 * bias;
    const pickNonZero = Math.random() < scaledChance;

    let chosenPool;
    if (pickNonZero && nonZeroKeys.length) {
        chosenPool = nonZeroKeys;
    } else {
        chosenPool = filteredKeys;
    }

    let total = 0;
    let count = 0;
    for (const k of chosenPool) {
        total += weights[k] ?? 0;
        count++;
    }
    const avg = total / (count || 1);

    const adjusted = new Array(chosenPool.length);
    let totalWeight = 0;

    for (let i = 0; i < chosenPool.length; i++) {
        const k = chosenPool[i];
        const base = weights[k] ?? 0;
        const w = avg + (base - avg) * bias + 0.05;
        adjusted[i] = [k, Math.max(w, 0.05)];
        totalWeight += adjusted[i][1];
    }

    let roll = Math.random() * totalWeight;
    for (let i = 0; i < adjusted.length; i++) {
        roll -= adjusted[i][1];
        if (roll <= 0) return adjusted[i][0];
    }

    return adjusted[adjusted.length - 1][0];
}

export function getSubstatScore(key, value, statWeight) {
    const w = Number(statWeight?.[key] ?? 0);
    return w * value;
}
