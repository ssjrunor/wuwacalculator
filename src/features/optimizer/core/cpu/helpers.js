export function hasSkill(mask, flag) {
    return (mask & flag) !== 0;
}

export function countOneBits(x) {
    let v = x >>> 0;
    v = v - ((v >>> 1) & 0x55555555);
    v = (v & 0x33333333) + ((v >>> 2) & 0x33333333);
    return (((v + (v >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24;
}
