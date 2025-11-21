@group(0) @binding(0) var<storage, read> echoStats: array<f32>;
@group(0) @binding(1) var<storage, read> echoCosts: array<f32>;
@group(0) @binding(2) var<storage, read> echoSets: array<f32>;
@group(0) @binding(3) var<storage, read> combos: array<i32>;
const CONTEXT_SIZE : u32 = 30u;
const CONTEXT_VEC4_COUNT : u32 = ((CONTEXT_SIZE + 3u) / 4u);
@group(0) @binding(4)
var<uniform> contextVec4 : array<vec4<f32>, CONTEXT_VEC4_COUNT>;
@group(0) @binding(5) var<storage, read_write> outDamage: array<f32>;
@group(0) @binding(6) var<storage, read> mainEchoBuffs: array<f32>;

const STATS_PER_ECHO : u32 = 20u;
const ECHOS_PER_COMBO: u32 = 5u;
const BUFFS_PER_ECHO : u32 = 15u;


// Context packing order (must match packGpuContext.js)
const FIELD_baseAtk      : u32 = 0u;
const FIELD_baseHp       : u32 = 1u;
const FIELD_baseDef      : u32 = 2u;
const FIELD_baseER       : u32 = 3u;

const FIELD_finalAtk     : u32 = 4u;
const FIELD_finalHp      : u32 = 5u;
const FIELD_finalDef     : u32 = 6u;
// 7 = _padStats

const FIELD_scalingAtk   : u32 = 8u;
const FIELD_scalingHp    : u32 = 9u;
const FIELD_scalingDef   : u32 = 10u;
const FIELD_scalingER    : u32 = 11u;

const FIELD_multiplier   : u32 = 12u;
const FIELD_flatDmg      : u32 = 13u;

const FIELD_resMult      : u32 = 14u;
const FIELD_defMult      : u32 = 15u;

const FIELD_dmgReductionTotal : u32 = 16u;
const FIELD_dmgBonus     : u32 = 17u;
const FIELD_dmgAmplify   : u32 = 18u;

const FIELD_critRate     : u32 = 19u;
const FIELD_critDmg      : u32 = 20u;

const FIELD_normalBase   : u32 = 21u;

const FIELD_elementId    : u32 = 22u;
const FIELD_skillTypeId  : u32 = 23u;

const FIELD_comboCount   : u32 = 24u;
// 25–27 padding

// -----------------------------------------------
// Load per-combo context data into locals
// -----------------------------------------------
fn loadContext() -> array<f32, CONTEXT_SIZE> {
    var ctx : array<f32, CONTEXT_SIZE>;
    var index : u32 = 0u;
    for (var i = 0u; i < CONTEXT_VEC4_COUNT; i = i + 1u) {
        let v = contextVec4[i];

        if (index < CONTEXT_SIZE) { ctx[index] = v.x; }
        index = index + 1u;

        if (index < CONTEXT_SIZE) { ctx[index] = v.y; }
        index = index + 1u;

        if (index < CONTEXT_SIZE) { ctx[index] = v.z; }
        index = index + 1u;

        if (index < CONTEXT_SIZE) { ctx[index] = v.w; }
        index = index + 1u;
    }

    return ctx;
}

@compute @workgroup_size(512)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
    let index = gid.x;

    // Load context for this combo
    let ctx = loadContext();
    let elementId = ctx[FIELD_elementId];
    let skillTypeId = ctx[FIELD_skillTypeId];

    let comboCount = u32(ctx[FIELD_comboCount]);
    if (index >= comboCount) { return; }

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
    for (var i: u32 = 0u; i < 32u; i = i + 1u) {
        setCount[i] = 0u;
    }

    // echoIds[] already loaded
    for (var i: u32 = 0u; i < 5u; i = i + 1u) {
        let id = echoIds[i];
        if (id < 0) { continue; }

        let setIdF = echoSets[u32(id)];
        let setId = u32(setIdF);
        if (setId < 32u) {
            setCount[setId] = setCount[setId] + 1u;
        }
    }

    // -------------------------
    // Apply set effects
    // -------------------------

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
/*
    if (setCount[7u] >= 2u) { setDmgBonus += 0.10; }
*/
    if (setCount[7u] >= 5u) { atkP += 15.0; }

    // SET 8 — Energy Regen 2pc
    if (setCount[8u] >= 2u) { erEcho += 10.0; }

    // SET 9 — ATK% 2/5
    if (setCount[9u] >= 2u) { atkP += 10.0; }
    if (setCount[9u] >= 5u) { atkP += 20.0; }

    // SET 10 — Glacio resonance skill set
    if (setCount[10u] >= 2u) {
        glacio += 12.0;
    }
    if (setCount[10u] >= 5u) {
        glacio += 22.5;
        skillEcho += 36.0;   // resonanceSkill → skillEcho
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
    if (setCount[13u] >= 2u) { erEcho += 10.0; }
    if (setCount[13u] >= 5u) { atkP += 20.0; }

    // SET 14 — ER 2pc, ATK% 5pc
    if (setCount[14u] >= 2u) { erEcho += 10.0; }
    if (setCount[14u] >= 5u) { atkP += 10.0; }

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
    if (setCount[22u] >= 3u) { fusion += 16.0; }
    if (setCount[22u] >= 3u && (skillTypeId == 1.0 || skillTypeId == 6.0)) { critRateEcho += 20.0; }

    // SET 23
    if (setCount[23u] >= 3u) {
        atkP += 20.0;
        libEcho += 30.0;
    }

    // -------------------------
    // Pick element bonuses
    // -------------------------
    var bonus: f32 = 0.0;

    if (elementId == 0.0) { bonus += aero;    }
    if (elementId == 1.0) { bonus += glacio;  }
    if (elementId == 2.0) { bonus += fusion;  }
    if (elementId == 3.0) { bonus += spectro; }
    if (elementId == 4.0) { bonus += havoc;   }
    if (elementId == 5.0) { bonus += electro; }

    // skill type bonus
    if (skillTypeId == 0.0) { bonus += basicEcho; }
    if (skillTypeId == 1.0) { bonus += heavyEcho; }
    if (skillTypeId == 2.0) { bonus += skillEcho; }
    if (skillTypeId == 3.0) { bonus += libEcho;   }
    if (skillTypeId == 6.0) { bonus += echoSkill; }
    if (skillTypeId == 7.0) { bonus += coord; }

    let dmgBonus = ctx[FIELD_dmgBonus] + bonus / 100.0;

    // -------------------------
    // Final stats with echoes
    // -------------------------
    let finalAtk =
        ctx[FIELD_baseAtk] * (atkP / 100.0) + atkF + ctx[FIELD_finalAtk];

    let finalHp =
        ctx[FIELD_baseHp] * (hpP / 100.0) + hpF + ctx[FIELD_finalHp];

    let finalDef =
        ctx[FIELD_baseDef] * (defP / 100.0) + defF + ctx[FIELD_finalDef];

    let finalER =
        ctx[FIELD_baseER] + erEcho;

    // -------------------------
    // Ability scaling
    // -------------------------
    let scaled =
        finalAtk * ctx[FIELD_scalingAtk] +
        finalHp  * ctx[FIELD_scalingHp] +
        finalDef * ctx[FIELD_scalingDef] +
        finalER  * ctx[FIELD_scalingER];

    // -------------------------
    // Fixed dmg case
    // -------------------------
    let multiplier = ctx[FIELD_multiplier];
    let flatDmg    = ctx[FIELD_flatDmg];

    if (multiplier == 0.0 && ctx[FIELD_scalingAtk] == 0.0 && flatDmg > 0.0) {
        outDamage[index] = flatDmg;
        return;
    }

    // -------------------------
    // Base damage
    // -------------------------
    let base = (scaled * multiplier + flatDmg)
        * ctx[FIELD_resMult]
        * ctx[FIELD_defMult]
        * ctx[FIELD_dmgReductionTotal]
        * dmgBonus
        * ctx[FIELD_dmgAmplify];

    // -------------------------
    // Crit average
    // -------------------------
    let critHit  = base * (ctx[FIELD_critDmg] + critDmgEcho / 100.0);
    let critRate = ctx[FIELD_critRate] + critRateEcho / 100.0;

    let avg = critRate * critHit + (1.0 - critRate) * base;

    outDamage[index] = avg;
}