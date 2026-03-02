import { echoes as echoTemplates } from "@/data/runtime/getEchoes.js";
import {DEFAULT_THREE_PIECE_SETS} from "@shared/constants/echoSetData2.js";

const THREE_PIECE_SET_IDS = new Set(DEFAULT_THREE_PIECE_SETS);

function getSetThreshold(setId) {
    return THREE_PIECE_SET_IDS.has(setId) ? 3 : 2;
}

function expandSetPlanToSlots(setPlan, equippedEchoes, slotCount, mainIndex = 0) {
    const targets = new Array(slotCount).fill(null);

    if (!Array.isArray(setPlan) || setPlan.length === 0) {
        return targets;
    }

    // Flatten setPlan into a list of setIds, one per requested piece
    const pieces = [];
    for (const { setId, pieces: countRaw } of setPlan) {
        const count = Math.max(0, Number(countRaw || 0));
        for (let i = 0; i < count; i++) {
            pieces.push(setId);
        }
    }
    if (!pieces.length) return targets;

    // Only slots that actually have an echo are "real" slots
    const nonNullSlots = [];
    for (let i = 0; i < slotCount; i++) {
        if (equippedEchoes?.[i]) {
            nonNullSlots.push(i);
        }
    }

    const nonNullCount = nonNullSlots.length;
    if (nonNullCount === 0) return targets;

    const totalPieces = pieces.length;

    const mainEcho     = equippedEchoes?.[mainIndex] ?? null;
    const mainSelected = mainEcho?.selectedSet ?? null;
    const planSetIds   = new Set(setPlan.map(p => p.setId));
    const mainIsInPlan = mainSelected != null && planSetIds.has(mainSelected);
    const mainSets = new Set([
        ...(mainEcho?.sets ?? []),
        ...(mainSelected != null ? [mainSelected] : []),
    ]);
    const mainSupportedPlan = setPlan.find(
        ({ setId, pieces: countRaw }) =>
            mainSets.has(setId) && Math.max(0, Number(countRaw || 0)) > 0
    )?.setId ?? null;

    // We MUST use the main slot if:
    //  - the main echo already has a set that’s in the plan, or
    //  - the number of requested pieces >= number of available (non-null) slots
    const mustUseMain = mainIsInPlan || totalPieces >= nonNullCount;

    const preferredIndices = [];
    const remainingPieces = pieces.slice();

    // If main has to participate (like your 2-echo, 2-piece case), give it a piece
    if (mustUseMain && nonNullSlots.includes(mainIndex)) {
        preferredIndices.push(mainIndex);
        if (mainSupportedPlan != null) {
            const removeIndex = remainingPieces.indexOf(mainSupportedPlan);
            if (removeIndex >= 0) {
                targets[mainIndex] = mainSupportedPlan;
                remainingPieces.splice(removeIndex, 1);
            }
        }
    }

    // Fill remaining pieces into the other non-null slots
    for (const idx of nonNullSlots) {
        if (idx === mainIndex) continue;
        preferredIndices.push(idx);
    }

    // Assign plan pieces to preferred slots
    let p = 0;
    for (const idx of preferredIndices) {
        if (targets[idx] != null) continue;
        if (p >= remainingPieces.length) break;
        targets[idx] = remainingPieces[p++];
    }

    return targets;
}

function cloneDeep(obj) {
    if (typeof structuredClone === "function") return structuredClone(obj);
    return JSON.parse(JSON.stringify(obj));
}

function getId(e) {
    return e && e.id != null ? String(e.id) : null;
}

function generateReplacementEcho(orig, avoidSetIds, usedIds) {
    const costPref = orig?.cost ?? null;

    let candidates = echoTemplates
        .map((e, idx) => ({ e, idx }))
        .filter(({ e }) => {
            if (!e) return false;
            if (costPref != null && e.cost !== costPref) return false;
            const id = getId(e);
            return !(id && usedIds.has(id));
        });

    let base;
    if (!candidates.length) {
        base = cloneDeep(orig || {});
    } else {
        base = cloneDeep(candidates[0].e);
    }

    if (orig) {
        base.mainStats = cloneDeep(orig.mainStats ?? base.mainStats);
        base.subStats  = cloneDeep(orig.subStats ?? base.subStats);
    }

    const sets = base.sets ?? [];
    const safe = sets.find(sid => !avoidSetIds.has(sid));

    if (safe != null) {
        base.selectedSet = safe;
    } else {
        base.selectedSet = null;
    }

    const id = getId(base);
    if (id) usedIds.add(id);

    return base;
}

function normalizeSetSelections(echoesArr, setPlan, mainIndex = 0, usedIds) {
    const result = echoesArr.map(e => e ? { ...e } : e);

    const planPieces = new Map();
    if (Array.isArray(setPlan)) {
        for (const { setId, pieces } of setPlan) {
            planPieces.set(setId, Number(pieces || 0));
        }
    }

    function buildCountMap(list) {
        const map = new Map();
        list.forEach((e, idx) => {
            const sid = e?.selectedSet;
            if (sid == null) return;
            if (!map.has(sid)) {
                map.set(sid, { count: 0, indices: [] });
            }
            const entry = map.get(sid);
            entry.count++;
            entry.indices.push(idx);
        });
        return map;
    }

    let setMap = buildCountMap(result);

    function breakSetAtIndex(setIdToBreak, idx) {
        const orig = result[idx];
        const avoidSetIds = new Set([
            setIdToBreak,
            ...planPieces.keys(),
        ]);

        result[idx] = generateReplacementEcho(orig, avoidSetIds, usedIds);
    }

    for (const [setId, { count, indices }] of setMap.entries()) {
        if (!planPieces.has(setId)) continue;
        const desired = planPieces.get(setId);
        if (desired == null || desired <= 0) continue;
        if (count <= desired) continue;

        let toRemove = count - desired;

        const sorted = [...indices].sort((a, b) => {
            if (a === mainIndex) return 1;
            if (b === mainIndex) return -1;
            return 0;
        });

        for (const idx of sorted) {
            if (toRemove <= 0) break;
            breakSetAtIndex(setId, idx);
            toRemove--;
        }
    }

    setMap = buildCountMap(result);

    for (const [setId, { count, indices }] of setMap.entries()) {
        if (planPieces.has(setId)) continue;

        const threshold = getSetThreshold(setId);
        const allowedMax = Math.max(0, threshold - 1);

        if (count <= allowedMax) continue;

        let toFix = count - allowedMax;

        const sorted = [...indices].sort((a, b) => {
            if (a === mainIndex) return 1;
            if (b === mainIndex) return -1;
            return 0;
        });

        for (const idx of sorted) {
            if (toFix <= 0) break;

            if (idx === mainIndex && sorted.length > 1) continue;

            breakSetAtIndex(setId, idx);
            toFix--;
        }
    }

    return result;
}

export function applySetPlanToEchoes(
                                         setPlan,
                                         equippedEchoes,
                                     ) {
    const mainIndex = 0;
    const b = Array.isArray(equippedEchoes) ? equippedEchoes : [];
    const templates = Array.isArray(echoTemplates) ? echoTemplates : [];

    const slotCount  = b.length;
    const targetSets = expandSetPlanToSlots(setPlan, b, slotCount, mainIndex);

    const usedEquippedIdx = new Set();
    const usedTemplateIdx = new Set();
    const usedIds = new Set();

    const cloneDeep = (obj) => {
        if (typeof structuredClone === "function") return structuredClone(obj);
        return JSON.parse(JSON.stringify(obj));
    };

    const getId = (e) => (e && e.id != null ? String(e.id) : null);
    const markUsedId = (e) => {
        const id = getId(e);
        if (id) usedIds.add(id);
    };

    function pickBest(echos) {
        if (!echos.length) return null;
        const unique = echos.filter(e => {
            const id = getId(e);
            return !id || !usedIds.has(id);
        });
        return unique[0] || echos[0] || null;
    }

    function takeEquippedForSet(setId, costPref = null) {
        const candidates = [];
        for (let i = 0; i < b.length; i++) {
            if (usedEquippedIdx.has(i)) continue;
            const e = b[i];
            if (!e) continue;

            // must have the right set
            const sets = e.sets ?? [];
            const hasSet =
                e.selectedSet === setId ||
                sets.includes(setId);
            if (!hasSet) continue;

            if (costPref != null && e.cost !== costPref) continue;

            candidates.push({
                echo: e,
                idx: i,
            });
        }

        if (!candidates.length) return null;

        const chosenEchoes = candidates.map(c => c.echo);
        const chosen = pickBest(chosenEchoes);
        if (!chosen) return null;

        const chosenIdx = candidates.find(c => c.echo === chosen)?.idx;
        if (chosenIdx != null) usedEquippedIdx.add(chosenIdx);

        // no cost mutation here; the candidate already had correct cost
        return cloneDeep(chosen);
    }

    function pickTemplateForSet(setId, costPref = null) {
        const withSet = templates
            .map((e, idx) => ({ e, idx }))
            .filter(
                ({ e, idx }) =>
                    e &&
                    !usedTemplateIdx.has(idx) &&
                    Array.isArray(e.sets) &&
                    e.sets.includes(setId)
            );

        if (!withSet.length) return null;

        let filtered = withSet;
        if (costPref != null) {
            filtered = withSet.filter(({ e }) => e.cost === costPref);
            if (!filtered.length) {
                return null;
            }
        }

        const unique = filtered.filter(({ e }) => {
            const id = getId(e);
            return !id || !usedIds.has(id);
        });

        const pool = unique.length ? unique : filtered;
        const chosen = pool[0];
        usedTemplateIdx.add(chosen.idx);
        return cloneDeep(chosen.e);
    }

    function fallbackEcho(costPref = null) {
        const candidates = [];

        for (let i = 0; i < b.length; i++) {
            if (usedEquippedIdx.has(i)) continue;
            const e = b[i];
            if (!e) continue;
            if (costPref != null && e.cost !== costPref) continue;
            candidates.push(e);
        }

        for (let i = 0; i < templates.length; i++) {
            if (usedTemplateIdx.has(i)) continue;
            const e = templates[i];
            if (!e) continue;
            if (costPref != null && e.cost !== costPref) continue;
            candidates.push(e);
        }

        if (!candidates.length) return null;
        const chosen = pickBest(candidates);
        if (!chosen) return null;

        const tIdx = templates.findIndex(t => t === chosen);
        if (tIdx >= 0) usedTemplateIdx.add(tIdx);

        return cloneDeep(chosen);
    }

    const result = [];

    for (let i = 0; i < slotCount; i++) {
        const orig = b[i] || null;
        const targetSet = targetSets[i];
        const costPref = orig?.cost ?? null;
        let echo = null;

        if (targetSet == null) {
            if (orig && !usedEquippedIdx.has(i)) {
                usedEquippedIdx.add(i);
                echo = cloneDeep(orig);
            } else {
                echo = null;
            }
        } else {
            if (
                orig &&
                !usedEquippedIdx.has(i) &&
                orig.selectedSet === targetSet
            ) {
                usedEquippedIdx.add(i);
                echo = cloneDeep(orig);
            }

            if (!echo && orig && !usedEquippedIdx.has(i)) {
                const sets = orig.sets ?? [];
                if (sets.includes(targetSet)) {
                    usedEquippedIdx.add(i);
                    echo = cloneDeep(orig);
                    echo.selectedSet = targetSet;
                }
            }

            if (!echo) {
                echo = takeEquippedForSet(targetSet, costPref);
                if (echo) {
                    const sets = echo.sets ?? [];
                    if (!sets.includes(targetSet)) {
                        echo.sets = [...sets, targetSet];
                    }
                    echo.selectedSet = targetSet;
                }
            }

            if (!echo) {
                const tmpl = pickTemplateForSet(targetSet, costPref);
                if (tmpl) {
                    echo = tmpl;
                    const sets = echo.sets ?? [];
                    if (!sets.includes(targetSet)) {
                        echo.sets = [...sets, targetSet];
                    }
                    echo.selectedSet = targetSet;

                    if (orig) {
                        echo.mainStats = cloneDeep(orig.mainStats ?? echo.mainStats);
                        echo.subStats  = cloneDeep(orig.subStats ?? echo.subStats);
                    }
                }
            }

            if (!echo) {
                echo = fallbackEcho(costPref) || cloneDeep(orig || {});
                const sets = echo.sets ?? [];
                if (!sets.includes(targetSet)) {
                    echo.sets = [...sets, targetSet];
                }
                echo.selectedSet = targetSet;
            }
        }

        markUsedId(echo);
        result.push(echo);
    }

    return normalizeSetSelections(result, setPlan, mainIndex, usedIds);
}

export function isSetPlanFeasible(setPlan, equippedEchoes) {
    if (!Array.isArray(setPlan) || setPlan.length === 0) {
        return false;
    }

    const slots = Array.isArray(equippedEchoes) ? equippedEchoes : [];
    const slotCount = slots.length;
    if (slotCount === 0) return false;

    const totalPiecesRequested = setPlan.reduce(
        (sum, p) => sum + (Number(p?.pieces ?? 0) || 0),
        0
    );
    if (totalPiecesRequested > slotCount) {
        return false;
    }

    const slotsByCost = new Map();
    for (const e of slots) {
        const c = e?.cost;
        if (c == null) continue;
        slotsByCost.set(c, (slotsByCost.get(c) ?? 0) + 1);
    }

    const availBySetAndCost = new Map();

    function addEchoSource(list) {
        for (const e of list || []) {
            if (!e) continue;
            const cost = e.cost;
            if (cost == null) continue;
            const sets = e.sets ?? [];
            const id = e.id;
            for (const sid of sets) {
                if (!availBySetAndCost.has(sid)) {
                    availBySetAndCost.set(sid, new Map());
                }
                const inner = availBySetAndCost.get(sid);
                if (!inner.has(cost)) {
                    inner.set(cost, new Set());
                }
                if (id != null) {
                    inner.get(cost).add(String(id));
                }
            }
        }
    }

    addEchoSource(slots);
    addEchoSource(echoTemplates);

    for (const { setId, pieces } of setPlan) {
        const needed = Number(pieces || 0);
        if (needed <= 0) continue;

        const costMap = availBySetAndCost.get(setId);
        if (!costMap) {
            return false;
        }

        let capacity = 0;
        for (const [cost, idSet] of costMap.entries()) {
            const slotCap = slotsByCost.get(cost) ?? 0;
            const uniqueCount = idSet.size;
            capacity += Math.min(slotCap, uniqueCount);
        }

        if (capacity < needed) {
            return false;
        }
    }

    return true;
}
