@group(0) @binding(0) var<storage, read> echoStats: array<f32>;
@group(0) @binding(1) var<storage, read> echoCosts: array<f32>;
@group(0) @binding(2) var<storage, read> echoSets: array<f32>;
@group(0) @binding(3) var<storage, read> combos: array<i32>;
@group(0) @binding(5) var<storage, read_write> outDamage: array<f32>;
@group(0) @binding(6) var<storage, read> mainEchoBuffs: array<f32>;
@group(0) @binding(8) var<storage, read> echoKindIds: array<i32>;

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

    critRate:     f32,
    critDmg:      f32,

    normalBase:   f32,

    elementId:    f32,
    skillTypeId:  f32,

    comboCount:   f32,
    charId:       f32,
    sequence:     f32,
    pad2:         f32,
    pad3:         f32,
};

@group(0) @binding(4)
var<uniform> params : Params;

const STATS_PER_ECHO : u32 = 20u;
const ECHOS_PER_COMBO: u32 = 5u;
const BUFFS_PER_ECHO : u32 = 15u;

const CYCLES_PER_INVOCATION : u32 = 8u;

fn in_range(val: f32, range: vec2<f32>) -> bool {
    if (range.x > range.y) {
        return true;
    }
    return (val >= range.x && val <= range.y);
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