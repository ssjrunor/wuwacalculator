@compute @workgroup_size(512)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
    let gidFlat = gid.x;
    let comboCount = u32(params.comboCount);

    let baseIndex = gidFlat * CYCLES_PER_INVOCATION;
    if (baseIndex >= comboCount) {
        return;
    }

    var i: u32 = 0u;
    loop {
        if (i >= CYCLES_PER_INVOCATION) {
            break;
        }

        let index = baseIndex + i;
        if (index >= comboCount) {
            break;
        }

        computeDamageForCombo(index);
        i = i + 1u;
    }
}