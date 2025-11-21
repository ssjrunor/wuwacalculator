import { ECHO_STAT_ORDER } from "./optimizerUtils.js";
import {mainEchoBuffs} from "../data/buffs/setEffect.js";

export function encodeEchoStats(echoes) {
    const count = echoes.length;
    const statCount = ECHO_STAT_ORDER.length;

    const stats = new Float32Array(count * statCount);
    const costs = new Float32Array(count);
    const sets  = new Float32Array(count);

    for (let i = 0; i < count; i++) {
        const e = echoes[i];

        costs[i] = e.cost ?? 0;
        sets[i]  = e.selectedSet ?? 0;

        const base = i * statCount;

        for (let s = 0; s < statCount; s++) {
            const key = ECHO_STAT_ORDER[s];

            const m = e.mainStats?.[key] ?? 0;
            const sub = e.subStats?.[key] ?? 0;

            stats[base + s] = m + sub;
        }
    }

    return {
        stats,
        costs,
        sets,
        count
    };
}

export function buildMainEchoBuffsArray(reverseIds, echoes, charId) {
    const BUFFS_PER_ECHO = 15;
    const out = new Float32Array(reverseIds.length * BUFFS_PER_ECHO);


    for (let i = 0; i < reverseIds.length; i++) {
        const echoIndex = reverseIds[i];
        const echo = echoes[echoIndex];

        const entry = mainEchoBuffs[String(echo.id)] ?? null;
        const base = i * BUFFS_PER_ECHO;

        if (!entry) continue;

        let buffs = {};

        // always
        if (entry.always) {
            Object.assign(buffs, entry.always);
        }

        // toggleable (apply because optimizer-ui must assume "enabled")
        if (entry.toggleable && entry.toggleable.buffs) {
            Object.assign(buffs, entry.toggleable.buffs);
        }

        // stackable (apply max stacks)
        if (entry.stackable) {
            const { max, buffsPerStack } = entry.stackable;
            for (const k in buffsPerStack) {
                buffs[k] = (buffs[k] || 0) + buffsPerStack[k] * max;
            }
        }

        if (echo.id === '6000106' && ['1409', '1406', '1408'].includes(charId)) {
            buffs.aero = (buffs.aero ?? 0) + 10;
        }

        out[base]      = buffs.atkPercent   ?? 0;
        out[base + 1]  = buffs.atkFlat      ?? 0;
        out[base + 2]  = buffs.basicAtk     ?? 0;
        out[base + 3]  = buffs.heavyAtk     ?? 0;
        out[base + 4]  = buffs.resonanceSkill      ?? 0;
        out[base + 5]  = buffs.resonanceLiberation ?? 0;

        out[base + 6]  = buffs.aero    ?? 0;
        out[base + 7]  = buffs.glacio  ?? 0;
        out[base + 8]  = buffs.fusion  ?? 0;
        out[base + 9]  = buffs.spectro ?? 0;
        out[base + 10] = buffs.havoc   ?? 0;
        out[base + 11] = buffs.electro ?? 0;

        out[base + 12] = buffs.energyRegen ?? 0;
        out[base + 13] = buffs.echoSkill   ?? 0;
        out[base + 14] = buffs.coord       ?? 0;
    }

    return out;
}