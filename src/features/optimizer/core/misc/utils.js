import {getEchoStatsFromEquippedEchoes, statLabelMap} from "@/utils/echoHelper.js";
import {extractMainEchoBuffs} from "./EchoFilters.js";
import {applyBuffArray, applyBuffByPath, getSetPlanFromEchoes} from "@/data/buffs/setEffect.js";
import {echoSets} from "@/constants/echoSetData2.js";

export const SKILL_MASK = {
    NONE: 0,
    BASIC: 1 << 0,
    HEAVY: 1 << 1,
    SKILL: 1 << 2,
    LIB: 1 << 3,
    OUTRO: 1 << 4,
    INTRO: 1 << 5,
    ECHO_SKILL: 1 << 6,
    COORD: 1 << 7,
};
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

function getSetPieceCounts(echoObjs) {
    const counts = {};
    const seenBySet = {};

    for (const e of echoObjs) {
        if (!e) continue;

        const setId = e.selectedSet;
        const kindId = e.id;

        if (setId == null || kindId == null) continue;

        if (!seenBySet[setId]) {
            seenBySet[setId] = new Set();
        }

        if (!seenBySet[setId].has(kindId)) {
            seenBySet[setId].add(kindId);
            counts[setId] = (counts[setId] ?? 0) + 1;
        }
    }

    return counts;
}

export function getActiveSetEffects(echoObjs) {
    const counts = getSetPieceCounts(echoObjs);
    const total  = {};

    for (const [setIdStr, count] of Object.entries(counts)) {
        const setId = Number(setIdStr);
        const cfg   = echoSets[setId];
        if (!cfg) continue;

        const maxPieces = cfg.setMax ?? 5;

        if (count >= 2 && Array.isArray(cfg.twoPiece)) {
            applyBuffArray(total, cfg.twoPiece);
        }

        if (count >= maxPieces && Array.isArray(cfg.fivePiece)) {
            applyBuffArray(total, cfg.fivePiece);
        }

        if (count >= maxPieces && cfg.states) {
            for (const stateCfg of Object.values(cfg.states)) {
                if (!stateCfg) continue;

                if (Array.isArray(stateCfg.max) && stateCfg.max.length > 0) {
                    applyBuffArray(total, stateCfg.max);
                } else if (Array.isArray(stateCfg.perStack)) {
                    applyBuffArray(total, stateCfg.perStack);
                }
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

export function resolveEchoesFromIds(uids, echoes) {
    const keyToEcho = new Map();

    for (const e of echoes) {
        if (!e) continue;
        const key = e.uid;
        if (key == null) continue;
        if (!keyToEcho.has(key)) {
            keyToEcho.set(key, e);
        }
    }

    return uids.map(uid => {
        if (uid == null) return null;
        return keyToEcho.get(uid) ?? null;
    });
}

export function resolveIdsFromEchoes(echoObjs) {
    return echoObjs.map(echo => {
        if (!echo) return null;
        return echo.uid ?? null;
    });
}

function mergeBuffTrees(target, source) {
    if (!source || typeof source !== 'object') return target;
    if (!target || typeof target !== 'object') return structuredClone(source);

    for (const [key, value] of Object.entries(source)) {
        if (value == null) continue;

        if (typeof value === 'number') {
            const prev = Number(target[key] ?? 0);
            target[key] = prev + value;
            continue;
        }

        if (typeof value === 'object' && !Array.isArray(value)) {
            if (typeof target[key] !== 'object' || target[key] === null) {
                target[key] = {};
            }
            mergeBuffTrees(target[key], value);
            continue;
        }

        target[key] = value;
    }

    return target;
}

export function computeEchoStatsFromIds(uids, echoes, ctxObj, charId) {
    const echoByUid = new Map(
        echoes.map(e => [e.uid, e])
    );

    const echoObjs = uids
        .filter(uid => uid != null)
        .map(uid => echoByUid.get(uid))
        .filter(Boolean);

    const cost = echoObjs.reduce((sum, e) => sum + e.cost, 0);
    const setPlan = getSetPlanFromEchoes(echoObjs) ?? [];

    let totals = getEchoStatsFromEquippedEchoes(echoObjs) || {};

    const main = echoObjs[0];
    if (main) {
        const mainBuffs = extractMainEchoBuffs(main.id, charId);
        if (mainBuffs) {
            mergeBuffTrees(totals, mainBuffs);
        }
    }

    const setStats = getActiveSetEffects(echoObjs);
    if (setStats) {
        mergeBuffTrees(totals, setStats);
    }

    const atkPercent = totals.atk?.percent ?? 0;
    const atkFlat    = totals.atk?.flat    ?? 0;

    const defPercent = totals.def?.percent ?? 0;
    const defFlat    = totals.def?.flat    ?? 0;

    const hpPercent  = totals.hp?.percent  ?? 0;
    const hpFlat     = totals.hp?.flat     ?? 0;

    const finalDef = ctxObj.baseDef * defPercent / 100 + defFlat + ctxObj.finalDef;
    const finalAtk = ctxObj.baseAtk * atkPercent / 100 + atkFlat + ctxObj.finalAtk;
    const finalHp  = ctxObj.baseHp  * hpPercent  / 100 + hpFlat  + ctxObj.finalHp;

    const finalER = (totals.energyRegen || 0) + ctxObj.baseER;

    // Tidebreaking Courage (Set 14): 5pc conditional bonus at ER >= 250.
    // The core optimizer applies this at damage-eval time, so mirror it here for accurate UI stat totals.
    const set14 = setPlan.find((s) => s?.setId === 14) ?? null;
    if (set14 && set14.count >= 5 && finalER >= 250) {
        totals.attribute ??= {};
        totals.attribute.all ??= {};
        totals.attribute.all.dmgBonus = (totals.attribute.all.dmgBonus ?? 0) + 30;
    }

    return {
        cost,
        setPlan,
        statTotals: {
            finalDef,
            finalAtk,
            finalHp,
            er: finalER,
            cr: (totals.critRate || 0) + ctxObj.critRate * 100,
            cd: (totals.critDmg || 0) + ctxObj.critDmg * 100,
            dmgBonus: (ctxObj.dmgBonus - 1) * 100,
            dmgAmp: (ctxObj.dmgAmplify - 1) * 100,
            ...totals
        }
    };
}

export function getAttributeModTotal(stats, element, key = "dmgBonus") {
    const attr = stats?.attribute;
    if (!attr) return 0;
    const all = attr.all?.[key] ?? 0;
    const per = element ? (attr[element]?.[key] ?? 0) : 0;
    return (all ?? 0) + (per ?? 0);
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

export function getDefaultMainStatFilter(statWeight = {}, charId = null) {
    const result = {};

    for (const key of Object.keys(mainStatsFilters)) {
        if (Object.prototype.hasOwnProperty.call(statWeight, key)) {
            result[key] = true;
        }
    }

    if (Number(charId) === 1206 || Number(charId) === 1209) result.energyRegen = true;

    return result;
}

/**
 * Resolves locked echo information from form and filtered echoes.
 * @param {string|number|null} lockedEchoId - The locked echo kind ID
 * @param {Array} echoes - Filtered echo array
 * @returns {{ lockedRequested: boolean, lockedIndices: number[]|null, lockedIndex: number, runCount: number, notFound: boolean }}
 */
export function resolveLockedEcho(lockedEchoId, echoes) {
    const lockedRequested = lockedEchoId != null;
    const lockedIndices = !lockedRequested
        ? null
        : echoes.reduce((acc, e, i) => {
            if (e?.id === lockedEchoId) acc.push(i);
            return acc;
        }, []);

    const notFound = lockedRequested && (!lockedIndices || lockedIndices.length === 0);
    const lockedIndex = lockedRequested ? (lockedIndices?.[0] ?? -1) : -1;
    const runCount = lockedRequested ? (lockedIndices?.length ?? 0) : 1;

    return { lockedRequested, lockedIndices, lockedIndex, runCount, notFound };
}
