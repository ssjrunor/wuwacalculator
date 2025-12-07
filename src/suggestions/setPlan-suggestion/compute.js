import {SKILLTYPE_FLAGS} from "../../optimizer/prepareGpuContext.js";

function inRange(val, range) {
    if (!range) return true;
    const { min = -Infinity, max = Infinity } = range;
    if (min > max) return true;
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
    if (!inRange(damage,     dmgRange))  return false;

    return true;
}


export function computeSetPlanDamage(ctx, setPlan = {}, constraints = null) {
    const {
        baseAtk = 0,
        baseHp  = 0,
        baseDef = 0,
        baseER  = 0,

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
    } = ctx || {};

    // -------------------------
    // Set counts from setPlan
    // -------------------------
    const setCount = new Array(32).fill(0);
    for (const [id, pieces] of Object.entries(setPlan || {})) {
        const idx = Number(id);
        if (Number.isFinite(idx) && idx >= 0 && idx < 32) {
            setCount[idx] = pieces;
        }
    }

    // -------------------------
    // Accumulators (set-only)
    // -------------------------
    let atkP = 0;
    let atkF = 0;
    let hpP  = 0;
    let hpF  = 0;
    let defP = 0;
    let defF = 0;

    let critRateEcho = 0;
    let critDmgEcho  = 0;
    let erEcho       = 0;

    let basicEcho = 0;
    let heavyEcho = 0;
    let skillEcho = 0;
    let libEcho   = 0;

    let aero    = 0;
    let spectro = 0;
    let fusion  = 0;
    let glacio  = 0;
    let havoc   = 0;
    let electro = 0;

    let echoSkill = 0;
    let coord     = 0;

    // -------------------------
    // Apply set effects (mirror WGSL)
    // -------------------------
    let bonus = 0;
    let finalER = baseER + erEcho; // erEcho is 0 here, but kept for parity

    // SET 1 — Glacio 2/5
    if (setCount[1] >= 2) { glacio += 10.0; }
    if (setCount[1] >= 5) { glacio += 30.0; }

    // SET 2 — Fusion 2/5
    if (setCount[2] >= 2) { fusion += 10.0; }
    if (setCount[2] >= 5) { fusion += 30.0; }

    // SET 3 — Electro 2/5
    if (setCount[3] >= 2) { electro += 10.0; }
    if (setCount[3] >= 5) { electro += 30.0; }

    // SET 4 — Aero 2/5
    if (setCount[4] >= 2) { aero += 10.0; }
    if (setCount[4] >= 5) { aero += 30.0; }

    // SET 5 — Spectro 2/5
    if (setCount[5] >= 2) { spectro += 10.0; }
    if (setCount[5] >= 5) { spectro += 30.0; }

    // SET 6 — Havoc 2/5
    if (setCount[6] >= 2) { havoc += 10.0; }
    if (setCount[6] >= 5) { havoc += 30.0; }

    // SET 7 — Healing 2pc, ATK% 5pc
    // if (setCount[7] >= 2) { setDmgBonus += 0.10; } // commented in WGSL
    if (setCount[7] >= 5) { atkP += 15.0; }

    // SET 8 — Energy Regen 2pc
    if (setCount[8] >= 2) { finalER += 10.0; }

    // SET 9 — ATK% 2/5
    if (setCount[9] >= 2) { atkP += 10.0; }
    if (setCount[9] >= 5) { atkP += 20.0; }

    // SET 10 — Glacio resonance skill set
    if (setCount[10] >= 2) {
        glacio += 12.0;
    }
    if (setCount[10] >= 5) {
        glacio += 22.5;
        skillEcho += 36.0;
    }

    // SET 11 — Spectro + Crit Rate
    if (setCount[11] >= 2) { spectro += 10.0; }
    if (setCount[11] >= 5) {
        critRateEcho += 20.0;
        spectro += 15.0;
    }

    // SET 12 — Havoc 2pc
    if (setCount[12] >= 2) { havoc += 10.0; }

    // SET 13 — ER → ATK%
    if (setCount[13] >= 2) { finalER += 10.0; }
    if (setCount[13] >= 5) {
        coord += 80.0;
        atkP += 20.0;
    }

    // SET 14 — ER 2pc, ATK% 5pc + conditional DMG bonus
    if (setCount[14] >= 2) { finalER += 10.0; }
    if (setCount[14] >= 5) {
        atkP += 15.0;
        if (finalER >= 250.0) {
            bonus += 30.0;
        }
    }

    // SET 16 — Aero (duplicate of 4)
    if (setCount[16] >= 2) { aero += 10.0; }
    if (setCount[16] >= 5) { aero += 30.0; }

    // SET 17 — Aero + Crit Rate
    if (setCount[17] >= 2) { aero += 10.0; }
    if (setCount[17] >= 5) {
        critRateEcho += 10.0;
        aero += 30.0;
    }

    // SET 18 — Fusion + Resonance Liberation
    if (setCount[18] >= 2) { fusion += 10.0; }
    if (setCount[18] >= 5) {
        fusion += 15.0;
        libEcho += 20.0;
    }

    // 3-piece sets
    // SET 19
    if (setCount[19] >= 3) {
        critRateEcho += 20.0;
        echoSkill += 35.0;
    }

    // SET 20
    if (setCount[20] >= 3) {
        atkP += 30.0;
        critDmgEcho += 20.0;
    }

    // SET 21
    if (setCount[21] >= 3) {
        heavyEcho += 30.0;
        echoSkill += 16.0;
    }

    // SET 22
    if (setCount[22] >= 3) {
        if (skillTypeId & SKILLTYPE_FLAGS.echoSkill || skillTypeId & SKILLTYPE_FLAGS.heavy) {
            critRateEcho += 20.0;
        }
        fusion += 16.0;
    }

    // SET 23
    if (setCount[23] >= 3) {
        atkP += 20.0;
        libEcho += 30.0;
    }

    if (setCount[24] >= 2) { spectro += 10.0; }

    if (setCount[25] >= 5) { bonus += 25.0; }

    if (setCount[26] >= 2) { spectro += 10.0; }
    if (setCount[26] >= 5) {
        spectro += 30.0;
        basicEcho += 40.0;
    }

    // -------------------------
    // Element bonuses (→ bonus%)
    // -------------------------
    if (elementId === 0.0) { bonus += aero;    }
    if (elementId === 1.0) { bonus += glacio;  }
    if (elementId === 2.0) { bonus += fusion;  }
    if (elementId === 3.0) { bonus += spectro; }
    if (elementId === 4.0) { bonus += havoc;   }
    if (elementId === 5.0) { bonus += electro; }

    // Skill-type bonuses
    if (skillTypeId & SKILLTYPE_FLAGS.basic)     bonus += basicEcho;
    if (skillTypeId & SKILLTYPE_FLAGS.heavy)     bonus += heavyEcho;
    if (skillTypeId & SKILLTYPE_FLAGS.skill)     bonus += skillEcho;
    if (skillTypeId & SKILLTYPE_FLAGS.ultimate)  bonus += libEcho;
    if (skillTypeId & SKILLTYPE_FLAGS.echoSkill) bonus += echoSkill;
    if (skillTypeId & SKILLTYPE_FLAGS.coord)     bonus += coord;

    const dmgBonusTotal = dmgBonus + bonus / 100.0;

    // -------------------------
    // Final stats
    // -------------------------
    let finalAtk =
        baseAtk * (atkP / 100.0) + atkF + baseFinalAtk;

    const finalHp =
        baseHp * (hpP / 100.0) + hpF + baseFinalHp;

    const finalDef =
        baseDef * (defP / 100.0) + defF + baseFinalDef;

    let critRateTotal = critRate + critRateEcho / 100.0;
    let critDmgTotal  = critDmg  + critDmgEcho  / 100.0;


    if (charId === 1206) {
        const erOver = Math.max(0, finalER - 150.0);
        let extraAtk = erOver * 20.0;
        finalAtk += Math.min(extraAtk, 2600.0);
    }

    let dmgVuln = 0;
    if (charId === 1209) {
        const erOver = Math.max(0, finalER - 100.0);
        dmgVuln += Math.min(erOver * 0.25, 40);
        if (skillTypeId & SKILLTYPE_FLAGS.ultimate) {
            critRateTotal += Math.min(erOver * .5 / 100, .8);
            critDmgTotal += Math.min(erOver / 100, 1.6);
        }
    }

    // -------------------------
    // Ability scaling
    // -------------------------
    const scaled =
        finalAtk * scalingAtk +
        finalHp  * scalingHp +
        finalDef * scalingDef +
        finalER  * scalingER;

    // -------------------------
    // Fixed dmg case
    // -------------------------
    if (multiplier === 0 && scalingAtk === 0 && flatDmg > 0) {
        /*
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
        */
        return {
            avgDamage: flatDmg,
            baseDamage: flatDmg,
/*
            finalAtk,
            finalHp,
            finalDef,
            finalER,
            critRateTotal,
            critDmgTotal,
            dmgBonusTotal,
            passedConstraints: passed,
*/
        };
    }

    // -------------------------
    // Base damage
    // -------------------------
    const baseDamage =
        (scaled * multiplier + flatDmg) *
        resMult *
        defMult *
        (dmgReductionTotal + dmgVuln / 100) *
        dmgBonusTotal *
        dmgAmplify;

    const critHit  = baseDamage * critDmgTotal;
    let avgDamage =
        critRateTotal * critHit +
        (1 - critRateTotal) * baseDamage;
    if (critRateTotal >= 1) avgDamage = critHit;

/*
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
*/

    return {
        avgDamage: Math.floor(avgDamage),
        baseDamage,
/*
        finalAtk,
        finalHp,
        finalDef,
        finalER,
        critRateTotal,
        critDmgTotal,
        dmgBonusTotal,
        passedConstraints: passed,
*/
    };
}