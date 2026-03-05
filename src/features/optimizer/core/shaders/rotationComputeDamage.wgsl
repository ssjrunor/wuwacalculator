struct RotationMeta {
    ctxCount: u32,
    ctxStride: u32,
    _pad0: u32,
    _pad1: u32,
};

@group(0) @binding(11) var<storage, read> rotationContexts: array<f32>;
@group(0) @binding(13) var<uniform> rotationMeta: RotationMeta;

const CTX_BASE_ATK: u32 = 0u;
const CTX_BASE_HP: u32 = 1u;
const CTX_BASE_DEF: u32 = 2u;
const CTX_BASE_ER: u32 = 3u;
const CTX_FINAL_ATK: u32 = 4u;
const CTX_FINAL_HP: u32 = 5u;
const CTX_FINAL_DEF: u32 = 6u;
const CTX_SCALING_ATK: u32 = 8u;
const CTX_SCALING_HP: u32 = 9u;
const CTX_SCALING_DEF: u32 = 10u;
const CTX_SCALING_ER: u32 = 11u;
const CTX_MULTIPLIER: u32 = 12u;
const CTX_FLAT_DMG: u32 = 13u;
const CTX_RES_MULT: u32 = 14u;
const CTX_DEF_MULT: u32 = 15u;
const CTX_DMG_REDUCTION: u32 = 16u;
const CTX_DMG_BONUS: u32 = 17u;
const CTX_DMG_AMPLIFY: u32 = 18u;
const CTX_SPECIAL: u32 = 19u;
const CTX_CRIT_RATE: u32 = 20u;
const CTX_CRIT_DMG: u32 = 21u;
const CTX_TOGGLES: u32 = 22u;
const CTX_SKILL_ID: u32 = 23u;
const CTX_META0: u32 = 24u;
const CTX_META1: u32 = 25u;
const CTX_LOCKED_PACKED: u32 = 26u;
const CTX_BASE_INDEX: u32 = 27u;
const CTX_SET_RUNTIME_MASK: u32 = 28u;

fn loadParams(ctxIndex: u32) -> Params {
    var p: Params;
    let stride = rotationMeta.ctxStride;
    let base = ctxIndex * stride;

    p.baseAtk = rotationContexts[base + CTX_BASE_ATK];
    p.baseHp = rotationContexts[base + CTX_BASE_HP];
    p.baseDef = rotationContexts[base + CTX_BASE_DEF];
    p.baseER = rotationContexts[base + CTX_BASE_ER];

    p.finalAtk = rotationContexts[base + CTX_FINAL_ATK];
    p.finalHp = rotationContexts[base + CTX_FINAL_HP];
    p.finalDef = rotationContexts[base + CTX_FINAL_DEF];
    p._padStats = 0.0;

    p.scalingAtk = rotationContexts[base + CTX_SCALING_ATK];
    p.scalingHp = rotationContexts[base + CTX_SCALING_HP];
    p.scalingDef = rotationContexts[base + CTX_SCALING_DEF];
    p.scalingER = rotationContexts[base + CTX_SCALING_ER];

    p.multiplier = rotationContexts[base + CTX_MULTIPLIER];
    p.flatDmg = rotationContexts[base + CTX_FLAT_DMG];

    p.resMult = rotationContexts[base + CTX_RES_MULT];
    p.defMult = rotationContexts[base + CTX_DEF_MULT];

    p.dmgReductionTotal = rotationContexts[base + CTX_DMG_REDUCTION];
    p.dmgBonus = rotationContexts[base + CTX_DMG_BONUS];
    p.dmgAmplify = rotationContexts[base + CTX_DMG_AMPLIFY];
    p.special = rotationContexts[base + CTX_SPECIAL];

    p.critRate = rotationContexts[base + CTX_CRIT_RATE];
    p.critDmg = rotationContexts[base + CTX_CRIT_DMG];
    p.toggles = rotationContexts[base + CTX_TOGGLES];

    p.skillId = bitcast<u32>(rotationContexts[base + CTX_SKILL_ID]);
    p.meta0 = bitcast<u32>(rotationContexts[base + CTX_META0]);
    p.meta1 = bitcast<u32>(rotationContexts[base + CTX_META1]);
    p.lockedPacked = bitcast<u32>(rotationContexts[base + CTX_LOCKED_PACKED]);
    p.comboBaseIndex = bitcast<u32>(rotationContexts[base + CTX_BASE_INDEX]);
    p._pad0 = bitcast<u32>(rotationContexts[base + CTX_SET_RUNTIME_MASK]);

    p._pad1 = 0u;
    p._pad2 = 0u;
    p._pad3 = 0u;
    p._pad4 = 0u;
    p._pad5 = 0u;
    p._pad6 = 0u;
    p._pad7 = 0u;

    return p;
}

fn computeRotationForEchoIds(echoIds: array<i32, 5>) -> ComboEval {
    let ctxCount = rotationMeta.ctxCount;
    if (ctxCount == 0u) {
        return ComboEval(0.0, 0u);
    }

    let base = buildEchoBase(echoIds);

    if (base.totalCost > decodeComboMaxCost(params)) {
        return ComboEval(0.0, 0u);
    }

    // Use array for branchless accumulation
    var totals: array<f32, 5>;
    totals[0] = 0.0;
    totals[1] = 0.0;
    totals[2] = 0.0;
    totals[3] = 0.0;
    totals[4] = 0.0;

    let lockedIndex : i32 = decodeLockedIndex(params);

    // -------------------------
    // Prefetch main-echo buffs once per combo
    // -------------------------
    var mainOk: array<u32, 5u>;
    var validCount: u32 = 0u;

    var mainAtkPRatio: array<f32, 5u>;
    var mainAtkF: array<f32, 5u>;
    var mainER: array<f32, 5u>;

    // Element bonuses: (aero, glacio, fusion, spectro) + (havoc, electro)
    var mainElem0: array<vec4<f32>, 5u>;
    var mainElem1: array<vec2<f32>, 5u>;

    // Skill-type bonuses: (basic, heavy, skill, lib) + (echoSkill, coord)
    var mainType0: array<vec4<f32>, 5u>;
    var mainType1: array<vec2<f32>, 5u>;

    for (var mainPos: u32 = 0u; mainPos < 5u; mainPos = mainPos + 1u) {
        let mainId = echoIds[mainPos];
        if (mainId < 0) {
            mainOk[mainPos] = 0u;
            mainAtkPRatio[mainPos] = 0.0;
            mainAtkF[mainPos] = 0.0;
            mainER[mainPos] = 0.0;
            mainElem0[mainPos] = vec4<f32>(0.0);
            mainElem1[mainPos] = vec2<f32>(0.0);
            mainType0[mainPos] = vec4<f32>(0.0);
            mainType1[mainPos] = vec2<f32>(0.0);
            continue;
        }
        if (lockedIndex >= 0 && mainId != lockedIndex) {
            mainOk[mainPos] = 0u;
            mainAtkPRatio[mainPos] = 0.0;
            mainAtkF[mainPos] = 0.0;
            mainER[mainPos] = 0.0;
            mainElem0[mainPos] = vec4<f32>(0.0);
            mainElem1[mainPos] = vec2<f32>(0.0);
            mainType0[mainPos] = vec4<f32>(0.0);
            mainType1[mainPos] = vec2<f32>(0.0);
            continue;
        }

        mainOk[mainPos] = 1u;
        validCount = validCount + 1u;

        let b = u32(mainId) * BUFFS_PER_ECHO;

        let atkP = mainEchoBuffs[b + 0u];
        mainAtkPRatio[mainPos] = atkP / 100.0;
        mainAtkF[mainPos] = mainEchoBuffs[b + 1u];

        mainType0[mainPos] = vec4<f32>(
            mainEchoBuffs[b + 2u],  // basic
            mainEchoBuffs[b + 3u],  // heavy
            mainEchoBuffs[b + 4u],  // skill
            mainEchoBuffs[b + 5u]   // lib
        );
        mainElem0[mainPos] = vec4<f32>(
            mainEchoBuffs[b + 6u],  // aero
            mainEchoBuffs[b + 7u],  // glacio
            mainEchoBuffs[b + 8u],  // fusion
            mainEchoBuffs[b + 9u]   // spectro
        );
        mainElem1[mainPos] = vec2<f32>(
            mainEchoBuffs[b + 10u], // havoc
            mainEchoBuffs[b + 11u]  // electro
        );

        mainER[mainPos] = mainEchoBuffs[b + 12u];
        mainType1[mainPos] = vec2<f32>(
            mainEchoBuffs[b + 13u], // echoSkill
            mainEchoBuffs[b + 14u]  // coord
        );
    }

    // Early-out if no valid main positions (locked echo not in combo)
    if (validCount == 0u) {
        return ComboEval(0.0, 0u);
    }

    // -------------------------
    // Apply base set effects ONCE (no skillMask dependency)
    // -------------------------
    var sonataBase = applySetEffectsBase(base);

    // -------------------------
    // Evaluate each rotation context once, accumulate into totals[mainPos]
    // -------------------------
    for (var c: u32 = 0u; c < ctxCount; c = c + 1u) {
        let w = rotationContexts[rotationMeta.ctxCount * rotationMeta.ctxStride + c];
        if (w == 0.0) { continue; }

        let p = loadParams(c);
        let setRuntimeMask = decodeSetRuntimeMask(p);

        let skillId: u32 = p.skillId;
        let skillMask: u32 = skillMaskFromSkillId(skillId);
        let elementId: u32 = elementFromSkillId(skillId);

        // Copy base and add conditional effects
        var sonata = sonataBase;
        applySetEffectsConditional(&sonata, base.setCount, skillMask, setRuntimeMask);
        let pre = buildPreMain(p, sonata, skillMask, elementId, skillId);

        for (var mainPos: u32 = 0u; mainPos < 5u; mainPos = mainPos + 1u) {
            if (mainOk[mainPos] == 0u) { continue; }

            let avg = evalMainPos(
                pre,
                base.setCount,
                setRuntimeMask,
                mainAtkPRatio[mainPos], mainAtkF[mainPos], mainER[mainPos],
                mainElem0[mainPos], mainElem1[mainPos],
                mainType0[mainPos], mainType1[mainPos]
            );

            if (avg == NEG_INF) { continue; }

            totals[mainPos] = totals[mainPos] + avg * w;
        }
    }

    // Find best position using loop instead of if-chain
    var best: f32 = NEG_INF;
    var bestMain: u32 = 0u;
    for (var i: u32 = 0u; i < 5u; i = i + 1u) {
        if (totals[i] > best) {
            best = totals[i];
            bestMain = i;
        }
    }

    if (best <= 0.0) {
        return ComboEval(0.0, 0u);
    }

    return ComboEval(best, bestMain);
}

fn computeRotationForCombo(index: u32) -> ComboEval {
    let comboCount = decodeComboCount(params);
    if (index >= comboCount) {
        return ComboEval(0.0, 0u);
    }

    let comboIndex = comboBaseIndex(params) + index;
    let echoIds = buildEchoIds(comboIndex);
    return computeRotationForEchoIds(echoIds);
}
