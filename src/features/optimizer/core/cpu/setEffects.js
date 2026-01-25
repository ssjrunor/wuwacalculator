// Branchless set effects computation for CPU optimizer
// Mirrors the WGSL shader pattern from common.wgsl

import { SKILL_MASK } from "../misc/utils.js";

// Branchless threshold helpers (returns 1 if count >= threshold, else 0)
const has2 = (count) => Math.min(1, count >>> 1);
const has3 = (count) => Math.min(1, Math.floor(count / 3));
const has5 = (count) => Math.min(1, Math.floor(count / 5));

/**
 * Optimized version that pre-caches threshold values for hot path
 * Use this when computing many combos with the same set counts
 * @param {Uint32Array|number[]} s - Array of set piece counts indexed by setId
 * @param {number} skillMask - Skill type flags bitmask
 * @returns {Object} Object containing all stat bonuses
 */
export function applySetEffectsFast(s, skillMask = 0) {
    // Pre-cache all threshold checks
    const s1_2 = has2(s[1]);     const s1_5 = has5(s[1]);
    const s2_2 = has2(s[2]);     const s2_5 = has5(s[2]);
    const s3_2 = has2(s[3]);     const s3_5 = has5(s[3]);
    const s4_2 = has2(s[4]);     const s4_5 = has5(s[4]);
    const s5_2 = has2(s[5]);     const s5_5 = has5(s[5]);
    const s6_2 = has2(s[6]);     const s6_5 = has5(s[6]);
    const s7_5 = has5(s[7]);
    const s8_2 = has2(s[8]);
    const s9_2 = has2(s[9]);     const s9_5 = has5(s[9]);
    const s10_2 = has2(s[10]);   const s10_5 = has5(s[10]);
    const s11_2 = has2(s[11]);   const s11_5 = has5(s[11]);
    const s12_2 = has2(s[12]);
    const s13_2 = has2(s[13]);   const s13_5 = has5(s[13]);
    const s14_2 = has2(s[14]);   const s14_5 = has5(s[14]);
    const s16_2 = has2(s[16]);   const s16_5 = has5(s[16]);
    const s17_2 = has2(s[17]);   const s17_5 = has5(s[17]);
    const s18_2 = has2(s[18]);   const s18_5 = has5(s[18]);

    const s19_3 = has3(s[19]);
    const s20_3 = has3(s[20]);
    const s21_3 = has3(s[21]);
    const s22_3 = has3(s[22]);
    const s23_3 = has3(s[23]);
    const s24_2 = has2(s[24]);
    const s25_5 = has5(s[25]);
    const s26_2 = has2(s[26]);   const s26_5 = has5(s[26]);
    const s27_2 = has2(s[27]);   const s27_5 = has5(s[27]);
    const s28_2 = has2(s[28]);
    const s29_2 = has2(s[29]);   const s29_5 = has5(s[29]);

    return {
        glacio: 10 * s1_2 + 30 * s1_5 + 22.5 * s10_5,
        fusion: 10 * s2_2 + 30 * s2_5 + 10 * s18_2 + 15 * s18_5 + 16 * s22_3 + 10 * s27_2 + 20 * s27_5 + 10 * s28_2,
        electro: 10 * s3_2 + 30 * s3_5,
        aero: 10 * s4_2 + 30 * s4_5 + 10 * s16_2 + 30 * s16_5 + 10 * s17_2 + 30 * s17_5 + 10 * s29_2 + 15 * s29_5,
        spectro: 10 * s5_2 + 30 * s5_5 + 10 * s11_2 + 15 * s11_5 + 10 * s24_2 + 10 * s26_2 + 30 * s26_5,
        havoc: 10 * s6_2 + 30 * s6_5 + 10 * s12_2,
        atkP: 15 * s7_5 + 10 * s9_2 + 20 * s9_5 + 20 * s13_5 + 15 * s14_5 + 30 * s20_3 + 20 * s23_3 + 25 * s25_5,
        atkF: 0,
        hpP: 0,
        hpF: 0,
        defP: 0,
        defF: 0,
        critRate: 20 * s11_5 + 10 * s17_5 + 20 * s19_3 + 20 * s22_3 *
            (((skillMask & (SKILL_MASK.HEAVY | SKILL_MASK.ECHO_SKILL)) !== 0) ? 1 : 0) + 20 * s27_5
            + (((skillMask & SKILL_MASK.ECHO_SKILL) !== 0) ? 1 : 0) * s29_5,
        critDmg: 20 * s20_3,
        er: 0,
        erSetBonus: 10 * s8_2 + 10 * s13_2 + 10 * s14_2,
        basic: 40 * s26_5,
        heavy: 30 * s21_3,
        skill: 12 * s10_2 + 36 * s10_5,
        lib: 20 * s18_5 + 30 * s23_3,
        echoSkill: 35 * s19_3 + 16 * s21_3,
        coord: 80 * s13_5,
        bonusBase: 0
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