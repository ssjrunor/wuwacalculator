// packOptimizerContext.js
import { OPTIMIZER_CONTEXT_FLOATS } from "../misc/index.js";

export function packOptimizerContext(ctx) {
    // 35 floats = 140 bytes; tail packed into meta words to free pad space.
    const buffer = new ArrayBuffer(OPTIMIZER_CONTEXT_FLOATS * 4);
    const data = new Float32Array(buffer);
    const u32 = new Uint32Array(buffer);
    let i = 0;

    const skillId = ctx.skillId >>> 0;
    const charId = (ctx.charId ?? 0) >>> 0;
    const sequence = (ctx.sequence ?? 0) >>> 0;
    const comboMode = (ctx.comboMode ?? 0) >>> 0;
    const comboK = (ctx.comboK ?? 0) >>> 0;
    const comboMaxCost = (ctx.comboMaxCost ?? 0) >>> 0;
    const comboN = (ctx.comboN ?? 0) >>> 0;
    const comboCount = (ctx.comboCount ?? 0) >>> 0;
    const comboBaseIndex = (ctx.comboBaseIndex ?? 0) >>> 0;
    const lockedRaw = ctx.lockedEchoIndex ?? -1;
    const lockedPacked = lockedRaw < 0 ? 0 : ((lockedRaw + 1) >>> 0);

    // meta0: charId(12) | sequence(4) | comboMode(2) | comboK(3) | comboMaxCost(6) | spare(5)
    const meta0 =
        (charId & 0xfff) |
        ((sequence & 0xf) << 12) |
        ((comboMode & 0x3) << 16) |
        ((comboK & 0x7) << 18) |
        ((comboMaxCost & 0x3f) << 21);

    // meta1: comboCount(24) | comboN(8)
    const meta1 =
        (comboCount & 0xffffff) |
        ((comboN & 0xff) << 24);

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
    data[i++] = ctx.special      ?? 1;

    data[i++] = ctx.critRate     ?? 0;
    data[i++] = ctx.critDmg      ?? 1;

    u32[i++] = skillId;
    u32[i++] = meta0;
    u32[i++] = meta1;
    u32[i++] = lockedPacked;
    u32[i++] = comboBaseIndex;

    return data;
}
