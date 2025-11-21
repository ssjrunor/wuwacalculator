// =======================================
// packGpuContext.js — 256-byte Uniform
// =======================================

export function packGpuContext(ctx) {
    // WebGPU requires 256-byte aligned uniform buffers.
    // 64 floats × 4 bytes = 256 bytes
    const arr = new Float32Array(64);
    let i = 0;

    // base stats
    arr[i++] = ctx.baseAtk;
    arr[i++] = ctx.baseHp;
    arr[i++] = ctx.baseDef;
    arr[i++] = ctx.baseER;

    // final stats
    arr[i++] = ctx.finalAtk;
    arr[i++] = ctx.finalHp;
    arr[i++] = ctx.finalDef;
    arr[i++] = 0;

    // scaling
    arr[i++] = ctx.scalingAtk;
    arr[i++] = ctx.scalingHp;
    arr[i++] = ctx.scalingDef;
    arr[i++] = ctx.scalingER;

    // multipliers
    arr[i++] = ctx.multiplier;
    arr[i++] = ctx.flatDmg;

    // resistance / defense
    arr[i++] = ctx.resMult;
    arr[i++] = ctx.defMult;

    // reductions & bonuses
    arr[i++] = ctx.dmgReductionTotal;
    arr[i++] = ctx.dmgBonus;
    arr[i++] = ctx.dmgAmplify;

    // crit
    arr[i++] = ctx.critRate;
    arr[i++] = ctx.critDmg;

    // base damage
    arr[i++] = ctx.normalBase;

    // NEW: element & skill type
    arr[i++] = ctx.elementId;
    arr[i++] = ctx.skillTypeId;

    // combo count
    arr[i++] = ctx.comboCount;

    // the rest stays zero as padding
    return arr;
}