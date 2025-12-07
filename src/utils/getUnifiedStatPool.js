import {normalizeLegacyEchoStats} from "./echoHelper.js";

export function makeBaseBuffs() {
    return {
        percent: 0,
        flat: 0
    };
}

export function makeModBuffs() {
    return {
        resShred: 0,
        dmgBonus: 0,
        amplify: 0,
        defIgnore: 0,
        defShred: 0,
        dmgVuln: 0,
        critRate: 0,
        critDmg: 0
    };
}

function initSkillTypeBucket() {
    return {
        all: makeModBuffs(),
        basicAtk: makeModBuffs(),
        heavyAtk: makeModBuffs(),
        resonanceSkill: makeModBuffs(),
        resonanceLiberation: makeModBuffs(),
        introSkill: makeModBuffs(),
        coord: makeModBuffs(),
        echoSkill: makeModBuffs(),
        outroSkill: makeModBuffs(),
        spectroFrazzle: makeModBuffs(),
        aeroErosion: makeModBuffs(),
        havocBane: makeModBuffs(),
        electroFlare: makeModBuffs(),
        tuneRupture: makeModBuffs()
    };
}

function initAttributeBucket() {
    return {
        all: makeModBuffs(),
        aero: makeModBuffs(),
        glacio: makeModBuffs(),
        spectro: makeModBuffs(),
        fusion: makeModBuffs(),
        electro: makeModBuffs(),
        havoc: makeModBuffs(),
        physical: makeModBuffs()
    };
}

function mergeBaseBuff(target, src) {
    if (!src) return;
    if (typeof src.percent === 'number') target.percent += src.percent;
    if (typeof src.flat === 'number') target.flat += src.flat;
}

function mergeModBuff(target, src) {
    if (!src) return;
    for (const key of Object.keys(target)) {
        const v = src[key];
        if (typeof v === 'number') {
            target[key] += v;
        }
    }
}

export function getUnifiedStatPool(buffSources, overrideLogic = null) {
    let merged = {
        atk: makeBaseBuffs(),
        hp: makeBaseBuffs(),
        def: makeBaseBuffs(),

        skillType: initSkillTypeBucket(),
        attribute: initAttributeBucket(),

        flatDmg: 0,
        critRate: 0,       // global crit
        critDmg: 0,        // global crit
        energyRegen: 0,
        healingBonus: 0,
        shieldBonus: 0
    };

    for (const source of buffSources ?? []) {
        if (!source) continue;

        // ---- base stats ----
        if (source.atk) mergeBaseBuff(merged.atk, source.atk);
        if (source.hp) mergeBaseBuff(merged.hp, source.hp);
        if (source.def) mergeBaseBuff(merged.def, source.def);

        // ---- per-skill-type mods ----
        if (source.skillType) {
            for (const [skillKey, skillBuff] of Object.entries(source.skillType)) {
                // allow custom skillType keys and auto-init them
                if (!merged.skillType[skillKey]) {
                    merged.skillType[skillKey] = makeModBuffs();
                }
                mergeModBuff(merged.skillType[skillKey], skillBuff);
            }
        }

        // ---- per-attribute mods ----
        if (source.attribute) {
            for (const [attrKey, attrBuff] of Object.entries(source.attribute)) {
                if (!merged.attribute[attrKey]) {
                    merged.attribute[attrKey] = makeModBuffs();
                }
                mergeModBuff(merged.attribute[attrKey], attrBuff);
            }
        }

        // ---- global scalar fields ----
        for (const key of [
            'flatDmg',
            'physical',
            'critRate',
            'critDmg',
            'energyRegen',
            'healingBonus',
            'shieldBonus'
        ]) {
            const v = source[key];
            if (typeof v === 'number') {
                merged[key] += v;
            }
        }
    }

    // character-specific overrides still work, but now on the refined structure
    if (overrideLogic?.modifyUnifiedStats) {
        const result = overrideLogic.modifyUnifiedStats({
            mergedBuffs: merged,
            combatState: overrideLogic.combatState ?? {},
            skillMeta: overrideLogic.skillMeta ?? {},
            characterState: overrideLogic.characterState ?? {},
            isActiveSequence: overrideLogic.isActiveSequence ?? (() => false),
            isToggleActive: overrideLogic.isToggleActive ?? (() => false),
            characterLevel: overrideLogic.characterLevel ?? 1
        });

        if (result?.mergedBuffs) {
            merged = result.mergedBuffs;
        }
    }

    return merged;
}