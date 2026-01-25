@group(0) @binding(0) var<storage, read> echoStats: array<vec4<f32>>;
@group(0) @binding(2) var<storage, read> echoSets: array<f32>;
@group(0) @binding(3) var<storage, read> comboIndexMap: array<i32>;
@group(0) @binding(5) var<storage, read> echoCosts: array<f32>;
@group(0) @binding(6) var<storage, read> mainEchoBuffs: array<f32>;
@group(0) @binding(8) var<storage, read> echoKindIds: array<i32>;
@group(0) @binding(10) var<storage, read> comboBinom: array<u32>;

struct StatConstraints {
    atkRange      : vec2<f32>,
    hpRange       : vec2<f32>,
    defRange      : vec2<f32>,
    critRateRange : vec2<f32>,
    critDmgRange  : vec2<f32>,
    erRange       : vec2<f32>,
    dmgBonusRange : vec2<f32>,
    dmgRange      : vec2<f32>,
};

@group(0) @binding(7)
var<uniform> statConstraints : StatConstraints;

struct Candidate {
  dmg : f32,
  idx : u32,
};

@group(0) @binding(9) var<storage, read_write> candidates: array<Candidate>;

const REDUCE_K: u32 = 8u;
const NEG_INF: f32 = -1.0e30;
const INV_100: f32 = 0.01;  // Precomputed 1/100 for optimization

// Skill type bit masks
const SKILL_BASIC:      u32 = 1u << 0u;
const SKILL_HEAVY:      u32 = 1u << 1u;
const SKILL_SKILL:      u32 = 1u << 2u;
const SKILL_LIB:        u32 = 1u << 3u;
const SKILL_OUTRO:      u32 = 1u << 4u;
const SKILL_INTRO:      u32 = 1u << 5u;
const SKILL_ECHO_SKILL: u32 = 1u << 6u;
const SKILL_COORD:      u32 = 1u << 7u;

struct Params {
    baseAtk:      f32,
    baseHp:       f32,
    baseDef:      f32,
    baseER:       f32,

    finalAtk:     f32,
    finalHp:      f32,
    finalDef:     f32,
    _padStats:    f32,

    scalingAtk:   f32,
    scalingHp:    f32,
    scalingDef:   f32,
    scalingER:    f32,

    multiplier:   f32,
    flatDmg:      f32,

    resMult:      f32,
    defMult:      f32,

    dmgReductionTotal: f32,
    dmgBonus:     f32,
    dmgAmplify:   f32,
    special:      f32,

    critRate:     f32,
    critDmg:      f32,

    normalBase:   f32,

    skillId:      u32,
    _padSkill:    u32,

    comboCount:   f32,
    charId:       f32,
    sequence:     f32,
    lockedEchoIndex: f32,
    comboMode:    f32,
    comboN:       f32,
    comboMaxCost: f32,
    comboK:       f32,
    comboBaseIndexLo: f32,
    comboBaseIndexHi: f32,
};

@group(0) @binding(4)
var<uniform> params : Params;

const STATS_VEC4S_PER_ECHO : u32 = 5u;
const ECHOS_PER_COMBO: u32 = 5u;
const BUFFS_PER_ECHO : u32 = 15u;
const SET_SLOTS : u32 = 30u; // supports set ids 0..29 inclusive

override CYCLES_PER_INVOCATION : u32 = 16u;

fn in_range(val: f32, range: vec2<f32>) -> bool {
    // Branchless: disabled (x > y) OR value in range
    let disabled = range.x > range.y;
    let inBounds = val >= range.x && val <= range.y;
    return disabled || inBounds;
}

fn passes_constraints(
    finalAtk: f32,
    finalHp:  f32,
    finalDef: f32,
    critRate: f32,
    critDmg:  f32,
    finalER:  f32,
    dmgBonus: f32,
    damage:   f32,
) -> bool {
    // Early-out: check if all constraints are disabled (min > max for all)
    let allDisabled =
        statConstraints.atkRange.x > statConstraints.atkRange.y &&
        statConstraints.hpRange.x > statConstraints.hpRange.y &&
        statConstraints.defRange.x > statConstraints.defRange.y &&
        statConstraints.critRateRange.x > statConstraints.critRateRange.y &&
        statConstraints.critDmgRange.x > statConstraints.critDmgRange.y &&
        statConstraints.erRange.x > statConstraints.erRange.y &&
        statConstraints.dmgBonusRange.x > statConstraints.dmgBonusRange.y &&
        statConstraints.dmgRange.x > statConstraints.dmgRange.y;
    if (allDisabled) { return true; }

    if (!in_range(finalAtk,  statConstraints.atkRange))      { return false; }
    if (!in_range(finalHp,   statConstraints.hpRange))       { return false; }
    if (!in_range(finalDef,  statConstraints.defRange))      { return false; }
    if (!in_range(critRate,  statConstraints.critRateRange)) { return false; }
    if (!in_range(critDmg,   statConstraints.critDmgRange))  { return false; }
    if (!in_range(finalER,   statConstraints.erRange))       { return false; }
    if (!in_range(dmgBonus,  statConstraints.dmgBonusRange)) { return false; }
    if (!in_range(damage,    statConstraints.dmgRange))      { return false; }

    return true;
}

fn hasSkill(mask: u32, flag: u32) -> bool {
    return (mask & flag) != 0u;
}

fn unpackSkillIdFromParams() -> u32 {
    return params.skillId;
}

fn skillMaskFromSkillId(skillId: u32) -> u32 {
    return skillId & 0x7fffu;
}

fn elementFromSkillId(skillId: u32) -> u32 {
    return (skillId >> 15u) & 0x7u;
}

// Branchless threshold helpers (returns 1.0 if count >= threshold, else 0.0)
fn has2(count: u32) -> f32 { return f32(min(1u, count >> 1u)); }
fn has3(count: u32) -> f32 { return f32(min(1u, count / 3u)); }
fn has5(count: u32) -> f32 { return f32(min(1u, count / 5u)); }

struct ComboEval {
    dmg: f32,
    mainPos: u32,
};

fn comboBaseIndexU32() -> u32 {
    let lo = u32(params.comboBaseIndexLo) & 0xffffu;
    let hi = u32(params.comboBaseIndexHi);
    return (hi << 16u) | lo;
}

fn buildComboIndices(index: u32) -> array<u32, 5> {
    var out: array<u32, 5>;
    for (var i: u32 = 0u; i < 5u; i = i + 1u) {
        out[i] = 0u;
    }

    let comboN = u32(params.comboN);
    let comboK = u32(params.comboK);
    let binomStride = 6u;

    var remainingK = comboK;
    var start: u32 = 0u;
    var rank: u32 = index;

    for (var pos: u32 = 0u; pos < comboK; pos = pos + 1u) {
        let remainingN = comboN - start;
        let total = comboBinom[remainingN * binomStride + remainingK];
        var low: u32 = 0u;
        var high: u32 = remainingN - remainingK + 1u;

        loop {
            if (low >= high) { break; }
            let mid = (low + high) / 2u;
            let right = comboBinom[(remainingN - mid) * binomStride + remainingK];
            let left = total - right;
            if (rank < left) {
                high = mid;
            } else {
                low = mid + 1u;
            }
        }

        let t = select(0u, low - 1u, low > 0u);
        let right = comboBinom[(remainingN - t) * binomStride + remainingK];
        let prefix = total - right;
        rank = rank - prefix;

        let i = start + t;
        out[pos] = i;
        remainingK = remainingK - 1u;
        start = i + 1u;
    }

    return out;
}

fn comboIndicesToEchoIds(combo: array<u32, 5>) -> array<i32, 5> {
    var out: array<i32, 5>;
    for (var i: u32 = 0u; i < 5u; i = i + 1u) {
        out[i] = -1;
    }

    let comboK = u32(params.comboK);
    for (var pos: u32 = 0u; pos < comboK; pos = pos + 1u) {
        out[pos] = comboIndexMap[combo[pos]];
    }

    if (i32(params.lockedEchoIndex) >= 0 && comboK < 5u) {
        out[4] = i32(params.lockedEchoIndex);
    }

    return out;
}

fn buildEchoIds(index: u32) -> array<i32, 5> {
    let combo = buildComboIndices(index);
    return comboIndicesToEchoIds(combo);
}

// =======================================================
// Shared Echo + Set + Damage core (used by normal + rotation)
// =======================================================

struct EchoBase {
    totalCost: f32,

    atkP: f32, atkF: f32,
    hpP:  f32, hpF:  f32,
    defP: f32, defF: f32,

    critRate: f32,
    critDmg:  f32,
    er:       f32,

    basic: f32,
    heavy: f32,
    skill: f32,
    lib:   f32,

    aero:    f32,
    spectro: f32,
    fusion:  f32,
    glacio:  f32,
    havoc:   f32,
    electro: f32,

    echoSkill: f32,
    coord:     f32,

    // counts fit in u8; stored in u32 array for alignment but source can be u8 to save space
    setCount: array<u32, SET_SLOTS>,
};

fn buildEchoBase(echoIds: array<i32, 5>) -> EchoBase {
    var out: EchoBase;

    out.totalCost = 0.0;

    out.atkP = 0.0; out.atkF = 0.0;
    out.hpP  = 0.0; out.hpF  = 0.0;
    out.defP = 0.0; out.defF = 0.0;

    out.critRate = 0.0;
    out.critDmg  = 0.0;
    out.er       = 0.0;

    out.basic = 0.0;
    out.heavy = 0.0;
    out.skill = 0.0;
    out.lib   = 0.0;

    out.aero    = 0.0;
    out.spectro = 0.0;
    out.fusion  = 0.0;
    out.glacio  = 0.0;
    out.havoc   = 0.0;
    out.electro = 0.0;

    out.echoSkill = 0.0;
    out.coord     = 0.0;

    for (var s: u32 = 0u; s < SET_SLOTS; s = s + 1u) {
        out.setCount[s] = 0u;
    }

    // Cost + stats
    for (var i: u32 = 0u; i < 5u; i = i + 1u) {
        let id = echoIds[i];
        if (id < 0) { continue; }

        out.totalCost += echoCosts[u32(id)];

        let o4 = u32(id) * STATS_VEC4S_PER_ECHO;
        let v0 = echoStats[o4 + 0u];
        let v1 = echoStats[o4 + 1u];
        let v2 = echoStats[o4 + 2u];
        let v3 = echoStats[o4 + 3u];
        let v4 = echoStats[o4 + 4u];

        out.atkP += v0.x;
        out.atkF += v0.y;
        out.hpP  += v0.z;
        out.hpF  += v0.w;

        out.defP += v1.x;
        out.defF += v1.y;
        out.critRate += v1.z;
        out.critDmg  += v1.w;

        out.er    += v2.x;
        out.basic += v2.z;
        out.heavy += v2.w;

        out.skill += v3.x;
        out.lib   += v3.y;

        out.aero    += v3.z;
        out.spectro += v3.w;

        out.fusion  += v4.x;
        out.glacio  += v4.y;
        out.havoc   += v4.z;
        out.electro += v4.w;
    }

    // Count UNIQUE echo kinds per set within this 5-echo combo.
    for (var i: u32 = 0u; i < 5u; i = i + 1u) {
        let idx = echoIds[i];
        if (idx < 0) { continue; }

        let echoIndex: u32 = u32(idx);
        let setIdF = echoSets[echoIndex];
        if (setIdF < 0.0) { continue; }

        let setId = u32(setIdF);
        if (setId >= SET_SLOTS) { continue; }

        let kindId: i32 = echoKindIds[echoIndex];

        var seen: bool = false;
        for (var j: u32 = 0u; j < i; j = j + 1u) {
            let idx2 = echoIds[j];
            if (idx2 < 0) { continue; }

            let echoIndex2: u32 = u32(idx2);
            let setIdF2 = echoSets[echoIndex2];
            if (setIdF2 < 0.0) { continue; }

            let setId2 = u32(setIdF2);
            if (setId2 != setId) { continue; }

            let kindId2: i32 = echoKindIds[echoIndex2];
            if (kindId2 == kindId) {
                seen = true;
                break;
            }
        }

        if (!seen) {
            out.setCount[setId] = out.setCount[setId] + 1u;
        }
    }

    return out;
}

struct SetApplied {
    atkP: f32, atkF: f32,
    hpP:  f32, hpF:  f32,
    defP: f32, defF: f32,

    critRate: f32,
    critDmg:  f32,
    er:       f32,

    basic: f32,
    heavy: f32,
    skill: f32,
    lib:   f32,

    aero:    f32,
    spectro: f32,
    fusion:  f32,
    glacio:  f32,
    havoc:   f32,
    electro: f32,

    echoSkill: f32,
    coord:     f32,

    bonusBase:  f32,
    erSetBonus: f32,
};

fn applySetEffectsBase(base: EchoBase) -> SetApplied {
    var s: SetApplied;

    // Initialize from base echo stats
    s.atkP = base.atkP; s.atkF = base.atkF;
    s.hpP  = base.hpP;  s.hpF  = base.hpF;
    s.defP = base.defP; s.defF = base.defF;

    s.critRate = base.critRate;
    s.critDmg  = base.critDmg;
    s.er       = base.er;

    s.basic = base.basic;
    s.heavy = base.heavy;
    s.skill = base.skill;
    s.lib   = base.lib;

    s.aero    = base.aero;
    s.spectro = base.spectro;
    s.fusion  = base.fusion;
    s.glacio  = base.glacio;
    s.havoc   = base.havoc;
    s.electro = base.electro;

    s.echoSkill = base.echoSkill;
    s.coord     = base.coord;

    s.bonusBase  = 0.0;
    s.erSetBonus = 0.0;

    // =========================================================================
    // Cache threshold checks (
    // Format: s{ID}_{threshold} = has{threshold}(base.setCount[{ID}u])
    // =========================================================================
    let c = base.setCount;

    // 2pc/5pc sets
    let s1_2 = has2(c[1u]);   let s1_5 = has5(c[1u]);   // Freezing Frost (Glacio)
    let s2_2 = has2(c[2u]);   let s2_5 = has5(c[2u]);   // Molten Rift (Fusion)
    let s3_2 = has2(c[3u]);   let s3_5 = has5(c[3u]);   // Void Thunder (Electro)
    let s4_2 = has2(c[4u]);   let s4_5 = has5(c[4u]);   // Sierra Gale (Aero)
    let s5_2 = has2(c[5u]);   let s5_5 = has5(c[5u]);   // Celestial Light (Spectro)
    let s6_2 = has2(c[6u]);   let s6_5 = has5(c[6u]);   // Sun-sinking Eclipse (Havoc)
    let s7_5 = has5(c[7u]);                             // Rejuvenating Glow
    let s8_2 = has2(c[8u]);                             // Moonlit Clouds
    let s9_2 = has2(c[9u]);   let s9_5 = has5(c[9u]);   // Lingering Tunes
    let s10_2 = has2(c[10u]); let s10_5 = has5(c[10u]); // Frosty Resolve
    let s11_2 = has2(c[11u]); let s11_5 = has5(c[11u]); // Eternal Radiance
    let s12_2 = has2(c[12u]);                           // Midnight Veil
    let s13_2 = has2(c[13u]); let s13_5 = has5(c[13u]); // Empyrean Anthem
    let s14_2 = has2(c[14u]); let s14_5 = has5(c[14u]); // Tidebreaking Courage
    let s16_2 = has2(c[16u]); let s16_5 = has5(c[16u]); // Gusts of Welkin
    let s17_2 = has2(c[17u]); let s17_5 = has5(c[17u]); // Windward Pilgrimage
    let s18_2 = has2(c[18u]); let s18_5 = has5(c[18u]); // Flaming Clawprint
    let s24_2 = has2(c[24u]);                           // Pact of Neonlight Leap
    let s25_5 = has5(c[25u]);                           // Halo of Starry Radiance
    let s26_2 = has2(c[26u]); let s26_5 = has5(c[26u]); // Rite of Gilded Revelation
    let s27_2 = has2(c[27u]); let s27_5 = has5(c[27u]); // Trailblazing Star
    let s28_2 = has2(c[28u]);                           // Chromatic Foam
    let s29_2 = has2(c[29u]); let s29_5 = has5(c[29u]); // Sound of True Name (conditional handled separately)

    // 3pc sets
    let s19_3 = has3(c[19u]); // Dream of the Lost
    let s20_3 = has3(c[20u]); // Crown of Valor
    let s21_3 = has3(c[21u]); // Law of Harmony
    let s22_3 = has3(c[22u]); // Flamewing's Shadow (conditional handled separately)
    let s23_3 = has3(c[23u]); // Thread of Severed Fate

    // =========================================================================
    // Apply set bonuses
    // =========================================================================

    // Element bonuses
    s.glacio += 10.0 * s1_2 + 30.0 * s1_5 + 22.5 * s10_5;
    s.fusion += 10.0 * s2_2 + 30.0 * s2_5 + 10.0 * s18_2 + 15.0 * s18_5 + 16.0 * s22_3 + 10.0 * s27_2 + 20.0 * s27_5 + 10.0 * s28_2;
    s.electro += 10.0 * s3_2 + 30.0 * s3_5;
    s.aero += 10.0 * s4_2 + 30.0 * s4_5 + 10.0 * s16_2 + 30.0 * s16_5 + 10.0 * s17_2 + 30.0 * s17_5 + 10.0 * s29_2 + 15.0 * s29_5;
    s.spectro += 10.0 * s5_2 + 30.0 * s5_5 + 10.0 * s11_2 + 15.0 * s11_5 + 10.0 * s24_2 + 10.0 * s26_2 + 30.0 * s26_5;
    s.havoc += 10.0 * s6_2 + 30.0 * s6_5 + 10.0 * s12_2;

    // Stat bonuses
    s.atkP += 15.0 * s7_5 + 10.0 * s9_2 + 20.0 * s9_5 + 20.0 * s13_5 + 15.0 * s14_5 + 30.0 * s20_3 + 20.0 * s23_3 + 25.0 * s25_5;
    s.critRate += 20.0 * s11_5 + 10.0 * s17_5 + 20.0 * s19_3 + 20.0 * s27_5;
    s.critDmg += 20.0 * s20_3;
    s.erSetBonus += 10.0 * s8_2 + 10.0 * s13_2 + 10.0 * s14_2;

    // Skill type bonuses
    s.skill += 12.0 * s10_2 + 36.0 * s10_5;
    s.lib += 20.0 * s18_5 + 30.0 * s23_3;
    s.heavy += 30.0 * s21_3;
    s.basic += 40.0 * s26_5;
    s.echoSkill += 35.0 * s19_3 + 16.0 * s21_3;
    s.coord += 80.0 * s13_5;
    return s;
}

fn applySetEffectsConditional(s: ptr<function, SetApplied>, setCount: array<u32, SET_SLOTS>, skillMask: u32) {
    let set22 = has3(setCount[22u]);
    let set29 = has5(setCount[29u]);
    let set22Cond = set22 * f32(u32(hasSkill(skillMask, SKILL_HEAVY | SKILL_ECHO_SKILL)));
    let set29Cond = set29 * f32(u32(hasSkill(skillMask, SKILL_ECHO_SKILL)));
    (*s).critRate += 20.0 * set22Cond + 20.0 * set29Cond;
}

fn applySetEffects(base: EchoBase, skillMask: u32) -> SetApplied {
    var s = applySetEffectsBase(base);
    applySetEffectsConditional(&s, base.setCount, skillMask);
    return s;
}

struct PreMain {
    finalHpBase:  f32,
    finalDefBase: f32,

    atkBaseTerm:  f32,

    critRateTotal: f32,
    critDmgTotal:  f32,

    scaledBase: f32,
    baseMul:    f32,
    resDefAmp:  f32,
    dmgReductionTotal: f32,

    finalERBase: f32,

    bonusBaseTotal: f32,

    dmgBonusBase: f32,

    baseAtk:  f32,
    charId:   f32,

    elementId: f32,
    skillMask: f32,
    skillId:   u32,

    scalingAtk: f32,
    scalingER:  f32,

    multiplier: f32,
    flatDmg:    f32,
};

fn buildPreMain(p: Params, s: SetApplied, skillMask: u32, elementId: u32, skillId: u32) -> PreMain {
    var pre: PreMain;

    let baseHp  = p.baseHp;
    let baseDef = p.baseDef;
    let baseAtk = p.baseAtk;

    pre.finalHpBase  = baseHp  * s.hpP  * INV_100 + s.hpF  + p.finalHp;
    pre.finalDefBase = baseDef * s.defP * INV_100 + s.defF + p.finalDef;

    pre.atkBaseTerm  = baseAtk * s.atkP * INV_100 + s.atkF + p.finalAtk;

    pre.critRateTotal = p.critRate + s.critRate * INV_100;
    pre.critDmgTotal  = p.critDmg  + s.critDmg  * INV_100;

    pre.charId = p.charId;
    pre.skillId = skillId;

    // 1306 crit conversion
    if (pre.charId == 1306.0) {
        var bonusCd: f32 = 0.0;
        if (p.sequence >= 2.0 && pre.critRateTotal >= 1.0) {
            let excess = pre.critRateTotal - 1.0;
            bonusCd += min(excess * 2.0, 1.0);
        }
        if (p.sequence >= 6.0 && pre.critRateTotal >= 1.5) {
            let excess2 = pre.critRateTotal - 1.5;
            bonusCd += min(excess2 * 2.0, 0.5);
        }
        pre.critDmgTotal += bonusCd - 0.2;
    }

    pre.scaledBase =
        pre.finalHpBase  * p.scalingHp +
        pre.finalDefBase * p.scalingDef;

    let resDefAmp =
        p.resMult *
        p.defMult *
        p.dmgAmplify *
        p.special;

    pre.resDefAmp = resDefAmp;
    pre.dmgReductionTotal = p.dmgReductionTotal;
    pre.baseMul = resDefAmp * p.dmgReductionTotal;

    pre.finalERBase = p.baseER + s.er + s.erSetBonus;

    pre.elementId = f32(elementId);
    pre.skillMask = f32(skillMask);

    pre.dmgBonusBase = p.dmgBonus;

    // Build bonusBaseTotal = set bonusBase + element bonus + type bonus
    var bonus: f32 = s.bonusBase;

    // Branchless element bonus selection via array indexing
    let elemBonuses = array<f32, 6>(s.aero, s.glacio, s.fusion, s.spectro, s.havoc, s.electro);
    let elemIdx = u32(clamp(pre.elementId, 0.0, 5.0));
    bonus += elemBonuses[elemIdx];

    // Branchless skill type bonus selection via bit extraction
    bonus += s.basic     * f32((skillMask >> 0u) & 1u);  // SKILL_BASIC
    bonus += s.heavy     * f32((skillMask >> 1u) & 1u);  // SKILL_HEAVY
    bonus += s.skill     * f32((skillMask >> 2u) & 1u);  // SKILL_SKILL
    bonus += s.lib       * f32((skillMask >> 3u) & 1u);  // SKILL_LIB
    // Skip OUTRO (4) and INTRO (5) - not used for damage bonuses
    bonus += s.echoSkill * f32((skillMask >> 6u) & 1u);  // SKILL_ECHO_SKILL
    bonus += s.coord     * f32((skillMask >> 7u) & 1u);  // SKILL_COORD

    pre.bonusBaseTotal = bonus;

    pre.baseAtk = baseAtk;

    pre.scalingAtk = p.scalingAtk;
    pre.scalingER  = p.scalingER;

    pre.multiplier = p.multiplier;
    pre.flatDmg    = p.flatDmg;

    return pre;
}

// Returns NEG_INF if constraints fail.
fn evalMainPos(
    pre: PreMain,
    setCount: array<u32, SET_SLOTS>,
    mainAtkPRatio: f32,
    mainAtkF: f32,
    mainER: f32,
    mainElem0: vec4<f32>,
    mainElem1: vec2<f32>,
    mainType0: vec4<f32>,
    mainType1: vec2<f32>,
) -> f32 {
    let finalER = pre.finalERBase + mainER;

    var bonus = pre.bonusBaseTotal;

    // 14pc ER threshold clause (branchless)
    let s14_er_bonus = 30.0 * f32(u32(setCount[14u] >= 5u && finalER >= 250.0));
    bonus += s14_er_bonus;

    // main element bonus (branchless via array indexing)
    let mainElems = array<f32, 6>(mainElem0.x, mainElem0.y, mainElem0.z, mainElem0.w, mainElem1.x, mainElem1.y);
    let elemIdx = u32(clamp(pre.elementId, 0.0, 5.0));
    bonus += mainElems[elemIdx];

    // main type bonus (branchless via bit extraction)
    let mask = u32(pre.skillMask);
    bonus += mainType0.x * f32((mask >> 0u) & 1u);  // SKILL_BASIC
    bonus += mainType0.y * f32((mask >> 1u) & 1u);  // SKILL_HEAVY
    bonus += mainType0.z * f32((mask >> 2u) & 1u);  // SKILL_SKILL
    bonus += mainType0.w * f32((mask >> 3u) & 1u);  // SKILL_LIB
    bonus += mainType1.x * f32((mask >> 6u) & 1u);  // SKILL_ECHO_SKILL
    bonus += mainType1.y * f32((mask >> 7u) & 1u);  // SKILL_COORD

    let dmgBonus = pre.dmgBonusBase + bonus * INV_100;

    var finalAtk = pre.atkBaseTerm + (pre.baseAtk * mainAtkPRatio) + mainAtkF;

    // 1206 ER->ATK conversion
    if (pre.charId == 1206.0) {
        let erOver = max(0.0, finalER - 150.0);
        var extraAtk = erOver * 20.0;
        extraAtk = min(extraAtk, 2600.0);
        finalAtk += extraAtk;
    }

    var critRateForDmg = pre.critRateTotal;
    var critDmgForDmg = pre.critDmgTotal;
    var baseMul = pre.baseMul;

    if (pre.charId == 1209.0) {
        let erOver = finalER - 100.0;
        let dmgVuln = min(erOver * 0.25, 40.0);
        baseMul = pre.resDefAmp * (pre.dmgReductionTotal + dmgVuln * INV_100);

        if (pre.skillId == 2206007304u) {
            critRateForDmg = critRateForDmg + min(erOver * 0.5, 80.0) * INV_100;
            critDmgForDmg = critDmgForDmg + min(erOver, 160.0) * INV_100;
        }
    }

    let scaled =
        pre.scaledBase +
        finalAtk * pre.scalingAtk +
        finalER * pre.scalingER;

    let base = (scaled * pre.multiplier + pre.flatDmg) * baseMul * dmgBonus;
    let critHit = base * critDmgForDmg;

    // Branchless crit rate capping - clamp to [0, 1]
    let cr = clamp(critRateForDmg, 0.0, 1.0);
    let avg = cr * critHit + (1.0 - cr) * base;

    if (!passes_constraints(
        finalAtk,
        pre.finalHpBase,
        pre.finalDefBase,
        pre.critRateTotal,
        pre.critDmgTotal,
        finalER,
        dmgBonus,
        avg
    )) {
        return NEG_INF;
    }

    return avg;
}
