import {normalizeLegacyEchoStats, validSubstatRanges} from "@/utils/echoHelper.js";
import {elementMap, mainEchoBuffs} from "@/data/buffs/setEffect.js";
import {echoSets} from "@/constants/echoSetData2.js";

export const EchoFilters = {
    applyStatWorthFilter(form, echoes) {
        if (!form.statWeight || !form.keepPercent) return echoes;

        // Compute score for each echo
        const scored = echoes.map(e => {
            const r = scoreEchoByStatWeight(e, form.statWeight, form.charId);
            return { echo: e, score: r.score, buffStats: r.buffStats };
        });

        // Sort highest first
        scored.sort((a, b) => b.score - a.score);

        // Determine cutoff index
        const keepPercent = 1 - Math.min(Math.max(form.keepPercent, 0), 1);
        const keepCount = Math.max(1, Math.floor(scored.length * keepPercent));

        // Return echoes only
        return scored.slice(0, keepCount).map(s => s.echo);
    },

    applyCostFilter(form, echoes) {
        const min = form.minCost ?? 1;
        const max = form.maxCost ?? 4;
        return echoes.filter(e => e.cost >= min && e.cost <= max);
    },

    applySetFilter(form, echoes) {
        if (!form.setOptions) return echoes;
        // Build a quick lookup table: { setId: boolean }
        const allowed = {};

        for (const pc of Object.keys(form.setOptions)) {
            for (const s of form.setOptions[pc]) {
                allowed[s.id] = s.selected;
            }
        }

        // Filter echoes: keep only those whose set is allowed
        return echoes.filter(e => {
            const sid = e.selectedSet;
            return allowed[sid] !== false;
        });
    },

    applyMainStatFilter(form, echoes) {
        const { mainStatFilter } = form;
        if (!mainStatFilter) return echoes;
        const activeKeys = Object.entries(mainStatFilter)
            .filter(([, enabled]) => enabled)
            .map(([key]) => key);
        if (activeKeys.length === 0) return echoes;
        const allowed = new Set(activeKeys);
        return echoes.filter(echo => {
            const stats = echo.mainStats || {};
            return Object.keys(stats).some(key => allowed.has(key));
        });
    },

    applyExcludeFilter(form, echoes) {
        // e.g., echoes.filter(e => !e.locked)
        return echoes;
    },

    getFilteredEchoes(form) {
        let echoes = [...form.echoBag];

        echoes = this.applyExcludeFilter(form, echoes);
        echoes = this.applyCostFilter(form, echoes);
        echoes = this.applySetFilter(form, echoes);
        echoes = this.applyMainStatFilter(form, echoes);

        echoes = this.applyStatWorthFilter(form, echoes);

        return echoes;
    }
};

const MAINSTAT_MAX = 44;

function normalizeMain(stat, value) {
    return stat.endsWith("Flat") ? 0 : (value / MAINSTAT_MAX) * 2;
}

function normalizeSub(stat, value) {
    const r = validSubstatRanges[stat];
    return r ? value / r.max : 0;
}

function weighted(stat, value, weightMap) {
    const w = weightMap[stat] ?? 0;
    if (!w) return 0;

    const normalizedValue =
        validSubstatRanges[stat]
            ? normalizeSub(stat, value)
            : normalizeMain(stat, value);

    return normalizedValue * w;
}

function getSetWeightedValue(setId, statWeight) {
    const cfg = echoSets[setId];
    if (!cfg) return 0;

    let score = 0;

    const addBuffs = (buffs) => {
        if (!buffs) return;
        for (const [stat, value] of Object.entries(buffs)) {
            score += weighted(stat, value, statWeight);
        }
    };

    // 2-piece flat bonuses
    addBuffs(cfg.twoPiece);

    // 5-piece flat bonuses (Lingering, Empyrean, Tidebreaking, etc.)
    addBuffs(cfg.fivePiece);

    // State-driven effects at max value (frost stacks, radiance, crown, etc.)
    if (cfg.states) {
        for (const stateCfg of Object.values(cfg.states)) {
            const maxBuffs = stateCfg.max ?? stateCfg.perStack;
            addBuffs(maxBuffs);
        }
    }

    if (setId === 14) {
        for (const elem of Object.values(elementMap)) {
            score += weighted(elem, 30, statWeight);
        }
    }

    return score;
}

export function scoreEchoByStatWeight(echo, statWeight = {}, charId) {
    let score = 0;

    if (echo.mainStats) {
        for (const [stat, value] of Object.entries(echo.mainStats)) {
            score += weighted(stat, value, statWeight);
        }
    }

    if (echo.subStats) {
        for (const [stat, value] of Object.entries(echo.subStats)) {
            score += weighted(stat, value, statWeight);
        }
    }

    const buffStats = extractMainEchoBuffs(echo.id, charId);

    for (const [stat, val] of Object.entries(buffStats)) {
        score += weighted(stat, val, statWeight);
    }

    const setId = echo.selectedSet ?? echo.setId;
    if (setId != null) {
        const setScore = getSetWeightedValue(setId, statWeight);

        const SET_WEIGHT = 2.0;
        score += setScore * SET_WEIGHT;
    }

    const COST_WEIGHT = 0;
    if (COST_WEIGHT > 0) {
        const normalizedCost = (echo.cost ?? 0) / 4;
        score += normalizedCost * COST_WEIGHT;
    }

    return {score, buffStats};
}

export function extractMainEchoBuffs(echoId, charId) {
    const data = mainEchoBuffs[String(echoId)];
    if (!data) return {};

    const out = {};

    // always buffs
    if (data.always) {
        for (const [stat, val] of Object.entries(data.always)) {
            out[stat] = (out[stat] ?? 0) + val;
        }
    }

    // toggleable buffs (assumed ON for scoring)
    if (data.toggleable?.buffs) {
        for (const [stat, val] of Object.entries(data.toggleable.buffs)) {
            out[stat] = (out[stat] ?? 0) + val;
        }
    }

    // stackable buffs — use max stacks
    if (data.stackable) {
        const max = data.stackable.max ?? 0;
        const per = data.stackable.buffsPerStack ?? {};
        for (const [stat, val] of Object.entries(per)) {
            out[stat] = (out[stat] ?? 0) + val * max;
        }
    }

    if (echoId === '6000106' && (charId === '1409' || charId === '1406' || charId === '1408')) {
        out.aero = (out.aero ?? 0) + 10;
    }

    return normalizeLegacyEchoStats(out);
}