fn computeDamageForCombo(index: u32) {
    let comboCount = u32(params.comboCount);
    if (index >= comboCount) {
        return;
    }

    let elementId   = params.elementId;
    let skillMask   : u32 = u32(params.skillTypeId);

    // -------------------------
    // Load 5 echo indices
    // -------------------------
    var echoIds: array<i32, 5>;
    let baseOffset = index * ECHOS_PER_COMBO;

    for (var i: u32 = 0u; i < 5u; i = i + 1u) {
        echoIds[i] = combos[baseOffset + i];
    }

    // -------------------------
    // Aggregate echo stats
    // -------------------------
    var atkP: f32 = 0.0;
    var atkF: f32 = 0.0;
    var hpP:  f32 = 0.0;
    var hpF:  f32 = 0.0;
    var defP: f32 = 0.0;
    var defF: f32 = 0.0;

    var critRateEcho: f32 = 0.0;
    var critDmgEcho : f32 = 0.0;
    var erEcho      : f32 = 0.0;

    var basicEcho: f32 = 0.0;
    var heavyEcho: f32 = 0.0;
    var skillEcho: f32 = 0.0;
    var libEcho:   f32 = 0.0;

    var aero:    f32 = 0.0;
    var spectro: f32 = 0.0;
    var fusion:  f32 = 0.0;
    var glacio:  f32 = 0.0;
    var havoc:   f32 = 0.0;
    var electro: f32 = 0.0;

    var echoSkill: f32 = 0.0;
    var coord: f32 = 0.0;

    for (var i: u32 = 0u; i < 5u; i = i + 1u) {
        let id = echoIds[i];
        if (id < 0) { continue; }

        let o = u32(id) * STATS_PER_ECHO;

        // --------------------------------------
        // Main Echo buffs ONLY for slot 0
        // --------------------------------------
        if (i == 0u) {
            let b = u32(id) * BUFFS_PER_ECHO;
            atkP      += mainEchoBuffs[b + 0u];
            atkF      += mainEchoBuffs[b + 1u];
            basicEcho += mainEchoBuffs[b + 2u];
            heavyEcho += mainEchoBuffs[b + 3u];
            skillEcho += mainEchoBuffs[b + 4u];
            libEcho   += mainEchoBuffs[b + 5u];
            aero      += mainEchoBuffs[b + 6u];
            glacio    += mainEchoBuffs[b + 7u];
            fusion    += mainEchoBuffs[b + 8u];
            spectro   += mainEchoBuffs[b + 9u];
            havoc     += mainEchoBuffs[b + 10u];
            electro   += mainEchoBuffs[b + 11u];
            erEcho    += mainEchoBuffs[b + 12u];
            echoSkill += mainEchoBuffs[b + 13u];
            coord     += mainEchoBuffs[b + 14u];
        }

        // Normal stat accumulation
        atkP += echoStats[o + 0u];
        atkF += echoStats[o + 1u];
        hpP  += echoStats[o + 2u];
        hpF  += echoStats[o + 3u];
        defP += echoStats[o + 4u];
        defF += echoStats[o + 5u];
        critRateEcho += echoStats[o + 6u];
        critDmgEcho  += echoStats[o + 7u];
        erEcho       += echoStats[o + 8u];
        basicEcho += echoStats[o + 10u];
        heavyEcho += echoStats[o + 11u];
        skillEcho += echoStats[o + 12u];
        libEcho   += echoStats[o + 13u];
        aero    += echoStats[o + 14u];
        spectro += echoStats[o + 15u];
        fusion  += echoStats[o + 16u];
        glacio  += echoStats[o + 17u];
        havoc   += echoStats[o + 18u];
        electro += echoStats[o + 19u];
    }

    // ----------------------------------
    // Count set occurrences
    // ----------------------------------
    var setCount: array<u32, 32u>;
    var seenMask: array<u32, 32u>;

    for (var s: u32 = 0u; s < 32u; s = s + 1u) {
        setCount[s] = 0u;
        seenMask[s] = 0u;
    }

    for (var i: u32 = 0u; i < 5u; i = i + 1u) {
        let idx = echoIds[i];
        if (idx < 0) { continue; }

        let echoIndex: u32 = u32(idx);

        let setIdF = echoSets[echoIndex];
        let setId  = u32(setIdF);
        if (setId >= 32u) { continue; }

        let kindId: i32 = echoKindIds[echoIndex];

        let bit: u32 = 1u << (u32(kindId) & 31u);

        let mask = seenMask[setId];
        if ((mask & bit) == 0u) {
            seenMask[setId] = mask | bit;
            setCount[setId] = setCount[setId] + 1u;
        }
    }

    // -------------------------
    // Apply set effects
    // -------------------------
    var bonus: f32 = 0.0;
    var finalER =
        params.baseER + erEcho;

    // SET 1 — Glacio 2/5
    if (setCount[1u] >= 2u) { glacio += 10.0; }
    if (setCount[1u] >= 5u) { glacio += 30.0; }

    // SET 2 — Fusion 2/5
    if (setCount[2u] >= 2u) { fusion += 10.0; }
    if (setCount[2u] >= 5u) { fusion += 30.0; }

    // SET 3 — Electro 2/5
    if (setCount[3u] >= 2u) { electro += 10.0; }
    if (setCount[3u] >= 5u) { electro += 30.0; }

    // SET 4 — Aero 2/5
    if (setCount[4u] >= 2u) { aero += 10.0; }
    if (setCount[4u] >= 5u) { aero += 30.0; }

    // SET 5 — Spectro 2/5
    if (setCount[5u] >= 2u) { spectro += 10.0; }
    if (setCount[5u] >= 5u) { spectro += 30.0; }

    // SET 6 — Havoc 2/5
    if (setCount[6u] >= 2u) { havoc += 10.0; }
    if (setCount[6u] >= 5u) { havoc += 30.0; }

    // SET 7 — Healing 2pc, ATK% 5pc
    // if (setCount[7u] >= 2u) { setDmgBonus += 0.10; } // commented in original
    if (setCount[7u] >= 5u) { atkP += 15.0; }

    // SET 8 — Energy Regen 2pc
    if (setCount[8u] >= 2u) { finalER += 10.0; }

    // SET 9 — ATK% 2/5
    if (setCount[9u] >= 2u) { atkP += 10.0; }
    if (setCount[9u] >= 5u) { atkP += 20.0; }

    // SET 10 — Glacio resonance skill set
    if (setCount[10u] >= 2u) {
        glacio += 12.0;
    }
    if (setCount[10u] >= 5u) {
        glacio += 22.5;
        skillEcho += 36.0;
    }

    // SET 11 — Spectro + Crit Rate
    if (setCount[11u] >= 2u) { spectro += 10.0; }
    if (setCount[11u] >= 5u) {
        critRateEcho += 20.0;
        spectro += 15.0;
    }

    // SET 12 — Havoc 2pc
    if (setCount[12u] >= 2u) { havoc += 10.0; }

    // SET 13 — ER → ATK%
    if (setCount[13u] >= 2u) { finalER += 10.0; }
    if (setCount[13u] >= 5u) {
        coord += 80.0;
        atkP += 20.0;
    }

    // SET 14 — ER 2pc, ATK% 5pc
    if (setCount[14u] >= 2u) { finalER += 10.0; }
    if (setCount[14u] >= 5u) {
        atkP += 15.0;
        if (finalER >= 250) {
            bonus += 30;
        }
    }

    // SET 16 — Aero (duplicate of 4)
    if (setCount[16u] >= 2u) { aero += 10.0; }
    if (setCount[16u] >= 5u) { aero += 30.0; }

    // SET 17 — Aero + Crit Rate
    if (setCount[17u] >= 2u) { aero += 10.0; }
    if (setCount[17u] >= 5u) {
        critRateEcho += 10.0;
        aero += 30.0;
    }

    // SET 18 — Fusion + Resonance Liberation
    if (setCount[18u] >= 2u) { fusion += 10.0; }
    if (setCount[18u] >= 5u) {
        fusion += 15.0;
        libEcho += 20.0;
    }

    // --------------------
    // 3-piece sets
    // --------------------

    // SET 19
    if (setCount[19u] >= 3u) {
        critRateEcho += 20.0;
        echoSkill += 35.0;
    }

    // SET 20
    if (setCount[20u] >= 3u) {
        atkP += 30.0;
        critDmgEcho += 20.0;
    }

    // SET 21
    if (setCount[21u] >= 3u) {
        heavyEcho += 30.0;
        echoSkill += 16.0;
    }

    // SET 22
    if (setCount[22u] >= 3u) {
        fusion += 16.0;
    }

    let SKILL_HEAVY     : u32 = 1u << 1u;
    let SKILL_ECHO_SKILL: u32 = 1u << 6u;

    if (setCount[22u] >= 3u &&
        (hasSkill(skillMask, SKILL_HEAVY) || hasSkill(skillMask, SKILL_ECHO_SKILL))) {
        critRateEcho += 20.0;
    }

    // SET 23
    if (setCount[23u] >= 3u) {
        atkP += 20.0;
        libEcho += 30.0;
    }

    if (setCount[24u] >= 2) { spectro += 10.0; }

    if (setCount[25u] >= 5) { bonus += 25.0; }

    if (setCount[26u] >= 2u) { spectro += 10.0; }
    if (setCount[26u] >= 5u) {
        spectro += 30.0;
        basicEcho += 40.0;
    }

    // -------------------------
    // Pick element bonuses
    // -------------------------

    if (elementId == 0.0) { bonus += aero;    }
    if (elementId == 1.0) { bonus += glacio;  }
    if (elementId == 2.0) { bonus += fusion;  }
    if (elementId == 3.0) { bonus += spectro; }
    if (elementId == 4.0) { bonus += havoc;   }
    if (elementId == 5.0) { bonus += electro; }

    // skill type bonus
    let FLAG_BASIC      : u32 = 1u << 0u;
    let FLAG_HEAVY      : u32 = 1u << 1u;
    let FLAG_SKILL      : u32 = 1u << 2u;
    let FLAG_LIB        : u32 = 1u << 3u;
    let FLAG_ECHO_SKILL : u32 = 1u << 6u;
    let FLAG_COORD      : u32 = 1u << 7u;
    if (hasSkill(skillMask, FLAG_BASIC))      { bonus += basicEcho; }
    if (hasSkill(skillMask, FLAG_HEAVY))      { bonus += heavyEcho; }
    if (hasSkill(skillMask, FLAG_SKILL))      { bonus += skillEcho; }
    if (hasSkill(skillMask, FLAG_LIB))        { bonus += libEcho;   }
    if (hasSkill(skillMask, FLAG_ECHO_SKILL)) { bonus += echoSkill; }
    if (hasSkill(skillMask, FLAG_COORD))      { bonus += coord;     }

    let dmgBonus = params.dmgBonus + bonus / 100.0;

    // -------------------------
    // Final stats with echoes
    // -------------------------
    var finalAtk =
        params.baseAtk * (atkP / 100.0) + atkF + params.finalAtk;

    let finalHp =
        params.baseHp * (hpP / 100.0) + hpF + params.finalHp;

    let finalDef =
        params.baseDef * (defP / 100.0) + defF + params.finalDef;

    if (params.charId == 1206) {
        let erOver: f32 = max(0.0, finalER - 150.0);
        var extraAtk: f32 = erOver * 20.0;
        extraAtk = min(extraAtk, 2600.0);
        finalAtk = finalAtk + extraAtk;
    }

    let critRateTotal = params.critRate + critRateEcho / 100.0;
    var critDmgTotal  = params.critDmg  + critDmgEcho  / 100.0;

    if (params.charId == 1306) {
        var bonusCd: f32 = 0.0;
        if (params.sequence >= 2 && critRateTotal >= 1.0) {
            let excess: f32 = critRateTotal - 1.0;
            bonusCd += min(excess * 2.0, 1.0);
        }
        if (params.sequence >= 6 && critRateTotal >= 1.5) {
            let excess2: f32 = critRateTotal - 1.5;
            bonusCd += min(excess2 * 2.0, 0.5);
        }
        critDmgTotal += bonusCd - 0.2;
    }

    // -------------------------
    // Ability scaling
    // -------------------------
    let scaled =
        finalAtk * params.scalingAtk +
        finalHp  * params.scalingHp +
        finalDef * params.scalingDef +
        finalER  * params.scalingER;

    // -------------------------
    // Fixed dmg case
    // -------------------------
    let multiplier = params.multiplier;
    let flatDmg    = params.flatDmg;

    if (multiplier == 0.0 && params.scalingAtk == 0.0 && flatDmg > 0.0) {
        outDamage[index] = flatDmg;
        return;
    }

    // -------------------------
    // Base damage
    // -------------------------
    let base = (scaled * multiplier + flatDmg)
        * params.resMult
        * params.defMult
        * params.dmgReductionTotal
        * dmgBonus
        * params.dmgAmplify;

    // -------------------------
    // Crit average
    // -------------------------
    let critHit  = base * critDmgTotal;
    var avg      = critRateTotal * critHit + (1.0 - critRateTotal) * base;

    if (critRateTotal >= 1) { avg = critHit; }

    if (!passes_constraints(
        finalAtk,
        finalHp,
        finalDef,
        critRateTotal,
        critDmgTotal,
        finalER,
        dmgBonus,
        avg,
    )) {
        outDamage[index] = 0.0;
        return;
    }

    outDamage[index] = avg;
}