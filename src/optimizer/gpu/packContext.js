// packGpuContext.js
export function packGpuContext(ctx) {
    // 32 floats = 128 bytes, nice and aligned; last few are just padding
    const data = new Float32Array(32);
    let i = 0;

    data[i++] = ctx.baseAtk      ?? 0;
    data[i++] = ctx.baseHp       ?? 0;
    data[i++] = ctx.baseDef      ?? 0;
    data[i++] = ctx.baseER       ?? 0;

    data[i++] = ctx.finalAtk     ?? 0;
    data[i++] = ctx.finalHp      ?? 0;
    data[i++] = ctx.finalDef     ?? 0;
    data[i++] = 0; // _padStats

    data[i++] = ctx.scalingAtk   ?? 0;
    data[i++] = ctx.scalingHp    ?? 0;
    data[i++] = ctx.scalingDef   ?? 0;
    data[i++] = ctx.scalingER    ?? 0;

    data[i++] = ctx.multiplier   ?? 0;
    data[i++] = ctx.flatDmg      ?? 0;

    data[i++] = ctx.resMult      ?? 1;
    data[i++] = ctx.defMult      ?? 1;

    data[i++] = ctx.dmgReductionTotal ?? 1;
    data[i++] = ctx.dmgBonus     ?? 1;
    data[i++] = ctx.dmgAmplify   ?? 1;

    data[i++] = ctx.critRate     ?? 0;
    data[i++] = ctx.critDmg      ?? 1;

    data[i++] = ctx.normalBase   ?? 0;

    data[i++] = ctx.elementId    ?? 0;
    data[i++] = ctx.skillTypeId  ?? 0;

    // NEW: comboCount lives in the struct now
    data[i++] = ctx.comboCount   ?? 0;

    // pads
    data[i++] = 0; // pad0
    data[i++] = 0; // pad1
    data[i++] = 0; // pad2
    data[i++] = 0; // pad3

    // remaining entries (if any) stay 0
    return data;
}