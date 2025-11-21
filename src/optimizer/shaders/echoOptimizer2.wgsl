// ============================================================================
//  Wuthering Waves Echo Optimizer — Implicit GPU Permutation Engine
//  (No combos[] buffer; full compatibility with STATS_PER_ECHO encoding)
// ============================================================================

//
// CONSTANTS
//
const MAX_ECHOS : u32 = 256u;
const BUILD_SIZE : u32 = 5u;

const STATS_PER_ECHO : u32 = 20u;
const BUFFS_PER_ECHO : u32 = 15u;
const MAX_SETS : u32 = 32u;

//
// BINDINGS
//
@group(0) @binding(0) var<storage, read>  echoStats: array<f32>;
@group(0) @binding(1) var<storage, read>  echoCosts: array<f32>;
@group(0) @binding(2) var<storage, read>  echoSets:  array<f32>;
@group(0) @binding(3) var<storage, read>  mainEchoBuffs: array<f32>;

// CONTEXT — 256-byte packed (Float32Array(64)) from packGpuContext.js
const CONTEXT_SIZE : u32 = 30u;
const CONTEXT_VEC4_COUNT : u32 = ( (CONTEXT_SIZE + 3u) / 4u );

@group(0) @binding(4)
var<uniform> ctxVec : array<vec4<f32>, CONTEXT_VEC4_COUNT>;

@group(0) @binding(5)
var<storage, read_write> outDamage : array<f32>;

//
// Load context into a flat array of f32
//
fn loadContext() -> array<f32, CONTEXT_SIZE> {
    var out : array<f32, CONTEXT_SIZE>;
    var idx : u32 = 0u;

    for (var i: u32 = 0u; i < CONTEXT_VEC4_COUNT; i++) {
        let v = ctxVec[i];

        if (idx < CONTEXT_SIZE) { out[idx] = v.x; } ; idx++;
        if (idx < CONTEXT_SIZE) { out[idx] = v.y; } ; idx++;
        if (idx < CONTEXT_SIZE) { out[idx] = v.z; } ; idx++;
        if (idx < CONTEXT_SIZE) { out[idx] = v.w; } ; idx++;
    }

    return out;
}

//
// Factorials for permutation decoding
//
const fact : array<u32, 13> = array<u32,13>(
    1u, 1u, 2u, 6u, 24u, 120u, 720u,
    5040u, 40320u, 362880u, 3628800u,
    39916800u, 479001600u
);

//
// Return the nth unused echo index
//
fn getNthUnused(n: u32, used: ptr<function, array<bool, MAX_ECHOS>>) -> u32 {
    var count: u32 = 0u;
    for (var i: u32 = 0u; i < MAX_ECHOS; i++) {
        if (!(*used)[i]) {
            if (count == n) {
                (*used)[i] = true;
                return i;
            }
            count++;
        }
    }
    return 0u;
}

//
// Generate permutation #rank (0..totalPerms-1)
// If lockedIndex >= 0, slot0 = lockedIndex
//
fn getPermutation(rank: u32, n: u32, lockedIndex: i32) -> array<u32, BUILD_SIZE> {
    var used : array<bool, MAX_ECHOS>;
    for (var i: u32 = 0u; i < MAX_ECHOS; i++) { used[i] = false; }

    var out : array<u32, BUILD_SIZE>;
    var r = rank;

    let k = BUILD_SIZE;

    // If locked, fix slot 0
    if (lockedIndex >= 0) {
        let L = u32(lockedIndex);
        out[0] = L;
        used[L] = true;

        let rem = n - 1u;

        let w1 = fact[rem - 1u - (k - 2u)];
        let w2 = fact[rem - 1u - (k - 3u)];
        let w3 = fact[rem - 1u - (k - 4u)];
        let w4 = 1u;

        let i1 = r / w2;
        r %= w2;

        let i2 = r / w3;
        r %= w3;

        let i3 = r / w4;
        let i4 = r % w4;

        out[1] = getNthUnused(i1, &used);
        out[2] = getNthUnused(i2, &used);
        out[3] = getNthUnused(i3, &used);
        out[4] = getNthUnused(i4, &used);

        return out;
    }

    // No lock — full 5-permutation
    let w1 = fact[n-1u] / fact[n-k];
    let w2 = fact[n-2u] / fact[n-k];
    let w3 = fact[n-3u] / fact[n-k];
    let w4 = fact[n-4u] / fact[n-k];

    let i0 = r / w1; r %= w1;
    let i1 = r / w2; r %= w2;
    let i2 = r / w3; r %= w3;
    let i3 = r / w4; r %= w4;
    let i4 = r;

    out[0] = getNthUnused(i0, &used);
    out[1] = getNthUnused(i1, &used);
    out[2] = getNthUnused(i2, &used);
    out[3] = getNthUnused(i3, &used);
    out[4] = getNthUnused(i4, &used);

    return out;
}

//
// MAIN KERNEL
//
@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {

    let ctx = loadContext();

    let elementId = ctx[22];
    let skillType = ctx[23];

    let comboCount = u32(ctx[24]);    // packGpuContext: FIELD_comboCount
    let baseAtk = ctx[0];
    let baseHp  = ctx[1];
    let baseDef = ctx[2];
    let baseER  = ctx[3];

    let finalAtkFlat = ctx[4];
    let finalHpFlat  = ctx[5];
    let finalDefFlat = ctx[6];

    let sAtk = ctx[8];
    let sHp  = ctx[9];
    let sDef = ctx[10];
    let sER  = ctx[11];

    let mult    = ctx[12];
    let flatDmg = ctx[13];

    let resMult = ctx[14];
    let defMult = ctx[15];

    let dmgReduction = ctx[16];
    let dmgBonusBase = ctx[17];
    let dmgAmplify   = ctx[18];

    let critRateBase = ctx[19];
    let critDmgBase  = ctx[20];

    let normalBase = ctx[21];

    let lockedIndex = i32(ctx[28]); // store locked echo index here
    let maxCost = u32(ctx[26]);
    let n = u32(ctx[25]);

    if (gid.x >= comboCount) { return; }

    // ----------------------------------------
    // Get permutation for this index
    // ----------------------------------------
    let ids = getPermutation(gid.x, n, lockedIndex);

    // ----------------------------------------
    // COST CHECK
    // ----------------------------------------
    var costSum: u32 = 0u;
    for (var i: u32 = 0u; i < BUILD_SIZE; i++) {
        costSum += u32(echoCosts[ids[i]]);
    }
    if (costSum > maxCost) {
        outDamage[gid.x] = 0.0;
        return;
    }

    // ----------------------------------------
    // AGGREGATE ECHO STATS
    // ----------------------------------------
    var atkP: f32 = 0.0; var atkF: f32 = 0.0;
    var hpP: f32 = 0.0;  var hpF: f32 = 0.0;
    var defP: f32 = 0.0; var defF: f32 = 0.0;

    var critRateEcho: f32 = 0.0;
    var critDmgEcho:  f32 = 0.0;
    var erEcho:       f32 = 0.0;

    var basicEcho: f32 = 0.0;
    var heavyEcho: f32 = 0.0;
    var skillEcho: f32 = 0.0;
    var libEcho:   f32 = 0.0;

    var aero: f32 = 0.0;
    var spectro: f32 = 0.0;
    var fusion: f32 = 0.0;
    var glacio: f32 = 0.0;
    var havoc: f32 = 0.0;
    var electro: f32 = 0.0;

    var echoSkill: f32 = 0.0;
    var coord: f32 = 0.0;

    for (var i: u32 = 0u; i < BUILD_SIZE; i++) {
        let id = ids[i];
        let base = id * STATS_PER_ECHO;

        // Main echo buffs slot (i==0)
        if (i == 0u) {
            let b = id * BUFFS_PER_ECHO;
            atkP      += mainEchoBuffs[b+0];
            atkF      += mainEchoBuffs[b+1];
            basicEcho += mainEchoBuffs[b+2];
            heavyEcho += mainEchoBuffs[b+3];
            skillEcho += mainEchoBuffs[b+4];
            libEcho   += mainEchoBuffs[b+5];

            aero    += mainEchoBuffs[b+6];
            glacio  += mainEchoBuffs[b+7];
            fusion  += mainEchoBuffs[b+8];
            spectro += mainEchoBuffs[b+9];
            havoc   += mainEchoBuffs[b+10];
            electro += mainEchoBuffs[b+11];

            erEcho   += mainEchoBuffs[b+12];
            echoSkill+= mainEchoBuffs[b+13];
            coord    += mainEchoBuffs[b+14];
        }

        atkP += echoStats[base+0];
        atkF += echoStats[base+1];
        hpP  += echoStats[base+2];
        hpF  += echoStats[base+3];
        defP += echoStats[base+4];
        defF += echoStats[base+5];

        critRateEcho += echoStats[base+6];
        critDmgEcho  += echoStats[base+7];
        erEcho       += echoStats[base+8];

        basicEcho += echoStats[base+10];
        heavyEcho += echoStats[base+11];
        skillEcho += echoStats[base+12];
        libEcho   += echoStats[base+13];

        aero    += echoStats[base+14];
        spectro += echoStats[base+15];
        fusion  += echoStats[base+16];
        glacio  += echoStats[base+17];
        havoc   += echoStats[base+18];
        electro += echoStats[base+19];
    }

    // ----------------------------------------
    // SET COUNTING
    // ----------------------------------------
    var setCount: array<u32,MAX_SETS>;
    for (var i: u32 = 0u; i < MAX_SETS; i++) { setCount[i] = 0u; }

    for (var i: u32 = 0u; i < BUILD_SIZE; i++) {
        let sid = u32(echoSets[ids[i]]);
        if (sid < MAX_SETS) { setCount[sid]++; }
    }

    //
    // ------------------------------
    // APPLY ALL SET BONUSES (your logic)
    // ------------------------------
    // (The entire block kept exactly as before)
    //

    // === 2-piece and 5-piece sets ===
    if (setCount[1] >= 2) { glacio += 10.0; }
    if (setCount[1] >= 5) { glacio += 30.0; }

    if (setCount[2] >= 2) { fusion += 10.0; }
    if (setCount[2] >= 5) { fusion += 30.0; }

    if (setCount[3] >= 2) { electro += 10.0; }
    if (setCount[3] >= 5) { electro += 30.0; }

    if (setCount[4] >= 2) { aero += 10.0; }
    if (setCount[4] >= 5) { aero += 30.0; }

    if (setCount[5] >= 2) { spectro += 10.0; }
    if (setCount[5] >= 5) { spectro += 30.0; }

    if (setCount[6] >= 2) { havoc += 10.0; }
    if (setCount[6] >= 5) { havoc += 30.0; }

    if (setCount[7] >= 5) { atkP += 15.0; }

    if (setCount[8] >= 2) { erEcho += 10.0; }

    if (setCount[9] >= 2) { atkP += 10.0; }
    if (setCount[9] >= 5) { atkP += 20.0; }

    if (setCount[10] >= 2) { glacio += 12.0; }
    if (setCount[10] >= 5) { glacio += 22.5; skillEcho += 36.0; }

    if (setCount[11] >= 2) { spectro += 10.0; }
    if (setCount[11] >= 5) { critRateEcho += 20.0; spectro += 15.0; }

    if (setCount[12] >= 2) { havoc += 10.0; }

    if (setCount[13] >= 2) { erEcho += 10.0; }
    if (setCount[13] >= 5) { atkP += 20.0; }

    if (setCount[14] >= 2) { erEcho += 10.0; }
    if (setCount[14] >= 5) { atkP += 10.0; }

    if (setCount[16] >= 2) { aero += 10.0; }
    if (setCount[16] >= 5) { aero += 30.0; }

    if (setCount[17] >= 2) { aero += 10.0; }
    if (setCount[17] >= 5) { critRateEcho += 10.0; aero += 30.0; }

    if (setCount[18] >= 2) { fusion += 10.0; }
    if (setCount[18] >= 5) { fusion += 15.0; libEcho += 20.0; }

    // === 3-piece sets ===
    if (setCount[19] >= 3) { critRateEcho += 20.0; echoSkill += 35.0; }
    if (setCount[20] >= 3) { atkP += 30.0; critDmgEcho += 20.0; }
    if (setCount[21] >= 3) { heavyEcho += 30.0; echoSkill += 16.0; }
    if (setCount[22] >= 3) {
        fusion += 16.0;
        if (skillType == 1.0 || skillType == 6.0) { critRateEcho += 20.0; }
    }
    if (setCount[23] >= 3) { atkP += 20.0; libEcho += 30.0; }

    //
    // ELEMENT BONUSES
    //
    var bonus : f32 = dmgBonusBase;

    if (elementId == 0.0) { bonus += aero / 100.0; }
    if (elementId == 1.0) { bonus += glacio / 100.0; }
    if (elementId == 2.0) { bonus += fusion / 100.0; }
    if (elementId == 3.0) { bonus += spectro / 100.0; }
    if (elementId == 4.0) { bonus += havoc / 100.0; }
    if (elementId == 5.0) { bonus += electro / 100.0; }

    //
    // SKILL TYPE BONUSES
    //
    if (skillType == 0.0) { bonus += basicEcho / 100.0; }
    if (skillType == 1.0) { bonus += heavyEcho / 100.0; }
    if (skillType == 2.0) { bonus += skillEcho / 100.0; }
    if (skillType == 3.0) { bonus += libEcho / 100.0; }
    if (skillType == 6.0) { bonus += echoSkill / 100.0; }
    if (skillType == 7.0) { bonus += coord / 100.0; }

    //
    // FINAL STATS
    //
    let finalAtk =
        baseAtk * (atkP / 100.0) + atkF + finalAtkFlat;

    let finalHp =
        baseHp * (hpP / 100.0) + hpF + finalHpFlat;

    let finalDef =
        baseDef * (defP / 100.0) + defF + finalDefFlat;

    let finalER =
        baseER + erEcho;

    let scaled =
        finalAtk * sAtk +
        finalHp  * sHp +
        finalDef * sDef +
        finalER  * sER;

    //
    // BASE DMG
    //
    let base =
        (scaled * mult + flatDmg)
        * resMult
        * defMult
        * dmgReduction
        * bonus
        * dmgAmplify;

    //
    // CRIT AVG
    //
    let critRate = critRateBase + critRateEcho / 100.0;
    let critDmg  = critDmgBase + critDmgEcho / 100.0;

    let critHit = base * critDmg;
    let avg = critRate * critHit + (1.0 - critRate) * base;

    outDamage[gid.x] = avg;
}