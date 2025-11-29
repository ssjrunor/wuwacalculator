// ----------------------
// Helpers
// ----------------------

import {SKILLTYPE_FLAGS} from "../../optimizer/prepareGpuContext.js";

function inRange(val, range) {
    if (!range) return true; // no constraint
    const { min = -Infinity, max = Infinity } = range;
    if (min > max) return true; // treat invalid as "no constraint"
    return val >= min && val <= max;
}

function passesConstraints({
                               finalAtk,
                               finalHp,
                               finalDef,
                               critRate,
                               critDmg,
                               finalER,
                               dmgBonus,
                               damage,
                               constraints
                           }) {
    if (!constraints) return true;

    const {
        atk,
        hp,
        def,
        critRate: cr,
        critDmg: cd,
        er,
        dmgBonus: db,
        damage: dmgRange
    } = constraints;

    if (!inRange(finalAtk,   atk))       return false;
    if (!inRange(finalHp,    hp))        return false;
    if (!inRange(finalDef,   def))       return false;
    if (!inRange(critRate,   cr))        return false;
    if (!inRange(critDmg,    cd))        return false;
    if (!inRange(finalER,    er))        return false;
    if (!inRange(dmgBonus,   db))        return false;
    return inRange(damage, dmgRange);
}

export function computeMainStatDamage(
    params,
    mainStats,
    constraints = null,
    returnScalar = false
) {
    // ----- unpack (same as you have) -----
    const {
        baseAtk = 0,
        baseHp = 0,
        baseDef = 0,
        baseER = 0,

        finalAtk: baseFinalAtk = 0,
        finalHp:  baseFinalHp  = 0,
        finalDef: baseFinalDef = 0,

        scalingAtk = 0,
        scalingHp  = 0,
        scalingDef = 0,
        scalingER  = 0,

        multiplier = 0,
        flatDmg    = 0,

        resMult = 1,
        defMult = 1,

        dmgReductionTotal = 1,
        dmgBonus = 1,
        dmgAmplify = 1,

        critRate = 0,
        critDmg  = 1,

        elementId   = 0,
        skillTypeId = 0,

        charId = 0,
        sequence = 0,
    } = params;

    const {
        atkPercent = 0, atkFlat = 0,
        hpPercent  = 0, hpFlat  = 0,
        defPercent = 0, defFlat = 0,

        critRate: critRateFromStats = 0,
        critDmg:  critDmgFromStats  = 0,

        energyRegen = 0,
        aero    = 0,
        glacio  = 0,
        fusion  = 0,
        spectro = 0,
        havoc   = 0,
        electro = 0,
    } = mainStats || {};

    // element + skill bonuses (same as before)
    let elementBonus = 0;
    switch (elementId) {
        case 0: elementBonus += aero;    break;
        case 1: elementBonus += glacio;  break;
        case 2: elementBonus += fusion;  break;
        case 3: elementBonus += spectro; break;
        case 4: elementBonus += havoc;   break;
        case 5: elementBonus += electro; break;
    }

    const dmgBonusTotal = dmgBonus + elementBonus / 100;

    // final stats
    let finalER = baseER + (energyRegen);

    let finalAtk =
        baseAtk * (atkPercent / 100) + atkFlat + baseFinalAtk;

    const finalHp =
        baseHp * (hpPercent / 100) + hpFlat + baseFinalHp;

    const finalDef =
        baseDef * (defPercent / 100) + defFlat + baseFinalDef;

    // Brant ER → ATK
    if (charId === 1206) {
        const erOver = Math.max(0, finalER - 150);
        const extraAtk = Math.min(erOver * 20, 2600);
        finalAtk += extraAtk;
    }

    let critRateTotal = critRate + critRateFromStats / 100;
    let critDmgTotal  = critDmg  + critDmgFromStats  / 100;

    if (charId === 1306) {
        let bonusCd = 0;
        if (sequence >= 2) {
            const excess = critRateTotal >= 1 ? (critRateTotal - 1) : 0;
            bonusCd += Math.min(1, excess * 2);
        }
        if (sequence >= 6) {
            const excess = critRateTotal >= 1.5 ? (critRateTotal - 1.5) : 0;
            bonusCd += Math.min(0.5, excess * 2);
        }
        critDmgTotal += bonusCd;
    }

    // scaling
    const scaled =
        finalAtk * scalingAtk +
        finalHp  * scalingHp +
        finalDef * scalingDef +
        finalER  * scalingER;

    // flat dmg only case
    if (multiplier === 0 && scalingAtk === 0 && flatDmg > 0) {
        const damage = flatDmg;
        const passed = passesConstraints({
            finalAtk,
            finalHp,
            finalDef,
            critRate: critRateTotal,
            critDmg: critDmgTotal,
            finalER,
            dmgBonus: dmgBonusTotal,
            damage,
            constraints,
        });
        const result = passed ? damage : 0;
        if (returnScalar) return result;

        return {
            avgDamage: result,
            baseDamage: damage,
            finalAtk,
            finalHp,
            finalDef,
            finalER,
            critRateTotal,
            critDmgTotal,
            dmgBonusTotal,
            passedConstraints: passed
        };
    }

    const baseDamage =
        (scaled * multiplier + flatDmg) *
        resMult *
        defMult *
        dmgReductionTotal *
        dmgBonusTotal *
        dmgAmplify;

    const critHit  = baseDamage * critDmgTotal;
    let avgDamage =
        critRateTotal * critHit +
        (1 - critRateTotal) * baseDamage;
    if (critRateTotal >= 1) avgDamage = critHit;

    const passed = passesConstraints({
        finalAtk,
        finalHp,
        finalDef,
        critRate: critRateTotal,
        critDmg: critDmgTotal,
        finalER,
        dmgBonus: dmgBonusTotal,
        damage: avgDamage,
        constraints,
    });

    const result = passed ? avgDamage : 0;

    if (returnScalar) return result;

    return {
        avgDamage: result,
        baseDamage,
        finalAtk,
        finalHp,
        finalDef,
        finalER,
        critRateTotal,
        critDmgTotal,
        dmgBonusTotal,
        passedConstraints: passed
    };
}