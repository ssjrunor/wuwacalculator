export function hasSkill(mask, flag) {
    return (mask & flag) !== 0;
}

// Returns 1 if bit at bitIndex is set in the float-reinterpreted mask, else 0.
// Signature mirrors GPU toggleValue(toggles, bit): (value, bitIndex)
export function bitValue(value = 0, bitIndex) {
    if (bitIndex == null || bitIndex < 0 || bitIndex > 31) return 0;
    const u32 = new Uint32Array(1);
    const f32 = new Float32Array(u32.buffer);
    f32[0] = value ?? 0;
    return ((u32[0] >>> bitIndex) & 1) === 1 ? 1 : 0;
}

export function countOneBits(x) {
    let v = x >>> 0;
    v = v - ((v >>> 1) & 0x55555555);
    v = (v & 0x33333333) + ((v >>> 2) & 0x33333333);
    return (((v + (v >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24;
}
