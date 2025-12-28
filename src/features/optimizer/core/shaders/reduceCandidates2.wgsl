struct Candidate {
  dmg: f32,
  idx: u32,
};

struct ReduceParams {
  candidateCount: u32,
  _pad0: u32,
  _pad1: u32,
  _pad2: u32,
};

@group(0) @binding(0) var<storage, read> candidatesIn: array<Candidate>;
@group(0) @binding(1) var<storage, read_write> candidatesOut: array<Candidate>;
@group(0) @binding(2) var<uniform> reduceParams: ReduceParams;

const WORKGROUP_SIZE: u32 = 256u;
const REDUCE_K: u32 = 8u;
const NEG_INF: f32 = -1.0e30;

var<workgroup> origScore: array<f32, 256>;
var<workgroup> origIdx: array<u32, 256>;
var<workgroup> blocked: array<u32, 256>;

var<workgroup> tmpScore: array<f32, 256>;
var<workgroup> tmpIdx: array<u32, 256>;
var<workgroup> tmpThread: array<u32, 256>;

var<workgroup> winThread: u32;
var<workgroup> winScore: f32;

@compute @workgroup_size(256)
fn reduceCandidates(
  @builtin(workgroup_id) wg: vec3<u32>,
  @builtin(local_invocation_id) lid3: vec3<u32>
) {
  let lid = lid3.x;
  let base = wg.x * WORKGROUP_SIZE;
  let idx = base + lid;
  let count = reduceParams.candidateCount;

  if (idx < count) {
    let cand = candidatesIn[idx];
    origScore[lid] = cand.dmg;
    origIdx[lid] = cand.idx;
  } else {
    origScore[lid] = NEG_INF;
    origIdx[lid] = 0u;
  }
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

    var stride: u32 = WORKGROUP_SIZE / 2u;
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
      winScore = tmpScore[0];
      if (winScore <= 0.0) {
        candidatesOut[wg.x * REDUCE_K + k] = Candidate(0.0, 0u);
      } else {
        candidatesOut[wg.x * REDUCE_K + k] = Candidate(winScore, tmpIdx[0]);
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
