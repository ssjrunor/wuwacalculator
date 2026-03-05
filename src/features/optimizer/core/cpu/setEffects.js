// Branchless set effects computation for CPU optimizer
// Mirrors the WGSL shader pattern from common.wgsl

import { SKILL_MASK } from "../misc/utils.js";
import {
    getSetCountBucket,
    getSetConstLutRowOffset,
    SET_CONST_LUT_SET_SLOTS,
    SET_CONST_LUT_SIZE,
    SET_CONST_LUT_STAT_INDEX,
    SET_RUNTIME_TOGGLE_ALL,
    SET_RUNTIME_TOGGLE_SET22_P1,
    SET_RUNTIME_TOGGLE_SET22_P2,
    SET_RUNTIME_TOGGLE_SET29_FIVE,
} from "../encode/setLutEncoding.js";

// Branchless threshold helpers (returns 1 if count >= threshold, else 0)
const has2 = (count) => Math.min(1, count >>> 1);
const has3 = (count) => Math.min(1, Math.floor(count / 3));
const has5 = (count) => Math.min(1, Math.floor(count / 5));


/**
 * Apply set effects from encoded LUT (CPU path).
 * @param {Uint32Array|number[]} s - Array of set piece counts indexed by setId
 * @param {number} skillMask - Skill type flags bitmask
 * @param {Float32Array|null|undefined} setConstLut - Encoded static set buff LUT
 * @param setRuntimeMask
 * @param touchedSetIds
 * @param touchedSetCount
 * @returns {Object} Object containing all stat bonuses
 */
export function applySetEffectsEncoded(
    s,
    skillMask = 0,
    setConstLut = null,
    setRuntimeMask = SET_RUNTIME_TOGGLE_ALL,
    touchedSetIds = null,
    touchedSetCount = 0
) {
    const IDX = SET_CONST_LUT_STAT_INDEX;

    let atkP = 0;           let atkF = 0;
    let hpP = 0;            let hpF = 0;
    let defP = 0;           let defF = 0;
    let critRate = 0;       let critDmg = 0;
    let er = 0;             let erSetBonus = 0;
    let basic = 0;          let heavy = 0;
    let skill = 0;          let lib = 0;
    let aero = 0;           let spectro = 0;
    let fusion = 0;         let glacio = 0;
    let havoc = 0;          let electro = 0;
    let echoSkill = 0;      let coord = 0;
    let bonusBase = 0;

    const hasTouchedSetList =
        touchedSetIds != null &&
        touchedSetCount > 0 &&
        typeof touchedSetIds.length === "number";

    if (hasTouchedSetList) {
        const count = Math.min(touchedSetCount | 0, touchedSetIds.length | 0);
        for (let i = 0; i < count; i++) {
            const setId = touchedSetIds[i] | 0;
            if (setId < 0 || setId >= SET_CONST_LUT_SET_SLOTS) continue;

            const pieces = s[setId] | 0;
            if (pieces < 2) continue;

            const bucket = getSetCountBucket(pieces);
            if (bucket === 0) continue;

            const base = getSetConstLutRowOffset(setId, bucket);
            atkP += setConstLut[base + IDX.atkP];
            atkF += setConstLut[base + IDX.atkF];
            hpP += setConstLut[base + IDX.hpP];
            hpF += setConstLut[base + IDX.hpF];
            defP += setConstLut[base + IDX.defP];
            defF += setConstLut[base + IDX.defF];
            critRate += setConstLut[base + IDX.critRate];
            critDmg += setConstLut[base + IDX.critDmg];
            er += setConstLut[base + IDX.er];
            erSetBonus += setConstLut[base + IDX.erSetBonus];
            basic += setConstLut[base + IDX.basic];
            heavy += setConstLut[base + IDX.heavy];
            skill += setConstLut[base + IDX.skill];
            lib += setConstLut[base + IDX.lib];
            aero += setConstLut[base + IDX.aero];
            spectro += setConstLut[base + IDX.spectro];
            fusion += setConstLut[base + IDX.fusion];
            glacio += setConstLut[base + IDX.glacio];
            havoc += setConstLut[base + IDX.havoc];
            electro += setConstLut[base + IDX.electro];
            echoSkill += setConstLut[base + IDX.echoSkill];
            coord += setConstLut[base + IDX.coord];
            bonusBase += setConstLut[base + IDX.bonusBase];
        }
    } else {
        for (let setId = 0; setId < SET_CONST_LUT_SET_SLOTS; setId++) {
            const pieces = s[setId] | 0;
            if (pieces < 2) continue;

            const bucket = getSetCountBucket(pieces);
            if (bucket === 0) continue;

            const base = getSetConstLutRowOffset(setId, bucket);
            atkP += setConstLut[base + IDX.atkP];
            atkF += setConstLut[base + IDX.atkF];
            hpP += setConstLut[base + IDX.hpP];
            hpF += setConstLut[base + IDX.hpF];
            defP += setConstLut[base + IDX.defP];
            defF += setConstLut[base + IDX.defF];
            critRate += setConstLut[base + IDX.critRate];
            critDmg += setConstLut[base + IDX.critDmg];
            er += setConstLut[base + IDX.er];
            erSetBonus += setConstLut[base + IDX.erSetBonus];
            basic += setConstLut[base + IDX.basic];
            heavy += setConstLut[base + IDX.heavy];
            skill += setConstLut[base + IDX.skill];
            lib += setConstLut[base + IDX.lib];
            aero += setConstLut[base + IDX.aero];
            spectro += setConstLut[base + IDX.spectro];
            fusion += setConstLut[base + IDX.fusion];
            glacio += setConstLut[base + IDX.glacio];
            havoc += setConstLut[base + IDX.havoc];
            electro += setConstLut[base + IDX.electro];
            echoSkill += setConstLut[base + IDX.echoSkill];
            coord += setConstLut[base + IDX.coord];
            bonusBase += setConstLut[base + IDX.bonusBase];
        }
    }

    const set22EnabledForSkill =
        (((skillMask & SKILL_MASK.HEAVY) !== 0) &&
            ((setRuntimeMask & SET_RUNTIME_TOGGLE_SET22_P1) !== 0)) ||
        (((skillMask & SKILL_MASK.ECHO_SKILL) !== 0)
            && ((setRuntimeMask & SET_RUNTIME_TOGGLE_SET22_P2) !== 0));
    const set29EnabledForSkill =
        ((skillMask & SKILL_MASK.ECHO_SKILL) !== 0)
        && ((setRuntimeMask & SET_RUNTIME_TOGGLE_SET29_FIVE) !== 0);
    critRate += 20 * has3(s[22]) * (set22EnabledForSkill ? 1 : 0)
              + 20 * has5(s[29]) * (set29EnabledForSkill ? 1 : 0);

    return {
        glacio, fusion, electro, aero, spectro, havoc,
        atkP, atkF, hpP, hpF, defP, defF, critRate, critDmg, er, erSetBonus,
        basic, heavy, skill, lib, echoSkill, coord, bonusBase
    };
}

/**
 * Select element bonus branchlessly using array indexing
 * @param {Object} bonuses - Set effect bonuses object
 * @param {number} elementId - Element ID (0=aero, 1=glacio, 2=fusion, 3=spectro, 4=havoc, 5=electro)
 * @returns {number} Element damage bonus
 */
export function selectElementBonus(bonuses, elementId) {
    const elemBonuses = [
        bonuses.aero,
        bonuses.glacio,
        bonuses.fusion,
        bonuses.spectro,
        bonuses.havoc,
        bonuses.electro
    ];
    const idx = Math.max(0, Math.min(5, Math.floor(elementId)));
    return elemBonuses[idx];
}

/**
 * Select skill type bonuses branchlessly using bit extraction
 * @param {Object} bonuses - Set effect bonuses object
 * @param {number} skillMask - Skill type flags bitmask
 * @returns {number} Total skill type bonus
 */
export function selectSkillBonuses(bonuses, skillMask) {
    return (
        bonuses.basic     * ((skillMask >>> 0) & 1) +
        bonuses.heavy     * ((skillMask >>> 1) & 1) +
        bonuses.skill     * ((skillMask >>> 2) & 1) +
        bonuses.lib       * ((skillMask >>> 3) & 1) +
        bonuses.echoSkill * ((skillMask >>> 6) & 1) +
        bonuses.coord     * ((skillMask >>> 7) & 1)
    );
}

/**
 * Compute total damage bonus from set effects
 * @param {Object} bonuses - Set effect bonuses object
 * @param {number} elementId - Element ID
 * @param {number} skillMask - Skill type flags bitmask
 * @returns {number} Total damage bonus percentage
 */
export function computeTotalDmgBonus(bonuses, elementId, skillMask) {
    return (
        bonuses.bonusBase +
        selectElementBonus(bonuses, elementId) +
        selectSkillBonuses(bonuses, skillMask)
    );
}
