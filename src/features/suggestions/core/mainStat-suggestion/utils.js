import {echoes} from "@/data/ingest/getEchoes.js";

const echoTemplates = echoes;

export function applyMainStatRecipesToEchoes(
    unorderedRecipes,
    equippedEchoes,
) {
    const recipes = alignRecipesToOriginalSlots(unorderedRecipes, equippedEchoes) ;
    if (!Array.isArray(recipes)) return [];
    const b = Array.isArray(equippedEchoes) ? equippedEchoes : [];
    const templates = Array.isArray(echoTemplates) ? echoTemplates : [];

    const usedEquippedIdx = new Set();     // which slots of B we've consumed
    const usedTemplateIdx = new Set();     // which templates we've consumed
    const usedIds = new Set();             // ids in the *result* (soft constraint)

    const cloneDeep = (obj) => {
        if (typeof structuredClone === 'function') return structuredClone(obj);
        return JSON.parse(JSON.stringify(obj));
    };

    const getId = (e) => (e && e.id != null ? String(e.id) : null);

    /**
     * Try to pick an equipped echo with a given cost.
     * - prefers unused index
     * - prefers id not used yet, but will reuse an id if that's the only match
     */
    function pickEquippedWithCost(cost, preferIndex = null) {
        if (cost == null) return null;

        const candidates = [];
        for (let i = 0; i < b.length; i++) {
            const e = b[i];
            if (!e) continue;
            if (usedEquippedIdx.has(i)) continue;
            if (e.cost !== cost) continue;
            candidates.push({ i, e });
        }
        if (!candidates.length) return null;

        // split by id uniqueness
        const unique = candidates.filter(({ e }) => {
            const id = getId(e);
            return !id || !usedIds.has(id);
        });
        const pool = unique.length ? unique : candidates;

        // try to honor preferIndex if present
        if (preferIndex != null) {
            const preferred = pool.find((c) => c.i === preferIndex);
            if (preferred) {
                usedEquippedIdx.add(preferred.i);
                return cloneDeep(preferred.e);
            }
        }

        const chosen = pool[0];
        usedEquippedIdx.add(chosen.i);
        return cloneDeep(chosen.e);
    }

    /**
     * Pick a template echo with a given cost.
     * - prefers templates whose sets include preferredSetId (if provided)
     * - prefers id not used yet, but will reuse id if necessary
     */
    function pickTemplateWithCost(cost, preferredSetId = null) {
        if (cost == null) return null;

        const candidates = templates
            .map((e, idx) => ({ e, idx }))
            .filter(({ e, idx }) => e && e.cost === cost && !usedTemplateIdx.has(idx));

        if (!candidates.length) return null;

        let filtered = candidates;

        if (preferredSetId != null) {
            const withSet = candidates.filter(({ e }) =>
                (e.sets ?? []).includes(preferredSetId)
            );
            if (withSet.length) {
                filtered = withSet;
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

    /**
     * Last-chance picker:
     *  - look through *all* echoes (equipped + templates), ignoring used indices,
     *    but still requiring cost match
     *  - prefer id uniqueness, but allow dupes if that's all we have
     */
    function pickAnyEchoWithCost(cost) {
        if (cost == null) return null;

        const all = [];

        // equipped echoes
        for (let i = 0; i < b.length; i++) {
            const e = b[i];
            if (!e) continue;
            if (e.cost !== cost) continue;
            all.push({ source: 'equipped', e });
        }

        // templates
        for (let i = 0; i < templates.length; i++) {
            const e = templates[i];
            if (!e) continue;
            if (e.cost !== cost) continue;
            all.push({ source: 'template', e });
        }

        if (!all.length) return null;

        const unique = all.filter(({ e }) => {
            const id = getId(e);
            return !id || !usedIds.has(id);
        });

        const pool = unique.length ? unique : all;

        const chosen = pool[Math.floor(Math.random() * pool.length)];
        return cloneDeep(chosen.e);
    }

    const result = [];

    recipes.forEach((recipe, i) => {
        const { cost, mainStats = {} } = recipe || {};
        let echo = null;

        const baseAtSlot = b[i] || null;
        const preferredSetId = baseAtSlot?.selectedSet ?? null;

        // 1) try same-slot equipped echo with matching cost
        if (baseAtSlot && baseAtSlot.cost === cost && !usedEquippedIdx.has(i)) {
            // but still enforce id uniqueness where possible
            const id = getId(baseAtSlot);
            if (!id || !usedIds.has(id)) {
                usedEquippedIdx.add(i);
                echo = cloneDeep(baseAtSlot);
            }
        }

        // 2) otherwise, any other equipped echo with that cost
        if (!echo) {
            echo = pickEquippedWithCost(cost, null);
        }

        // 3) otherwise, template with that cost (and preferably same set)
        if (!echo) {
            echo = pickTemplateWithCost(cost, preferredSetId);

            if (echo && baseAtSlot) {
                // merge some runtime fields from baseAtSlot into template-based echo
                echo = {
                    ...echo,
                    // keep template identity for id/cost/sets
                    id: echo.id,
                    cost: echo.cost,
                    sets: echo.sets ? [...echo.sets] : [],
                    // but overlay runtime-ish fields from base
                    selectedSet: baseAtSlot.selectedSet ?? echo.selectedSet,
                    subStats: baseAtSlot.subStats ?? echo.subStats,
                    uid: baseAtSlot.uid ?? echo.uid,
                };

                // if base selectedSet doesn't exist in template.sets, drop it
                if (
                    echo.selectedSet != null &&
                    echo.sets &&
                    !echo.sets.includes(echo.selectedSet)
                ) {
                    delete echo.selectedSet;
                }
            }
        }

        // 4) final fallback: any echo (equipped or template) where cost matches
        if (!echo) {
            echo = pickAnyEchoWithCost(cost);
        }

        // 5) if we STILL don't have something (no echo of that cost anywhere),
        //    just skip or create a minimal stub that *doesn't* lie about cost.
        if (!echo) {
            console.warn(`No echo found with cost ${cost}. Skipping or creating stub.`);
            echo = {
                cost: cost,
                mainStats: {},
                subStats: {},
                sets: [],
            };
        }

        // apply mainStats from recipe
        echo.mainStats = cloneDeep(mainStats);

        const id = getId(echo);
        if (id) {
            usedIds.add(id);
        }

        result.push(echo);
    });

    return result;
}

/**
 * Reorder recipes so their costs align with the original echo costs per slot,
 * as much as possible.
 *
 * Example:
 *  original costs:  [3, 1, 1, 4, 3]
 *  recipe costs:    [1, 1, 3, 3, 4]
 *  result costs:    [3, 1, 1, 4, 3]
 */
export function alignRecipesToOriginalSlots(recipes, equippedEchoes) {
    // If recipes isn't an array, just bail out with it unchanged-ish
    if (!Array.isArray(recipes)) {
        console.warn("alignRecipesToOriginalSlots: 'recipes' is not an array:", recipes);
        return recipes ?? [];
    }

    const origCosts = (equippedEchoes || []).map(e => e?.cost ?? null);
    const N = Math.min(recipes.length, origCosts.length || recipes.length);

    // Clone with a tag so we don't mutate the original objects
    const remaining = recipes.map((r, idx) => ({ ...r, _idx: idx }));
    const usedRecipeIdx = new Set();
    const assigned = new Array(N).fill(null);

    const takeRecipeWithCost = (cost, preferIndex = null) => {
        if (cost == null) return null;

        // 1) if the recipe at the same index already has this cost, keep it there
        if (
            preferIndex != null &&
            !usedRecipeIdx.has(preferIndex) &&
            remaining[preferIndex] &&
            remaining[preferIndex].cost === cost
        ) {
            const r = remaining[preferIndex];
            usedRecipeIdx.add(preferIndex);
            return r;
        }

        // 2) otherwise, find any unused recipe with that cost
        const idx = remaining.findIndex(
            (r, i) => r && !usedRecipeIdx.has(i) && r.cost === cost
        );
        if (idx === -1) return null;

        const r = remaining[idx];
        usedRecipeIdx.add(idx);
        return r;
    };

    const takeAnyRemaining = () => {
        const idx = remaining.findIndex((r, i) => r && !usedRecipeIdx.has(i));
        if (idx === -1) return null;
        const r = remaining[idx];
        usedRecipeIdx.add(idx);
        return r;
    };

    for (let i = 0; i < N; i++) {
        const origCost = origCosts[i];
        let r = null;

        if (origCost != null) {
            r = takeRecipeWithCost(origCost, i);
        }

        if (!r) {
            r = takeAnyRemaining();
        }

        assigned[i] = r || null;
    }

    // strip the _idx tag so you just get your original objects back
    return assigned.map(r => {
        if (!r) return null;
        const { _idx, ...rest } = r;
        return rest;
    });
}