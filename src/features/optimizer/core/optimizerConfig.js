export const ECHO_OPTIMIZER_MAX_COST = 12;
export const ECHO_OPTIMIZER_MAX_SIZE = 5;
export const ECHO_OPTIMIZER_BATCH_SIZE_DEFAULT = 5000;
export const ECHO_OPTIMIZER_BATCH_SIZE_CAP = 10000000;
export const ECHO_OPTIMIZER_JOB_TARGET_COMBOS_GPU = 10000000;

export const OPTIMIZER_ECHOS_PER_COMBO = 5;
export const OPTIMIZER_STATS_PER_ECHO = 20;
export const OPTIMIZER_MAIN_ECHO_BUFFS_PER_ECHO = 15;
export const OPTIMIZER_SET_SLOTS = 32;
export const OPTIMIZER_CONTEXT_FLOATS = 36;

export const OPTIMIZER_WORKER_COUNT_GPU = 1;
const detectedCores = typeof navigator !== "undefined"
    ? (navigator.hardwareConcurrency ?? 4)
    : 4;

const cpuWorkerTarget = Math.max(1, detectedCores - 1);

export const OPTIMIZER_WORKER_COUNT_CPU = Math.min(6, cpuWorkerTarget);

const cpuJobTarget = 25000 + OPTIMIZER_WORKER_COUNT_CPU * 5000;
export const ECHO_OPTIMIZER_JOB_TARGET_COMBOS_CPU = Math.min(75000, cpuJobTarget);

export const OPTIMIZER_WORKGROUP_SIZE = 512;
export const OPTIMIZER_CYCLES_PER_INVOCATION = 1024;
export const OPTIMIZER_REDUCE_K = 8;
export const OPTIMIZER_ENABLE_TIMING_LOGS = false;

export const OPTIMIZER_FLAG_BASIC = 1 << 0;
export const OPTIMIZER_FLAG_HEAVY = 1 << 1;
export const OPTIMIZER_FLAG_SKILL = 1 << 2;
export const OPTIMIZER_FLAG_LIB = 1 << 3;
export const OPTIMIZER_FLAG_ECHO_SKILL = 1 << 6;
export const OPTIMIZER_FLAG_COORD = 1 << 7;

export const OPTIMIZER_SKILL_HEAVY = 1 << 1;
export const OPTIMIZER_SKILL_ECHO_SKILL = 1 << 6;

export const OPTIMIZER_CTX_BASE_ATK = 0;
export const OPTIMIZER_CTX_BASE_HP = 1;
export const OPTIMIZER_CTX_BASE_DEF = 2;
export const OPTIMIZER_CTX_BASE_ER = 3;
export const OPTIMIZER_CTX_FINAL_ATK = 4;
export const OPTIMIZER_CTX_FINAL_HP = 5;
export const OPTIMIZER_CTX_FINAL_DEF = 6;
export const OPTIMIZER_CTX_SCALING_ATK = 8;
export const OPTIMIZER_CTX_SCALING_HP = 9;
export const OPTIMIZER_CTX_SCALING_DEF = 10;
export const OPTIMIZER_CTX_SCALING_ER = 11;
export const OPTIMIZER_CTX_MULTIPLIER = 12;
export const OPTIMIZER_CTX_FLAT_DMG = 13;
export const OPTIMIZER_CTX_RES_MULT = 14;
export const OPTIMIZER_CTX_DEF_MULT = 15;
export const OPTIMIZER_CTX_DMG_REDUCTION = 16;
export const OPTIMIZER_CTX_DMG_BONUS = 17;
export const OPTIMIZER_CTX_DMG_AMPLIFY = 18;
export const OPTIMIZER_CTX_CRIT_RATE = 19;
export const OPTIMIZER_CTX_CRIT_DMG = 20;
export const OPTIMIZER_CTX_ELEMENT_ID = 22;
export const OPTIMIZER_CTX_SKILL_MASK = 23;
export const OPTIMIZER_CTX_CHAR_ID = 25;
export const OPTIMIZER_CTX_SEQUENCE = 26;
export const OPTIMIZER_CTX_LOCKED_INDEX = 27;

export const OPTIMIZER_DEFAULT_CONSTRAINTS = new Float32Array([
    1, 0, // atk
    1, 0, // hp
    1, 0, // def
    1, 0, // critRate
    1, 0, // critDmg
    1, 0, // ER
    1, 0, // dmgBonus
    1, 0, // damage
]);
