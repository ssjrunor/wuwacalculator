var<workgroup> origScore: array<f32, 512>;
var<workgroup> origIdx: array<u32, 512>;
var<workgroup> origMain: array<u32, 512>;
var<workgroup> blocked: array<u32, 512>;

var<workgroup> tmpScore: array<f32, 512>;
var<workgroup> tmpIdx: array<u32, 512>;
var<workgroup> tmpThread: array<u32, 512>;

var<workgroup> winThread: u32;
var<workgroup> winScore: f32;

@compute @workgroup_size(512)
fn main(
    @builtin(workgroup_id) wg: vec3<u32>,
    @builtin(local_invocation_id) lid3: vec3<u32>
) {
    let lid = lid3.x;
    let comboCount = u32(params.comboCount);
    let baseIndex = (wg.x * 512u + lid) * CYCLES_PER_INVOCATION;

    var best: f32 = NEG_INF;
    var bestIndex: u32 = 0u;
    var bestMain: u32 = 0u;

    for (var j: u32 = 0u; j < CYCLES_PER_INVOCATION; j = j + 1u) {
        let idx = baseIndex + j;
        if (idx >= comboCount) { break; }

        let eval = computeDamageForCombo(idx);
        if (eval.dmg > best) {
            best = eval.dmg;
            bestIndex = idx;
            bestMain = eval.mainPos;
        }
    }

    origScore[lid] = best;
    origIdx[lid] = bestIndex;
    origMain[lid] = bestMain;
    blocked[lid] = 0u;

    workgroupBarrier();

    var k: u32 = 0u;
    loop {
        if (k >= REDUCE_K) { break; }

        let allowed = (blocked[lid] == 0u);
        tmpScore[lid] = select(NEG_INF, origScore[lid], allowed);
        tmpIdx[lid] = origIdx[lid];
        tmpThread[lid] = lid;

        workgroupBarrier();

        var stride: u32 = 256u;
        loop {
            if (stride == 0u) { break; }

            if (lid < stride) {
                let other = lid + stride;
                if (tmpScore[other] > tmpScore[lid]) {
                    tmpScore[lid] = tmpScore[other];
                    tmpIdx[lid] = tmpIdx[other];
                    tmpThread[lid] = tmpThread[other];
                }
            }

            stride = stride / 2u;
            workgroupBarrier();
        }

        if (lid == 0u) {
            winThread = tmpThread[0];
            winScore  = tmpScore[0];

            if (winScore <= 0.0) {
                candidates[wg.x * REDUCE_K + k] = Candidate(0.0, 0u);
            } else {
                let mainPos = origMain[winThread] & 7u;
                let packedIdx = (mainPos << 29u) | tmpIdx[0];
                candidates[wg.x * REDUCE_K + k] = Candidate(winScore, packedIdx);
            }
        }

        workgroupBarrier();

        if (winScore > 0.0 && lid == winThread) {
            blocked[lid] = 1u;
        }

        workgroupBarrier();
        k = k + 1u;
    }
}
