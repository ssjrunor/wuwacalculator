import { ECHO_STAT_ORDER } from "../misc/utils.js";
import { mainEchoBuffs } from "@/data/buffs/setEffect.js";
import { OPTIMIZER_MAIN_ECHO_BUFFS_PER_ECHO } from "../misc/index.js";

export const STAT_LABELS = {
    atk: "Total ATK",
    hp: "Total HP",
    def: "Total DEF",
    critRate: "CRIT Rate",
    critDmg: "CRIT DMG",
    energyRegen: "Energy Regen",
    dmgBonus: "DMG Bonus",
    damage: "Damage",
};

export const STAT_LIST = Object.entries(STAT_LABELS);

export function encodeEchoStats(echoes) {
    const count = echoes.length;
    const statCount = ECHO_STAT_ORDER.length;

    const stats = new Float32Array(count * statCount);
    const sets  = new Float32Array(count);
    const costs = new Float32Array(count);

    for (let i = 0; i < count; i++) {
        const e = echoes[i];

        sets[i]  = e.selectedSet ?? 0;
        costs[i] = e.cost ?? 0;

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
        sets,
        costs,
        count
    };
}

export function buildMainEchoBuffsArray(reverseIds, echoes, charId) {
    const BUFFS_PER_ECHO = OPTIMIZER_MAIN_ECHO_BUFFS_PER_ECHO;
    const out = new Float32Array(reverseIds.length * BUFFS_PER_ECHO);


    for (let i = 0; i < reverseIds.length; i++) {
        const echoIndex = reverseIds[i];
        const echo = echoes[echoIndex];

        const entry = mainEchoBuffs[String(echo.id)] ?? null;
        const base = i * BUFFS_PER_ECHO;
        let buffs = {};

        // always
        if (entry?.always) {
            Object.assign(buffs, entry.always);
        }

        // toggleable (apply because optimizer-ui must assume "enabled")
        if (entry?.toggleable && entry?.toggleable.buffs) {
            Object.assign(buffs, entry.toggleable.buffs);
        }

        // stackable (apply max stacks)
        if (entry?.stackable) {
            const { max, buffsPerStack } = entry.stackable;
            for (const k in buffsPerStack) {
                buffs[k] = (buffs[k] || 0) + buffsPerStack[k] * max;
            }
        }

        if (echo.id === '6000106' && ['1409', '1406', '1408'].includes(charId)) {
            buffs.aero = (buffs.aero ?? 0) + 10;
        }

        if (echo.id === '6000191' && charId === '1210') buffs.resonanceLiberation = (buffs.resonanceLiberation ?? 0) + 20;

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

export function buildStatConstraintArray(constraints) {
    const STAT_COUNT = STAT_LIST.length;
    const arr = new Float32Array(STAT_COUNT * 2);

    for (let i = 0; i < STAT_LIST.length; i++) {
        const [key] = STAT_LIST[i];
        const c = constraints[key] ?? {};

        const min = Number.isFinite(c.minTotal) ? c.minTotal : -Infinity;
        const max = Number.isFinite(c.maxTotal) ? c.maxTotal : +Infinity;

        const offset = i * 2;
        arr[offset] = min;
        arr[offset + 1] = max;
    }

    return arr;
}

export function buildEchoKindIdArray(echoes) {
    const arr = new Int32Array(echoes.length);
    for (let i = 0; i < echoes.length; i++) {
        arr[i] = echoes[i]?.id ?? -1;
    }
    return arr;
}
