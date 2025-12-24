struct ComboEval {
    dmg: f32,
    mainPos: u32,
};

fn computeDamageForCombo(index: u32) -> ComboEval {
    let comboCount = u32(params.comboCount);
    if (index >= comboCount) {
        return ComboEval(0.0, 0u);
    }

    let elementId   = params.elementId;
    let skillMask   : u32 = u32(params.skillTypeId);
    let lockedIndex : i32 = i32(params.lockedEchoIndex);

    // -------------------------
    // Load 5 echo indices
    // -------------------------
    var echoIds: array<i32, 5>;
    let baseOffset = index * ECHOS_PER_COMBO;

    for (var i: u32 = 0u; i < 5u; i = i + 1u) {
        echoIds[i] = combos[baseOffset + i];
    }

    // -------------------------
    // Aggregate echo stats (base, no main-echo buffs)
    // -------------------------
    var atkPBase: f32 = 0.0;
    var atkFBase: f32 = 0.0;
    var hpPBase:  f32 = 0.0;
    var hpFBase:  f32 = 0.0;
    var defPBase: f32 = 0.0;
    var defFBase: f32 = 0.0;

    var critRateBase: f32 = 0.0;
    var critDmgBase : f32 = 0.0;
    var erBase      : f32 = 0.0;

    var basicBase: f32 = 0.0;
    var heavyBase: f32 = 0.0;
    var skillBase: f32 = 0.0;
    var libBase:   f32 = 0.0;

    var aeroBase:    f32 = 0.0;
    var spectroBase: f32 = 0.0;
    var fusionBase:  f32 = 0.0;
    var glacioBase:  f32 = 0.0;
    var havocBase:   f32 = 0.0;
    var electroBase: f32 = 0.0;

    var echoSkillBase: f32 = 0.0;
    var coordBase: f32 = 0.0;

    for (var i: u32 = 0u; i < 5u; i = i + 1u) {
        let id = echoIds[i];
        if (id < 0) { continue; }

        let o4 = u32(id) * STATS_VEC4S_PER_ECHO;
        let v0 = echoStats[o4 + 0u];
        let v1 = echoStats[o4 + 1u];
        let v2 = echoStats[o4 + 2u];
        let v3 = echoStats[o4 + 3u];
        let v4 = echoStats[o4 + 4u];

        // Normal stat accumulation
        atkPBase += v0.x;
        atkFBase += v0.y;
        hpPBase  += v0.z;
        hpFBase  += v0.w;
        defPBase += v1.x;
        defFBase += v1.y;
        critRateBase += v1.z;
        critDmgBase  += v1.w;
        erBase       += v2.x;
        basicBase += v2.z;
        heavyBase += v2.w;
        skillBase += v3.x;
        libBase   += v3.y;
        aeroBase    += v3.z;
        spectroBase += v3.w;
        fusionBase  += v4.x;
        glacioBase  += v4.y;
        havocBase   += v4.z;
        electroBase += v4.w;
    }

    // ----------------------------------
    // Count set occurrences via bitmasks
    // ----------------------------------
    var setMask: array<u32, 32u>;
    for (var s: u32 = 0u; s < 32u; s = s + 1u) {
        setMask[s] = 0u;
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
        setMask[setId] = setMask[setId] | bit;
    }

    var setCount: array<u32, 32u>;
    for (var s: u32 = 0u; s < 32u; s = s + 1u) {
        setCount[s] = countOneBits(setMask[s]);
    }

    // -------------------------
    // Apply set effects (base, before main-echo buffs)
    // -------------------------
    var atkPSet: f32 = atkPBase;
    var atkFSet: f32 = atkFBase;
    var hpPSet:  f32 = hpPBase;
    var hpFSet:  f32 = hpFBase;
    var defPSet: f32 = defPBase;
    var defFSet: f32 = defFBase;

    var critRateSet: f32 = critRateBase;
    var critDmgSet:  f32 = critDmgBase;
    var erSet:       f32 = erBase;

    var basicSet: f32 = basicBase;
    var heavySet: f32 = heavyBase;
    var skillSet: f32 = skillBase;
    var libSet:   f32 = libBase;

    var aeroSet:    f32 = aeroBase;
    var spectroSet: f32 = spectroBase;
    var fusionSet:  f32 = fusionBase;
    var glacioSet:  f32 = glacioBase;
    var havocSet:   f32 = havocBase;
    var electroSet: f32 = electroBase;

    var echoSkillSet: f32 = echoSkillBase;
    var coordSet: f32 = coordBase;

    var bonusBase: f32 = 0.0;
    var erSetBonus: f32 = 0.0;

    // SET 1 — Glacio 2/5
    if (setCount[1u] >= 2u) { glacioSet += 10.0; }
    if (setCount[1u] >= 5u) { glacioSet += 30.0; }

    // SET 2 — Fusion 2/5
    if (setCount[2u] >= 2u) { fusionSet += 10.0; }
    if (setCount[2u] >= 5u) { fusionSet += 30.0; }

    // SET 3 — Electro 2/5
    if (setCount[3u] >= 2u) { electroSet += 10.0; }
    if (setCount[3u] >= 5u) { electroSet += 30.0; }

    // SET 4 — Aero 2/5
    if (setCount[4u] >= 2u) { aeroSet += 10.0; }
    if (setCount[4u] >= 5u) { aeroSet += 30.0; }

    // SET 5 — Spectro 2/5
    if (setCount[5u] >= 2u) { spectroSet += 10.0; }
    if (setCount[5u] >= 5u) { spectroSet += 30.0; }

    // SET 6 — Havoc 2/5
    if (setCount[6u] >= 2u) { havocSet += 10.0; }
    if (setCount[6u] >= 5u) { havocSet += 30.0; }

    // SET 7 — Healing 2pc, ATK% 5pc
    // if (setCount[7u] >= 2u) { setDmgBonus += 0.10; } // commented in original
    if (setCount[7u] >= 5u) { atkPSet += 15.0; }

    // SET 8 — Energy Regen 2pc
    if (setCount[8u] >= 2u) { erSetBonus += 10.0; }

    // SET 9 — ATK% 2/5
    if (setCount[9u] >= 2u) { atkPSet += 10.0; }
    if (setCount[9u] >= 5u) { atkPSet += 20.0; }

    // SET 10 — Glacio resonance skill set
    if (setCount[10u] >= 2u) {
        glacioSet += 12.0;
    }
    if (setCount[10u] >= 5u) {
        glacioSet += 22.5;
        skillSet += 36.0;
    }

    // SET 11 — Spectro + Crit Rate
    if (setCount[11u] >= 2u) { spectroSet += 10.0; }
    if (setCount[11u] >= 5u) {
        critRateSet += 20.0;
        spectroSet += 15.0;
    }

    // SET 12 — Havoc 2pc
    if (setCount[12u] >= 2u) { havocSet += 10.0; }

    // SET 13 — ER → ATK%
    if (setCount[13u] >= 2u) { erSetBonus += 10.0; }
    if (setCount[13u] >= 5u) {
        coordSet += 80.0;
        atkPSet += 20.0;
    }

    // SET 14 — ER 2pc, ATK% 5pc
    if (setCount[14u] >= 2u) { erSetBonus += 10.0; }
    if (setCount[14u] >= 5u) {
        atkPSet += 15.0;
    }

    // SET 16 — Aero (duplicate of 4)
    if (setCount[16u] >= 2u) { aeroSet += 10.0; }
    if (setCount[16u] >= 5u) { aeroSet += 30.0; }

    // SET 17 — Aero + Crit Rate
    if (setCount[17u] >= 2u) { aeroSet += 10.0; }
    if (setCount[17u] >= 5u) {
        critRateSet += 10.0;
        aeroSet += 30.0;
    }

    // SET 18 — Fusion + Resonance Liberation
    if (setCount[18u] >= 2u) { fusionSet += 10.0; }
    if (setCount[18u] >= 5u) {
        fusionSet += 15.0;
        libSet += 20.0;
    }

    // --------------------
    // 3-piece sets
    // --------------------

    // SET 19
    if (setCount[19u] >= 3u) {
        critRateSet += 20.0;
        echoSkillSet += 35.0;
    }

    // SET 20
    if (setCount[20u] >= 3u) {
        atkPSet += 30.0;
        critDmgSet += 20.0;
    }

    // SET 21
    if (setCount[21u] >= 3u) {
        heavySet += 30.0;
        echoSkillSet += 16.0;
    }

    // SET 22
    if (setCount[22u] >= 3u) {
        fusionSet += 16.0;
    }

    let SKILL_HEAVY     : u32 = 1u << 1u;
    let SKILL_ECHO_SKILL: u32 = 1u << 6u;

    if (setCount[22u] >= 3u &&
        (hasSkill(skillMask, SKILL_HEAVY) || hasSkill(skillMask, SKILL_ECHO_SKILL))) {
        critRateSet += 20.0;
    }

    // SET 23
    if (setCount[23u] >= 3u) {
        atkPSet += 20.0;
        libSet += 30.0;
    }

    if (setCount[24u] >= 2) { spectroSet += 10.0; }

    if (setCount[25u] >= 5) { bonusBase += 25.0; }

    if (setCount[26u] >= 2u) { spectroSet += 10.0; }
    if (setCount[26u] >= 5u) {
        spectroSet += 30.0;
        basicSet += 40.0;
    }

    // -------------------------
    // Precompute main-invariant terms
    // -------------------------
    let finalHpBase =
        params.baseHp * (hpPSet / 100.0) + hpFSet + params.finalHp;
    let finalDefBase =
        params.baseDef * (defPSet / 100.0) + defFSet + params.finalDef;

    let atkBaseTerm =
        params.baseAtk * (atkPSet / 100.0) + atkFSet + params.finalAtk;

    let critRateTotal = params.critRate + critRateSet / 100.0;
    var critDmgTotal  = params.critDmg  + critDmgSet  / 100.0;

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

    let scaledBase =
        finalHpBase * params.scalingHp +
        finalDefBase * params.scalingDef;

    let baseMul =
        params.resMult *
        params.defMult *
        params.dmgReductionTotal *
        params.dmgAmplify;

    let finalERBase = params.baseER + erSet + erSetBonus;

    let FLAG_BASIC      : u32 = 1u << 0u;
    let FLAG_HEAVY      : u32 = 1u << 1u;
    let FLAG_SKILL      : u32 = 1u << 2u;
    let FLAG_LIB        : u32 = 1u << 3u;
    let FLAG_ECHO_SKILL : u32 = 1u << 6u;
    let FLAG_COORD      : u32 = 1u << 7u;

    let hasBasic = hasSkill(skillMask, FLAG_BASIC);
    let hasHeavy = hasSkill(skillMask, FLAG_HEAVY);
    let hasSkillD = hasSkill(skillMask, FLAG_SKILL);
    let hasLib = hasSkill(skillMask, FLAG_LIB);
    let hasEchoSkill = hasSkill(skillMask, FLAG_ECHO_SKILL);
    let hasCoord = hasSkill(skillMask, FLAG_COORD);

    var bonusBaseTotal: f32 = bonusBase;
    if (elementId == 0.0) { bonusBaseTotal += aeroSet;    }
    if (elementId == 1.0) { bonusBaseTotal += glacioSet;  }
    if (elementId == 2.0) { bonusBaseTotal += fusionSet;  }
    if (elementId == 3.0) { bonusBaseTotal += spectroSet; }
    if (elementId == 4.0) { bonusBaseTotal += havocSet;   }
    if (elementId == 5.0) { bonusBaseTotal += electroSet; }

    if (hasBasic)    { bonusBaseTotal += basicSet; }
    if (hasHeavy)    { bonusBaseTotal += heavySet; }
    if (hasSkillD)   { bonusBaseTotal += skillSet; }
    if (hasLib)      { bonusBaseTotal += libSet;   }
    if (hasEchoSkill){ bonusBaseTotal += echoSkillSet; }
    if (hasCoord)    { bonusBaseTotal += coordSet; }

    // -------------------------
    // Evaluate each possible main (or locked)
    // -------------------------
    var bestDmg: f32 = 0.0;
    var bestMain: u32 = 0u;

    for (var mainPos: u32 = 0u; mainPos < 5u; mainPos = mainPos + 1u) {
        let mainId = echoIds[mainPos];
        if (mainId < 0) { continue; }
        if (lockedIndex >= 0 && mainId != lockedIndex) { continue; }

        let b = u32(mainId) * BUFFS_PER_ECHO;
        let mainAtkP  = mainEchoBuffs[b + 0u];
        let mainAtkF  = mainEchoBuffs[b + 1u];
        let mainBasic = mainEchoBuffs[b + 2u];
        let mainHeavy = mainEchoBuffs[b + 3u];
        let mainSkill = mainEchoBuffs[b + 4u];
        let mainLib   = mainEchoBuffs[b + 5u];
        let mainAero  = mainEchoBuffs[b + 6u];
        let mainGlac  = mainEchoBuffs[b + 7u];
        let mainFus   = mainEchoBuffs[b + 8u];
        let mainSpec  = mainEchoBuffs[b + 9u];
        let mainHav   = mainEchoBuffs[b + 10u];
        let mainElec  = mainEchoBuffs[b + 11u];
        let mainER    = mainEchoBuffs[b + 12u];
        let mainEchoSkill = mainEchoBuffs[b + 13u];
        let mainCoord     = mainEchoBuffs[b + 14u];

        let finalER = finalERBase + mainER;

        var bonus: f32 = bonusBaseTotal;
        if (setCount[14u] >= 5u && finalER >= 250.0) {
            bonus += 30.0;
        }

        if (elementId == 0.0) { bonus += mainAero;    }
        if (elementId == 1.0) { bonus += mainGlac;    }
        if (elementId == 2.0) { bonus += mainFus;     }
        if (elementId == 3.0) { bonus += mainSpec;    }
        if (elementId == 4.0) { bonus += mainHav;     }
        if (elementId == 5.0) { bonus += mainElec;    }

        if (hasBasic)    { bonus += mainBasic; }
        if (hasHeavy)    { bonus += mainHeavy; }
        if (hasSkillD)   { bonus += mainSkill; }
        if (hasLib)      { bonus += mainLib;   }
        if (hasEchoSkill){ bonus += mainEchoSkill; }
        if (hasCoord)    { bonus += mainCoord; }

        let dmgBonus = params.dmgBonus + bonus / 100.0;

        var finalAtk =
            atkBaseTerm + (params.baseAtk * (mainAtkP / 100.0)) + mainAtkF;

        if (params.charId == 1206) {
            let erOver: f32 = max(0.0, finalER - 150.0);
            var extraAtk: f32 = erOver * 20.0;
            extraAtk = min(extraAtk, 2600.0);
            finalAtk = finalAtk + extraAtk;
        }

        let scaled =
            scaledBase +
            finalAtk * params.scalingAtk +
            finalER  * params.scalingER;

        let multiplier = params.multiplier;
        let flatDmg    = params.flatDmg;

        if (multiplier == 0.0 && params.scalingAtk == 0.0 && flatDmg > 0.0) {
            if (flatDmg > bestDmg) {
                bestDmg = flatDmg;
                bestMain = mainPos;
            }
            continue;
        }

        let base = (scaled * multiplier + flatDmg)
            * baseMul
            * dmgBonus;

        let critHit  = base * critDmgTotal;
        var avg      = critRateTotal * critHit + (1.0 - critRateTotal) * base;

        if (critRateTotal >= 1) { avg = critHit; }

        if (!passes_constraints(
            finalAtk,
        finalHpBase,
        finalDefBase,
        critRateTotal,
        critDmgTotal,
        finalER,
            dmgBonus,
            avg,
        )) {
            continue;
        }

        if (avg > bestDmg) {
            bestDmg = avg;
            bestMain = mainPos;
        }
    }

    return ComboEval(bestDmg, bestMain);
}
