import {getEchoStatsFromEquippedEchoes, statLabelMap} from "../utils/echoHelper.js";
import {extractMainEchoBuffs} from "./EchoFilters.js";
import {getSetPlanFromEchoes} from "../data/buffs/setEffect.js";

export const ECHO_STAT_ORDER = [
    "atkPercent", "atkFlat",
    "hpPercent", "hpFlat",
    "defPercent", "defFlat",
    "critRate", "critDmg",
    "energyRegen", "healingBonus",
    "basicAtk",
    "heavyAtk",
    "resonanceSkill",
    "resonanceLiberation",
    "aero", "spectro", "fusion",
    "glacio", "havoc", "electro",
];

export const ECHO_STAT_COUNT = ECHO_STAT_ORDER.length;

export const SET_EFFECT_TABLE = {
    1: { maxPieces:5, two:{ glacio:10 }, five:{ glacio:30 }},
    2: { maxPieces:5, two:{ fusion:10 }, five:{ fusion:30 }},
    3: { maxPieces:5, two:{ electro:10 }, five:{ electro:30 }},
    4: { maxPieces:5, two:{ aero:10 }, five:{ aero:30 }},
    5: { maxPieces:5, two:{ spectro:10 }, five:{ spectro:30 }},
    6: { maxPieces:5, two:{ havoc:10 }, five:{ havoc:30 }},
    7: { maxPieces:5, two:{ healingBonus:10 }, five:{ atkPercent:15 }},
    8: { maxPieces:5, two:{ energyRegen:10 }},
    9: { maxPieces:5, two:{ atkPercent:10 }, five:{ atkPercent:20 }},
    10:{ maxPieces:5, two:{ resonaceSkill:12 }, five:{ glacio:22.5, resonanceSkill:36 }},
    11:{ maxPieces:5, two:{ spectro:10 }, five:{ critRate:20, spectro:15 }},
    12:{ maxPieces:5, two:{ havoc:10 }},
    13:{ maxPieces:5, two:{ energyRegen:10 }, five:{ atkPercent:20 }},
    14:{ maxPieces:5, two:{ energyRegen:10 }, five:{ atkPercent:10 }},
    16:{ maxPieces:5, two:{ aero:10 }, five:{ aero:30 }},
    17:{ maxPieces:5, two:{ aero:10 }, five:{ critRate:10, aero:30 }},
    18:{ maxPieces:5, two:{ fusion:10 }, five:{ fusion:15, resonanceLiberation:20 }},

    19:{ maxPieces:3, three:{ critRate:20, echoSkill:35 }},
    20:{ maxPieces:3, three:{ atkPercent:30, critDmg:20 }},
    21:{ maxPieces:3, three:{ heavyAtk:30, echoSkill:16 }},
    22:{ maxPieces:3, two:{ fusion:16 }, three:{ fusion:32 }},
    23:{ maxPieces:3, three:{ atkPercent:20, havoc:30 }},
};

function getSetPieceCounts(echoObjs) {
    const counts = {};
    for (const e of echoObjs) {
        const sid = e?.selectedSet;
        if (!sid) continue;
        counts[sid] = (counts[sid] || 0) + 1;
    }
    return counts;
}

export function getActiveSetEffects(echoObjs) {
    const counts = getSetPieceCounts(echoObjs);
    const total = {};

    for (const [setId, count] of Object.entries(counts)) {
        const cfg = SET_EFFECT_TABLE[setId];
        if (!cfg) continue;

        if (count >= 2 && cfg.two) {
            for (const [stat, val] of Object.entries(cfg.two)) {
                total[stat] = (total[stat] || 0) + val;
            }
        }

        // 3-piece
        if (count >= 3 && cfg.three) {
            for (const [stat, val] of Object.entries(cfg.three)) {
                total[stat] = (total[stat] || 0) + val;
            }
        }

        // 5-piece
        if (count >= 5 && cfg.five) {
            for (const [stat, val] of Object.entries(cfg.five)) {
                total[stat] = (total[stat] || 0) + val;
            }
        }
    }

    return total;
}

export class TopKHeap {
    constructor(k) {
        this.k = k;
        this.heap = [];
    }

    push(entry) {
        if (this.heap.length < this.k) {
            this._pushHeap(entry);
            return;
        }

        if (entry.dmg > this.heap[0].dmg) {
            this.heap[0] = entry;
            this._siftDown(0);
        }
    }

    _pushHeap(entry) {
        this.heap.push(entry);
        this._siftUp(this.heap.length - 1);
    }

    _siftUp(i) {
        while (i > 0) {
            const parent = (i - 1) >> 1;
            if (this.heap[i].dmg >= this.heap[parent].dmg) break;
            [this.heap[i], this.heap[parent]] = [this.heap[parent], this.heap[i]];
            i = parent;
        }
    }

    _siftDown(i) {
        const n = this.heap.length;
        while (true) {
            let smallest = i;
            const left = 2 * i + 1;
            const right = 2 * i + 2;

            if (left < n && this.heap[left].dmg < this.heap[smallest].dmg) {
                smallest = left;
            }
            if (right < n && this.heap[right].dmg < this.heap[smallest].dmg) {
                smallest = right;
            }

            if (smallest === i) break;

            [this.heap[i], this.heap[smallest]] = [this.heap[smallest], this.heap[i]];
            i = smallest;
        }
    }

    sorted() {
        return [...this.heap].sort((a, b) => b.dmg - a.dmg);
    }
}

export function resolveEchoesFromIds(ids, echoes) {
    return ids.map(i => i >= 0 ? echoes[i] : null);
}

export function resolveIdsFromEchoes(echoObjs, echoes) {
    const idToIndex = new Map();
    for (let i = 0; i < echoes.length; i++) {
        const e = echoes[i];
        if (!e || e.id == null) continue;
        idToIndex.set(e.id, i);
    }

    return echoObjs.map(echo => {
        if (!echo || echo.id == null) return -1;
        const idx = idToIndex.get(echo.id);
        return typeof idx === "number" ? idx : -1;
    });
}

export function computeEchoStatsFromIds(ids, echoes, ctxObj, charId) {
    const echoObjs = ids.filter(i => i >= 0).map(i => echoes[i]);

    const cost = echoObjs.reduce((sum, e) => sum + e.cost, 0);

    let totals = getEchoStatsFromEquippedEchoes(echoObjs);

    const setStats = getActiveSetEffects(echoObjs);
    for (const [k, v] of Object.entries(setStats)) {
        totals[k] = (totals[k] || 0) + v;
    }

    const main = echoObjs[0];
    if (main) {
        const mainBuffs = extractMainEchoBuffs(main.id, charId);
        for (const [k, v] of Object.entries(mainBuffs)) {
            totals[k] = (totals[k] || 0) + v;
        }
    }

    const def = ctxObj.baseDef * (totals.defPercent || 0) / 100
        + (totals.defFlat || 0) + ctxObj.finalDef;

    const atk = ctxObj.baseAtk * (totals.atkPercent || 0) / 100
        + (totals.atkFlat || 0) + ctxObj.finalAtk;

    const hp = ctxObj.baseHp * (totals.hpPercent || 0) / 100
        + (totals.hpFlat || 0) + ctxObj.finalHp;

    return {
        cost,
        setPlan: getSetPlanFromEchoes(echoObjs),
        statTotals: {
            def,
            atk,
            hp,
            er: (totals.energyRegen || 0) + ctxObj.baseER,
            cr: (totals.critRate || 0) + ctxObj.critRate * 100,
            cd: (totals.critDmg || 0) + ctxObj.critDmg * 100,
            dmgBonus: (ctxObj.dmgBonus - 1) * 100,
            dmgAmp: (ctxObj.dmgAmplify - 1) * 100,
            ...totals
        }
    };
}

export const mainStatsFilters = {
    hpPercent: 'HP%',
    atkPercent: 'ATK%',
    defPercent: 'DEF%',
    aero: statLabelMap.aero,
    glacio: statLabelMap.glacio,
    electro: statLabelMap.electro,
    fusion: statLabelMap.fusion,
    havoc: statLabelMap.havoc,
    spectro: statLabelMap.spectro,
    energyRegen: statLabelMap.energyRegen,
    critRate: statLabelMap.critRate,
    critDmg: statLabelMap.critDmg
}

 export function getDefaultMainStatFilter(statWeight = {}) {
    const result = {};

    for (const key of Object.keys(mainStatsFilters)) {
        if (Object.prototype.hasOwnProperty.call(statWeight, key)) {
            result[key] = true;
        }
    }

    return result;
}