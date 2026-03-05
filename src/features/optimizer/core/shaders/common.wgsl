@group(0) @binding(0) var<storage, read> echoStats: array<vec4<f32>>;
@group(0) @binding(1) var<storage, read> setConstLut: array<f32>;
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
    toggles:      f32,

    skillId:      u32,
    meta0:        u32,
    meta1:        u32,
    lockedPacked: u32,
    comboBaseIndex: u32,

    _pad0: u32,
    _pad1: u32,
    _pad2: u32,
    _pad3: u32,
    _pad4: u32,
    _pad5: u32,
    _pad6: u32,
    _pad7: u32,
};

@group(0) @binding(4)
var<uniform> params : Params;

const STATS_VEC4S_PER_ECHO : u32 = 5u;
const ECHOS_PER_COMBO: u32 = 5u;
const BUFFS_PER_ECHO : u32 = 15u;
const SET_SLOTS : u32 = 32u; // supports set ids 0..31 inclusive
const SET_CONST_LUT_BUCKETS: u32 = 4u;
const SET_CONST_LUT_ROW_STRIDE: u32 = 23u;

const SET_RUNTIME_TOGGLE_SET14_FIVE: u32 = 1u << 0u;
const SET_RUNTIME_TOGGLE_SET22_P1: u32 = 1u << 1u;
const SET_RUNTIME_TOGGLE_SET22_P2: u32 = 1u << 2u;
const SET_RUNTIME_TOGGLE_SET29_FIVE: u32 = 1u << 3u;

override CYCLES_PER_INVOCATION : u32 = 16u;

fn decodeCharId(p: Params) -> f32 { return f32(p.meta0 & 0xfffu); }
fn decodeSequence(p: Params) -> f32 { return f32((p.meta0 >> 12u) & 0xfu); }
fn decodeComboMode(p: Params) -> u32 { return (p.meta0 >> 16u) & 0x3u; }
fn decodeComboK(p: Params) -> u32 { return (p.meta0 >> 18u) & 0x7u; }
fn decodeComboMaxCost(p: Params) -> f32 { return f32((p.meta0 >> 21u) & 0x3fu); }
fn decodeComboCount(p: Params) -> u32 { return p.meta1 & 0xffffffu; }
fn decodeComboN(p: Params) -> u32 { return (p.meta1 >> 24u) & 0xffu; }
fn decodeLockedIndex(p: Params) -> i32 { return i32(p.lockedPacked) - 1; }
fn comboBaseIndex(p: Params) -> u32 { return p.comboBaseIndex; }
fn decodeSetRuntimeMask(p: Params) -> u32 { return p._pad0; }
fn toggleValue(toggles: f32, bit: u32) -> f32 {
    let mask = 1u << (bit & 31u);
    return f32((bitcast<u32>(toggles) & mask) != 0u);
}

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

fn buildComboIndices(index: u32) -> array<u32, 5> {
    var out: array<u32, 5>;
    for (var i: u32 = 0u; i < 5u; i = i + 1u) {
        out[i] = 0u;
    }

    let comboN = decodeComboN(params);
    let comboK = decodeComboK(params);
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

    let comboK = decodeComboK(params);
    for (var pos: u32 = 0u; pos < comboK; pos = pos + 1u) {
        out[pos] = comboIndexMap[combo[pos]];
    }

    let lockedIndex = decodeLockedIndex(params);
    if (lockedIndex >= 0 && comboK < 5u) {
        out[4] = lockedIndex;
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

    for (var setId: u32 = 0u; setId < SET_SLOTS; setId = setId + 1u) {
        let count = base.setCount[setId];
        if (count < 2u) { continue; }

        let bucket =
            u32(count >= 2u) +
            u32(count >= 3u) +
            u32(count >= 5u);
        if (bucket == 0u) { continue; }

        let row = ((setId * SET_CONST_LUT_BUCKETS + bucket) * SET_CONST_LUT_ROW_STRIDE);

        s.atkP      += setConstLut[row + 0u];
        s.atkF      += setConstLut[row + 1u];
        s.hpP       += setConstLut[row + 2u];
        s.hpF       += setConstLut[row + 3u];
        s.defP      += setConstLut[row + 4u];
        s.defF      += setConstLut[row + 5u];
        s.critRate  += setConstLut[row + 6u];
        s.critDmg   += setConstLut[row + 7u];
        s.er        += setConstLut[row + 8u];
        s.basic     += setConstLut[row + 9u];
        s.heavy     += setConstLut[row + 10u];
        s.skill     += setConstLut[row + 11u];
        s.lib       += setConstLut[row + 12u];
        s.aero      += setConstLut[row + 13u];
        s.spectro   += setConstLut[row + 14u];
        s.fusion    += setConstLut[row + 15u];
        s.glacio    += setConstLut[row + 16u];
        s.havoc     += setConstLut[row + 17u];
        s.electro   += setConstLut[row + 18u];
        s.echoSkill += setConstLut[row + 19u];
        s.coord     += setConstLut[row + 20u];
        s.bonusBase += setConstLut[row + 21u];
        s.erSetBonus += setConstLut[row + 22u];
    }

    return s;
}

fn applySetEffectsConditional(
    s: ptr<function, SetApplied>,
    setCount: array<u32, SET_SLOTS>,
    skillMask: u32,
    setRuntimeMask: u32,
) {
    let heavyTriggered = hasSkill(skillMask, SKILL_HEAVY);
    let echoTriggered = hasSkill(skillMask, SKILL_ECHO_SKILL);

    let set22P1Enabled = (setRuntimeMask & SET_RUNTIME_TOGGLE_SET22_P1) != 0u;
    let set22P2Enabled = (setRuntimeMask & SET_RUNTIME_TOGGLE_SET22_P2) != 0u;
    let set29Enabled = (setRuntimeMask & SET_RUNTIME_TOGGLE_SET29_FIVE) != 0u;

    let set22EnabledForSkill =
        (heavyTriggered && set22P1Enabled) ||
        (echoTriggered && set22P2Enabled);
    let set22Cond = has3(setCount[22u]) * f32(u32(set22EnabledForSkill));
    let set29Cond = has3(setCount[29u]) * f32(u32(echoTriggered && set29Enabled));

    (*s).critRate += 20.0 * set22Cond + 20.0 * set29Cond;
}

fn applySetEffects(base: EchoBase, skillMask: u32, setRuntimeMask: u32) -> SetApplied {
    var s = applySetEffectsBase(base);
    applySetEffectsConditional(&s, base.setCount, skillMask, setRuntimeMask);
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
    toggles:    f32,
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

    let charId = decodeCharId(p);
    let sequence = decodeSequence(p);
    pre.charId = charId;
    pre.skillId = skillId;

    // 1306 crit conversion
    if (pre.charId == 1306.0) {
        var bonusCd: f32 = 0.0;
        if (sequence >= 2.0 && pre.critRateTotal >= 1.0) {
            let excess = pre.critRateTotal - 1.0;
            bonusCd += min(excess * 2.0, 1.0);
        }
        if (sequence >= 6.0 && pre.critRateTotal >= 1.5) {
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
    pre.toggles = p.toggles;

    return pre;
}

// Returns NEG_INF if constraints fail.
fn evalMainPos(
    pre: PreMain,
    setCount: array<u32, SET_SLOTS>,
    setRuntimeMask: u32,
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
    let set14Enabled = (setRuntimeMask & SET_RUNTIME_TOGGLE_SET14_FIVE) != 0u;
    let s14_er_bonus = 30.0 * f32(u32(set14Enabled && setCount[14u] >= 5u && finalER >= 250.0));
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

    var dmgBonus = pre.dmgBonusBase + bonus * INV_100;

    var finalAtk = pre.atkBaseTerm + (pre.baseAtk * mainAtkPRatio) + mainAtkF;

    // 1206 ER->ATK conversion
    if (pre.charId == 1206.0) {
        let erOver = max(0.0, finalER - 150.0);
        var extraAtk: f32 = 0.0;
        if (toggleValue(pre.toggles, 0u) == 1.0) {
            extraAtk = min(erOver * 20.0, 2600.0);
        } else {
            extraAtk = min(erOver * 12.0, 1560.0);
        }
        finalAtk += extraAtk;
    }

    if (pre.charId == 1412.0) {
        let erOver = max((finalER - 125.0), 0);
        var extraDmgBonus = min(erOver * 1.5, 37.5);
        if (erOver > 25.0) {
            extraDmgBonus += min(erOver * 0.5, 17.5);
        }
        dmgBonus += extraDmgBonus * INV_100 * f32((mask >> 6u) & 1u);
    }

    var critRateForDmg = pre.critRateTotal;
    var critDmgForDmg = pre.critDmgTotal;
    let baseMul = pre.resDefAmp * pre.dmgReductionTotal;

    if (pre.charId == 1209.0) {
        let erOver = finalER - 100.0;
        let extraDmgBonus = min(erOver * 0.25, 40.0);
        dmgBonus += extraDmgBonus * INV_100 * toggleValue(pre.toggles, 0u);

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
