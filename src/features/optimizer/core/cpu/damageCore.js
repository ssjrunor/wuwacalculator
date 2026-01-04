// Core damage calculation functions shared between optimizer and suggestions
// Consolidates duplicated logic from computeDamage.js, mainStat/compute.js, setPlan/compute.js

// Skill type flags (must match WGSL)
export const SKILL_FLAGS = {
    BASIC: 1 << 0,
    HEAVY: 1 << 1,
    SKILL: 1 << 2,
    LIB: 1 << 3,
    OUTRO: 1 << 4,
    INTRO: 1 << 5,
    ECHO_SKILL: 1 << 6,
    COORD: 1 << 7,
    // Note: "ultimate" in SKILLTYPE_FLAGS is the same as LIB (1 << 3)
    // The name "ultimate" refers to resonance liberation skills
    ULTIMATE: 1 << 3,
};

/**
 * Calculate final stats from base + percent + flat
 */
export function calcFinalStats(base, percent, flat, existing = 0) {
    return base * (percent / 100) + flat + existing;
}

/**
 * Character 1206 (brant): ER → ATK conversion
 * @param {number} charId - Character ID
 * @param {number} finalER - Final energy regen value
 * @returns {number} Extra ATK to add
 */
export function calc1206ErToAtk(charId, finalER) {
    if (charId !== 1206) return 0;
    const erOver = Math.max(0, finalER - 150);
    return Math.min(erOver * 20, 2600);
}

/**
 * Character 1306 (augusta): Crit Rate → Crit DMG conversion
 * @param {number} charId - Character ID
 * @param {number} sequence - Character sequence
 * @param {number} critRateTotal - Total crit rate (as decimal, e.g., 1.2 for 120%)
 * @returns {number} Extra crit damage to add (as decimal)
 */
export function calc1306CritConversion(charId, sequence, critRateTotal) {
    if (charId !== 1306 || sequence < 2) return 0;

    let bonusCd = 0;

    // S2: excess crit rate over 100% converts to crit dmg (max 100%)
    if (critRateTotal >= 1) {
        const excess = critRateTotal - 1;
        bonusCd += Math.min(excess * 2, 1);
    }

    // S6: excess crit rate over 150% converts to more crit dmg (max 50%)
    if (sequence >= 6 && critRateTotal >= 1.5) {
        const excess = critRateTotal - 1.5;
        bonusCd += Math.min(excess * 2, 0.5);
    }

    return bonusCd;
}

/**
 * Character 1209 (Xiangli Yao): ER → Vulnerability + Crit conversion
 * @param {number} charId - Character ID
 * @param {number} finalER - Final energy regen value
 * @param {number} id - skill id
 * @returns {Object} { dmgVuln, critRateBonus, critDmgBonus }
 */
export function calc1209Conversion(charId, finalER, id) {
    if (charId !== 1209 || finalER <= 0) return { dmgVuln: 0, critRateBonus: 0, critDmgBonus: 0 };

    const erOver = finalER - 100;
    const dmgVuln = Math.min(erOver * .25, 40);

    let critRateBonus = 0;
    let critDmgBonus = 0;

    // Ultimate skill gets bonus crit from ER
    const skillIdU32 = id >>> 0;
    if (skillIdU32 === 2206007304) {
        critRateBonus = Math.min(erOver * .5, 80) / 100;
        critDmgBonus = Math.min(erOver, 160) / 100;
    }

    return { dmgVuln, critRateBonus, critDmgBonus };
}

/**
 * Core damage formula - computes average damage
 * Uses branchless crit rate clamping like WGSL
 * @param {Object} params - Damage calculation parameters
 * @returns {number} Average damage
 */
export function computeAvgDamage({
    scaled,
    multiplier,
    flatDmg,
    resMult,
    defMult,
    dmgReduction,
    dmgBonus,
    dmgAmplify,
    critRateTotal,
    critDmgTotal,
    dmgVuln = 0,
}) {
    // Flat damage only case - still apply all multipliers
    if (multiplier === 0 && scaled === 0 && flatDmg > 0) {
        const baseDamage =
            flatDmg *
            resMult *
            defMult *
            (dmgReduction + dmgVuln / 100) *
            dmgBonus *
            dmgAmplify;

        const critHit = baseDamage * critDmgTotal;
        const cr = Math.max(0, Math.min(1, critRateTotal));
        return cr * critHit + (1 - cr) * baseDamage;
    }

    const baseDamage =
        (scaled * multiplier + flatDmg) *
        resMult *
        defMult *
        (dmgReduction + dmgVuln / 100) *
        dmgBonus *
        dmgAmplify;

    const critHit = baseDamage * critDmgTotal;

    // Branchless crit rate handling via clamp
    const cr = Math.max(0, Math.min(1, critRateTotal));
    return cr * critHit + (1 - cr) * baseDamage;
}
