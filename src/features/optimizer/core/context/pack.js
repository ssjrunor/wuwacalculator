// packOptimizerContext.js
import { OPTIMIZER_CONTEXT_FLOATS } from "../misc/index.js";

export function packOptimizerContext(ctx) {
    // 36 floats = 144 bytes, aligned for GPU uniforms; safe for CPU usage too.
    const buffer = new ArrayBuffer(OPTIMIZER_CONTEXT_FLOATS * 4);
    const data = new Float32Array(buffer);
    const u32 = new Uint32Array(buffer);
    let i = 0;

    const fallbackSkillId = ((((ctx.elementId ?? 0) & 0x7) << 15) | ((ctx.skillTypeId ?? 0) & 0x7fff)) >>> 0;
    const skillId = (ctx.skillId ?? fallbackSkillId) >>> 0;

    data[i++] = ctx.baseAtk      ?? 0;
    data[i++] = ctx.baseHp       ?? 0;
    data[i++] = ctx.baseDef      ?? 0;
    data[i++] = ctx.baseER       ?? 0;

    data[i++] = ctx.finalAtk     ?? 0;
    data[i++] = ctx.finalHp      ?? 0;
    data[i++] = ctx.finalDef     ?? 0;
    data[i++] = 0;

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

    u32[i++] = skillId;
    u32[i++] = 0; // pad to preserve stride / alignment

    data[i++] = ctx.comboCount   ?? 0;

    data[i++] = ctx.charId       ?? 0;
    data[i++] = ctx.sequence     ?? 0;
    data[i++] = ctx.lockedEchoIndex ?? -1;

    data[i++] = ctx.comboMode ?? 0;
    data[i++] = ctx.comboN ?? 0;
    data[i++] = ctx.comboMaxCost ?? 0;
    data[i++] = ctx.comboK ?? 0;
    {
        const baseIndex = (ctx.comboBaseIndex ?? 0) >>> 0;
        // Preserve full u32 precision in WGSL even though uniforms are f32.
        // WGSL reconstructs: base = (hi << 16) | lo.
        const lo = baseIndex & 0xffff;
        const hi = baseIndex >>> 16;
        data[i++] = lo;
        data[i++] = hi;
    }

    return data;
}
