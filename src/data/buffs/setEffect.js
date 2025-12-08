import {echoSets, stateToSetId} from "../../constants/echoSetData2.js";
import {normalizeLegacyEchoStats} from "../../utils/echoHelper.js";

export const elementMap = {
    1: 'glacio',
    2: 'fusion',
    3: 'electro',
    4: 'aero',
    5: 'spectro',
    6: 'havoc',
    7: 'physical'
};

const ATTRIBUTE_KEYS = new Set(['glacio', 'fusion', 'electro', 'aero', 'spectro', 'havoc', 'physical']);

const SKILL_TYPE_KEYS = new Set([
    'basicAtk',
    'heavyAtk',
    'resonanceSkill',
    'resonanceLiberation',
    'introSkill',
    'echoSkill',
    'outroAtk',
    'coord',
]);

export function applyStatToMerged(mergedBuffs, stat, value) {
    if (!value) return;

    // ATK%
    if (stat === 'atkPercent') {
        mergedBuffs.atk ??= {};
        mergedBuffs.atk.percent = (mergedBuffs.atk.percent ?? 0) + value;
        return;
    }

    if (stat === 'hpPercent') {
        mergedBuffs.hp ??= {};
        mergedBuffs.hp.percent = (mergedBuffs.hp.percent ?? 0) + value;
        return;
    }

    if (stat === 'defPercent') {
        mergedBuffs.def ??= {};
        mergedBuffs.def.percent = (mergedBuffs.def.percent ?? 0) + value;
        return;
    }

    if (ATTRIBUTE_KEYS.has(stat)) {
        mergedBuffs.attribute ??= {};
        mergedBuffs.attribute[stat] ??= { dmgBonus: 0 };
        mergedBuffs.attribute[stat].dmgBonus =
            (mergedBuffs.attribute[stat].dmgBonus ?? 0) + value;
        return;
    }

    if (SKILL_TYPE_KEYS.has(stat)) {
        mergedBuffs.skillType ??= {};
        mergedBuffs.skillType[stat] ??= { dmgBonus: 0 };
        mergedBuffs.skillType[stat].dmgBonus =
            (mergedBuffs.skillType[stat].dmgBonus ?? 0) + value;
        return;
    }

    mergedBuffs[stat] = (mergedBuffs[stat] ?? 0) + value;
}

export function applyBuffByPath(target, path, delta) {
    if (!target || !Array.isArray(path) || path.length === 0) return;
    const value = Number(delta ?? 0);
    if (!Number.isFinite(value)) return;

    let obj = target;
    const lastIndex = path.length - 1;

    for (let i = 0; i < lastIndex; i++) {
        const key = path[i];
        const cur = obj[key];

        if (cur == null || typeof cur !== 'object') {
            obj[key] = {};
        }
        obj = obj[key];
    }

    const lastKey = path[lastIndex];
    const curVal = Number(obj[lastKey] ?? 0);
    obj[lastKey] = curVal + value;
}

export function applyBuffArray(target, entries) {
    if (!target || !Array.isArray(entries)) return;

    for (const entry of entries) {
        if (!entry?.path) continue;
        applyBuffByPath(target, entry.path, entry.value ?? 0);
    }
}

function getStateEntries(stateCfg, stacks) {
    if (!stateCfg) return null;

    const perStack = stateCfg.perStack;
    const max      = stateCfg.max;

    if (!perStack && !max) return null;

    // perStack + max → clamp each path separately
    if (perStack && max) {
        const maxMap = new Map();
        for (const m of max) {
            if (!m?.path) continue;
            maxMap.set(m.path.join("|"), m.value ?? Infinity);
        }

        const out = [];
        for (const entry of perStack) {
            if (!entry?.path) continue;
            const key    = entry.path.join("|");
            const cap    = maxMap.get(key) ?? Infinity;
            const scaled = (entry.value ?? 0) * stacks;
            const value  = Math.min(scaled, cap);

            out.push({ path: entry.path, value });
        }
        return out;
    }

    // pure per-stack: no explicit cap
    if (perStack) {
        return perStack
            .filter(e => e?.path)
            .map(e => ({
                path: e.path,
                value: (e.value ?? 0) * stacks
            }));
    }

    // pure on/off: use max as-is
    return Array.isArray(max) ? max.slice() : null;
}

export function applyEchoSetBuffLogic({ mergedBuffs, setCounts }) {
    if (!mergedBuffs || !setCounts) return mergedBuffs;

    for (const [setIdStr, rawCount] of Object.entries(setCounts)) {
        const setId = Number(setIdStr);
        const cfg   = echoSets[setId];
        if (!cfg) continue;

        const count     = Number(rawCount) || 0;
        const maxPieces = cfg.setMax ?? 5;

        // 2-piece static buffs
        if (count >= 2 && Array.isArray(cfg.twoPiece)) {
            applyBuffArray(mergedBuffs, cfg.twoPiece);
        }

        // Full-set static buffs (3p / 5p) – non-toggle, non-stacking
        if (count >= maxPieces && Array.isArray(cfg.fivePiece)) {
            applyBuffArray(mergedBuffs, cfg.fivePiece);
        }
    }

    return mergedBuffs;
}

export function applySetEffect({
                                   mergedBuffs,
                                   characterState,
                                   combatState,
                                   setCounts = {}
                               }) {
    if (!mergedBuffs) return mergedBuffs;

    const activeStates = characterState?.activeStates ?? {};

    // Walk all sets and apply state-based effects when you have the full set
    for (const [setIdStr, cfg] of Object.entries(echoSets)) {
        const setId  = Number(setIdStr);
        const count  = Number(setCounts?.[setId] ?? 0);
        const setMax = cfg.setMax ?? 5;

        if (count < setMax || !cfg.states) continue;

        for (const [stateKey, stateCfg] of Object.entries(cfg.states)) {
            let stacks = activeStates[stateKey];

            // Off / undefined → no buff
            if (!stacks) continue;
            if (typeof stacks !== "number") stacks = 1;

            // Special combat-state gates
            if (stateKey === "windward5") {
                const aeroErosionStacks = combatState?.aeroErosion ?? 0;
                if (aeroErosionStacks <= 0) continue;
            }

            if (stateKey === "radiance5p2") {
                const frazzle = combatState?.spectroFrazzle ?? 0;
                if (frazzle < 10) continue;
            }

            const entries = getStateEntries(stateCfg, stacks);
            if (!entries?.length) continue;

            applyBuffArray(mergedBuffs, entries);
        }
    }

    // Flamewing’s Shadow 3p synergy:
    // When both P1 & P2 states are active and you actually have the set,
    // gain +16% Fusion DMG.
    {
        const flameCount = Number(setCounts?.[22] ?? 0);
        const flameCfg   = echoSets[22];

        if (flameCfg && flameCount >= (flameCfg.setMax ?? 3)) {
            const p1 = activeStates.flamewingsShadow2pcP1;
            const p2 = activeStates.flamewingsShadow2pcP2;
            if (p1 && p2) {
                applyBuffByPath(mergedBuffs, ['attribute', 'fusion', 'dmgBonus'], 16);
            }
        }
    }

    // Tidebreaking Courage 5p “all attributes +30% at >= 250% ER”
    // (static +15% ATK 5p is in echoSets[14].fivePiece and applied in applyEchoSetBuffLogic)
    {
        const tideCount = Number(setCounts?.[14] ?? 0);
        const tideCfg   = echoSets[14];

        if (tideCfg && tideCount >= (tideCfg.setMax ?? 5)) {
            const er = Number(mergedBuffs.energyRegen ?? 0);
            if (er >= 150) {
                // attribute.all gets folded into element buckets later in getFinalStats
                applyBuffByPath(mergedBuffs, ['attribute', 'all', 'dmgBonus'], 30);
            }
        }
    }

    return mergedBuffs;
}

const statMirrors = {
    resonanceSkill: ["skillAtk"],
    resonanceLiberation: ["ultimateAtk"]
};


export function getSetPlanFromEchoes(equippedEchoes = []) {
    if (!Array.isArray(equippedEchoes) || equippedEchoes.length === 0) return null;

    const counts = {};
    const seenBySet = {};

    for (const echo of equippedEchoes) {
        if (!echo) continue;

        const setId = echo.selectedSet ?? echo.setId;
        const kindId = echo.id;

        if (setId == null || kindId == null) continue;

        if (!seenBySet[setId]) {
            seenBySet[setId] = new Set();
        }

        if (!seenBySet[setId].has(kindId)) {
            seenBySet[setId].add(kindId);
            counts[setId] = (counts[setId] ?? 0) + 1;
        }
    }

    const entries = Object.entries(counts).map(([setId, count]) => ({
        setId: Number(setId),
        count,
    }));

    if (entries.length === 0) return null;
    return entries.sort((a, b) => a.setId - b.setId);
}

function addBuffs(target, buffObj) {
    if (!buffObj) return;
    for (const [stat, val] of Object.entries(buffObj)) {
        const targets = [stat, ...(statMirrors[stat] ?? [])];
        for (const t of targets) {
            target[t] = (Number(target[t] ?? 0)) + Number(val ?? 0);
        }
    }
}

function subtractBuffByPath(target, path, delta) {
    if (!target || !Array.isArray(path) || path.length === 0) return;
    const value = Number(delta ?? 0);
    if (!Number.isFinite(value) || value === 0) return;

    let obj = target;
    const lastIndex = path.length - 1;

    for (let i = 0; i < lastIndex; i++) {
        const key = path[i];
        const cur = obj[key];

        if (cur == null || typeof cur !== 'object') {
            // If it doesn't exist, then there's effectively nothing to subtract.
            // We can early out.
            return;
        }
        obj = cur;
    }

    const lastKey = path[lastIndex];
    const curVal  = Number(obj[lastKey] ?? 0);
    const res     = curVal - value;

    if (Math.abs(res) < 1e-6) {
        // Clean small noise to zero
        delete obj[lastKey];
    } else {
        obj[lastKey] = res;
    }
}

function subtractBuffArray(target, entries) {
    if (!target || !Array.isArray(entries)) return;
    for (const entry of entries) {
        if (!entry?.path) continue;
        subtractBuffByPath(target, entry.path, entry.value ?? 0);
    }
}

export function removeSetEffectsFromBuffs(
    baseBuffs,
    sets,
    runtime
) {
    if (!baseBuffs) return {};

    const newBuffs = structuredClone(baseBuffs);
    const setArray =
        Array.isArray(sets) ? sets : [{ setId: sets, count: echoSets[sets]?.setMax ?? 5 }];
    const activeStates = runtime?.activeStates ?? {};

    for (const entry of setArray) {
        const id    = entry?.setId ?? entry;
        const count = Number(entry?.count ?? 0);
        const cfg   = echoSets[id];
        if (!cfg) continue;

        const maxPieces = cfg.setMax ?? 5;

        if (count >= 2 && Array.isArray(cfg.twoPiece)) {
            subtractBuffArray(newBuffs, cfg.twoPiece);
        }

        if (count >= maxPieces && Array.isArray(cfg.fivePiece)) {
            subtractBuffArray(newBuffs, cfg.fivePiece);
        }
    }

    for (const entry of setArray) {
        const id    = entry?.setId ?? entry;
        const count = Number(entry?.count ?? 0);
        const cfg   = echoSets[id];
        if (!cfg || !cfg.states) continue;

        const maxPieces = cfg.setMax ?? 5;
        if (count < maxPieces) continue;

        for (const [stateKey, stateCfg] of Object.entries(cfg.states)) {
            let stacks = activeStates[stateKey];

            if (!stacks) continue;
            if (typeof stacks !== "number") stacks = 1;

            if (stateKey === "windward5") {
                const aeroErosionStacks = runtime.CombatState?.aeroErosion ?? 0;
                if (aeroErosionStacks <= 0) continue;
            }

            if (stateKey === "radiance5p2") {
                const frazzle = runtime.CombatState?.spectroFrazzle ?? 0;
                if (frazzle < 10) continue;
            }

            const entries = getStateEntries(stateCfg, stacks);
            if (!entries?.length) continue;

            subtractBuffArray(newBuffs, entries);
        }
    }

    if (setArray.some(e => (e?.setId ?? e) === 22)) {
        const flameCfg = echoSets[22];
        const entry    = setArray.find(e => (e?.setId ?? e) === 22);
        const count    = Number(entry?.count ?? 0);

        if (flameCfg && count >= (flameCfg.setMax ?? 3)) {
            const p1 = activeStates.flamewingsShadow2pcP1;
            const p2 = activeStates.flamewingsShadow2pcP2;
            if (p1 && p2) {
                subtractBuffByPath(newBuffs, ['attribute', 'fusion', 'dmgBonus'], 16);
            }
        }
    }

    if (setArray.some(e => (e?.setId ?? e) === 14)) {
        const tideCfg  = echoSets[14];
        const entry    = setArray.find(e => (e?.setId ?? e) === 14);
        const count    = Number(entry?.count ?? 0);
        const er       = Number(baseBuffs.energyRegen ?? 0);

        if (tideCfg && count >= (tideCfg.setMax ?? 5) && er >= 150) {
            subtractBuffByPath(newBuffs, ['attribute', 'all', 'dmgBonus'], 30);
        }
    }

    return newBuffs;
}

export const mainEchoBuffs = {
    '6000042': {
        toggleable: {
            label: "Enable",
            buffs: { basicAtk: 12, havoc: 12 }
        }
    },
    '6000039': {
        toggleable: {
            label: "Enable",
            buffs: { heavyAtk: 12, electro: 12 }
        }
    },
    '6000043': {
        toggleable: {
            label: "Enable",
            buffs: { heavyAtk: 12, aero: 12 }
        }
    },
    '6000045': {
        toggleable: {
            label: "Enable",
            buffs: { resonanceLiberation: 12, spectro: 12 }
        }
    },
    '6000048': {
        toggleable: {
            label: "Enable",
            buffs: { atkPercent: 12 }
        }
    },
    '6000059': {
        toggleable: {
            label: "Enable",
            buffs: { resonanceSkill: 16 }
        }
    },
    '6000060': {
        toggleable: {
            label: "Enable",
            buffs: { energyRegen: 10, atkPercent: 10 }
        }
    },
    '390080003': {
        toggleable: {
            label: "Enable",
            buffs: { electro: 12, resonanceLiberation: 12 }
        }
    },
    '390080007': {
        toggleable: {
            label: "Enable",
            buffs: { fusion: 12, basicAtk: 12 }
        }
    },


    '6000082': {
        always: { havoc: 12, basicAtk: 12 }
    },
    '6000106': {
        always: { aero: 10 }
    },
    '6000084': {
        always: { fusion: 12, basicAtk: 12 }
    },
    '6000083': {
        always: { glacio: 12, resonanceSkill: 12 }
    },
    '6000085': {
        always: { coord: 40 }
    },
    '6000086': {
        always: { aero: 12, heavyAtk: 12 }
    },
    '6000088': {
        always: { electro: 12, resonanceLiberation: 12 }
    },
    '6000089': {
        always: { electro: 12, resonanceSkill: 12 }
    },
    '6000090': {
        always: { havoc: 12, basicAtk: 12 },
        skillMetaModifier: (skillMeta) => {
            if (skillMeta.name.includes('Nightmare: Crownless')) {
                skillMeta.skillDmgBonus = (skillMeta.skillDmgBonus ?? 0) + 20;
            }
            return skillMeta;
        }
    },
    '6000087': {
        always: { havoc: 12, heavyAtk: 12 }
    },
    '6000091': {
        always: { fusion: 12, resonanceSkill: 12 }
    },
    '6000092': {
        always: { spectro: 12 },
        skillMetaModifier: (skillMeta, {combatState}) => {
            if (skillMeta.name.includes('Nightmare: Mourning Aix') && combatState.spectroFrazzle > 0) {
                skillMeta.skillDmgBonus = (skillMeta.skillDmgBonus ?? 0) + 100;
            }
            return skillMeta;
        }
    },
    '6000105': {
        always: { glacio: 12, coord: 30 }
    },
    '6000113': {
        always: { glacio: 12, aero: 12 }
    },
    '6000114': {
        always: { fusion: 12, resonanceLiberation: 12 }
    },
    '6000076': {
        always: { glacio: 12 }
    },
    '6000080': {
        always: { electro: 12 }
    },
    '6000104': {
        always: { spectro: 12, heavyAtk: 12 }
    },
    '6000112': {
        always: { aero: 12, resonanceLiberation: 12 }
    },
    '6000115': {
        always: { havoc: 12, echoSkill: 20 }
    },
    '6000116': {
        always: { aero: 12, heavyAtk: 12 }
    },
    '6000121': {
        always: { electro: 12, heavyAtk: 12 }
    },
    '6000160': {
        always: { aero: 12, resonanceLiberation: 25 }
    },
    '6000120': {
        always: { fusion: 12, echoSkill: 20 }
    },


    '6000044': {
        stackable: {
            label: "Stacks",
            key: "mainEchoStacks",
            max: 3,
            buffsPerStack: { resonanceSkill: 4, glacio: 4 }
        }
    },

    '6000056': {
        toggleable: {
            label: "Mid-Air?",
        },
        skillMetaModifier: (skillMeta, { characterState }) => {
            const isMidAir = characterState?.mainEchoToggle;

            if (isMidAir && skillMeta.name.includes('Glacio Dreadmane')) {
                skillMeta.skillDmgBonus = (skillMeta.skillDmgBonus ?? 0) + 20;
            }
            return skillMeta;
        }
    },
    '6000053': {
        toggleable: {
            label: "Enable?",
        },
        skillMetaModifier: (skillMeta, { characterState }) => {
            const deadening = characterState?.mainEchoToggle;

            if (deadening && skillMeta.name.includes('Dreamless')) {
                skillMeta.skillDmgBonus = (skillMeta.skillDmgBonus ?? 0) + 50;
            }
            return skillMeta;
        }
    },
    '390070052': {
        skillMetaModifier: (skillMeta) => {
            if (skillMeta.name.includes('Fission Junrock')) {
                skillMeta.tags = ['healing'];
            }
            return skillMeta;
        }
    },
    '390070074': {
        skillMetaModifier: (skillMeta) => {
            if (skillMeta.name.includes('Cruisewing')) {
                skillMeta.tags = ['healing'];
            }
            return skillMeta;
        }
    },
    '390077024': {
        skillMetaModifier: (skillMeta) => {
            if (skillMeta.name.includes('Rocksteady Guardian Skill 3')) {
                skillMeta.tags = ['healing'];
            }
            return skillMeta;
        }
    },
    '390077025': {
        skillMetaModifier: (skillMeta) => {
            if (skillMeta.name.includes('Chasm Guardian Skill 2')) {
                skillMeta.scaling = { atk: 0, hp: 1, def: 0, energyRegen: 0 };
                skillMeta.tags = ['healing'];
            }
            return skillMeta;
        }
    },
    '390080005': {
        toggleable: {
            label: "Enable?",
        },
        skillMetaModifier: (skillMeta, { characterState }) => {
            const geochelone = characterState?.mainEchoToggle;
            if (geochelone) {
                skillMeta.skillDmgBonus = (skillMeta.skillDmgBonus ?? 0) + 10;
            }
            return skillMeta;
        }
    },
    '6000061': {
        skillMetaModifier: (skillMeta) => {
            if (skillMeta.name.includes('Galescourge Stalker')) {
                skillMeta.tags = ['healing'];
            }
            return skillMeta;
        }
    },
    '6000074': {
        skillMetaModifier: (skillMeta, {combatState}) => {
            if (skillMeta.name.includes('Diurnus Knight') && combatState.spectroFrazzle > 0) {
                skillMeta.skillDmgBonus = (skillMeta.skillDmgBonus ?? 0) + 100;
            }
            return skillMeta;
        }
    },
    '6000068': {
        skillMetaModifier: (skillMeta) => {
            if (skillMeta.name.includes('Nimbus Wraith')) {
                skillMeta.tags = ['healing'];
            }
            return skillMeta;
        }
    },
    '6000094': {
        skillMetaModifier: (skillMeta) => {
            if (skillMeta.name.includes('Calcified Junrock')) {
                skillMeta.tags = ['healing'];
            }
            return skillMeta;
        }
    },
    '6000167': {
        always: { havoc: 12, resonanceLiberation: 12 },
        skillMetaModifier: (skillMeta, {combatState}) => {
            if (skillMeta.name.includes('Leviathan Skill 2') && combatState.havocBane > 0) {
                skillMeta.skillDmgTaken = (skillMeta.skillDmgTaken ?? 0) + 100;
            }
            return skillMeta;
        }
    },
    '6000175': {
        skillMetaModifier: (skillMeta) => {
            if (skillMeta.name.includes('Flora Drone Skill 2')) {
                skillMeta.scaling = { hp: 1 };
                skillMeta.tags.push('healing');
            }
            return skillMeta;
        }
    },
    '6000179': {
        always: { spectro: 12, basicAtk: 12 },
        stackable: {
            label: "Stacks",
            key: "mainEchoStacks",
            max: 6,
            buffsPerStack: { echoSkill: 10 }
        },
        skillMetaModifier: (skillMeta, { characterState }) => {
            if (skillMeta.name.includes('Twin Nova: Nebulous Cannon Skill 2')) {
                skillMeta.visible = characterState.nebulousCannon;
                skillMeta.label = 'Twin Nova: Collapsar Blade';
            } else if (skillMeta.name.includes('Twin Nova: Nebulous Cannon Skill 1')) {
                skillMeta.label = 'Twin Nova: Nebulous Cannon';
            }
            return skillMeta;
        }
    },
    '6000180': {
        always: { electro: 12, basicAtk: 12 },
        stackable: {
            label: "Stacks",
            key: "mainEchoStacks",
            max: 6,
            buffsPerStack: { echoSkill: 10 }
        },
        skillMetaModifier: (skillMeta, { characterState }) => {
            if (skillMeta.name.includes('Twin Nova: Collapsar Blade Skill 2')) {
                skillMeta.visible = characterState.collapsarBlade;
                skillMeta.label = 'Twin Nova: Nebulous Cannon';
            } else if (skillMeta.name.includes('Twin Nova: Collapsar Blade Skill 1')) {
                skillMeta.label = 'Twin Nova: Collapsar Blade';
            }
            return skillMeta;
        }
    },
    '6000184': {
        skillMetaModifier: (skillMeta) => {
            if (skillMeta.name.includes('Spacetrek Explorer')) {
                skillMeta.tags.push('shielding');
            }
            return skillMeta;
        }
    },
    '6000190': {
        always: { energyRegen: 10 }
    },
};

export function computeNebulousCollapsarStates(equippedEchoes = []) {
    const main = equippedEchoes[0];
    if (!main) {
        return { nebulousCannon: false, collapsarBlade: false };
    }

    const mainId = String(main.id);
    const others = equippedEchoes.slice(1);

    const has6000180InOthers = others.some(e => e && String(e.id) === '6000180');
    const has6000179InOthers = others.some(e => e && String(e.id) === '6000179');

    const nebulousCannon =
        mainId === '6000179' && has6000180InOthers;

    const collapsarBlade =
        mainId === '6000180' && has6000179InOthers;

    return { nebulousCannon, collapsarBlade };
}

export function applyMainEchoBuffLogic({ equippedEchoes, mergedBuffs, characterState, charId }) {
    const activeStates = characterState?.activeStates ?? {};
    const mainEcho = equippedEchoes?.[0];
    if (!mainEcho) return mergedBuffs;

    const config = mainEchoBuffs?.[mainEcho.id];
    if (!config) return mergedBuffs;

    const { always, toggleable, stackable } = config;

    const applyBuffMap = (buffs) => {
        if (!buffs) return;
        for (const [stat, val] of Object.entries(buffs)) {
            // special “all elements” case
            if (stat === "element") {
                for (const elem of Object.values(elementMap)) {
                    applyStatToMerged(mergedBuffs, elem, val);
                }
            } else {
                applyStatToMerged(mergedBuffs, stat, val);
            }
        }
    };

    // Always-on buffs
    if (always) {
        applyBuffMap(always);
    }

    // Toggleable buffs (simple stat buffs)
    if (toggleable && activeStates?.mainEchoToggle && toggleable.buffs) {
        applyBuffMap(toggleable.buffs);
    }

    // Stackable buffs
    if (stackable) {
        const stackKey = stackable.key ?? "mainEchoStacks";
        const currentStacks = Math.min(
            activeStates?.[stackKey] ?? 0,
            stackable.max ?? 1
        );

        if (currentStacks > 0 && stackable.buffsPerStack) {
            const totalBuffs = {};
            for (const [stat, perStackVal] of Object.entries(stackable.buffsPerStack)) {
                totalBuffs[stat] = (totalBuffs[stat] ?? 0) + perStackVal * currentStacks;
            }
            applyBuffMap(totalBuffs);
        }
    }

    // Special-case: 6000106 extra Aero for specific chars
    if (
        mainEcho.id === "6000106" &&
        (charId === "1409" || charId === "1406" || charId === "1408")
    ) {
        applyStatToMerged(mergedBuffs, "aero", 10);
    }

    return mergedBuffs;
}

export function removeMainEchoBuffLogic({
                                            equippedEchoes,
                                            mergedBuffs,
                                            characterState,
                                            charId
                                        }) {
    const activeStates = characterState?.activeStates ?? {};
    const mainEcho = equippedEchoes?.[0];
    if (!mainEcho) return mergedBuffs;

    const config = mainEchoBuffs?.[mainEcho.id];
    if (!config) return mergedBuffs;

    const { always, toggleable, stackable } = config;

    const removeBuffMap = (buffs) => {
        if (!buffs) return;
        for (const [stat, val] of Object.entries(buffs)) {
            if (!val) continue;

            // same “all elements” handling as apply, but inverted
            if (stat === "element") {
                for (const elem of Object.values(elementMap)) {
                    applyStatToMerged(mergedBuffs, elem, -val);
                }
            } else {
                applyStatToMerged(mergedBuffs, stat, -val);
            }
        }
    };

    // Always-on buffs
    if (always) {
        removeBuffMap(always);
    }

    // Toggleable buffs (only if toggle is currently ON, same as apply)
    if (toggleable && activeStates?.mainEchoToggle && toggleable.buffs) {
        removeBuffMap(toggleable.buffs);
    }

    // Stackable buffs
    if (stackable) {
        const stackKey = stackable.key ?? "mainEchoStacks";
        const currentStacks = Math.min(
            activeStates?.[stackKey] ?? 0,
            stackable.max ?? 1
        );

        if (currentStacks > 0 && stackable.buffsPerStack) {
            const totalBuffs = {};
            for (const [stat, perStackVal] of Object.entries(stackable.buffsPerStack)) {
                totalBuffs[stat] =
                    (totalBuffs[stat] ?? 0) + perStackVal * currentStacks;
            }
            removeBuffMap(totalBuffs);
        }
    }

    // Special-case: 6000106 extra Aero for specific chars
    if (
        mainEcho.id === "6000106" &&
        (charId === "1409" || charId === "1406" || charId === "1408")
    ) {
        applyStatToMerged(mergedBuffs, "aero", -10);
    }

    return mergedBuffs;
}
