export const DEFAULT_RESULTS_LIMIT = 8;
export const TRIES_PER_COMBO = 5;
export const COST_PLAN_DEFAULT = [4, 3, 3, 1, 1];
export const ALL_COST_COMBOS = [
    [4, 4, 1, 1, 1],
    [4, 3, 3, 1, 1],
    [4, 3, 1, 1, 1],
    [4, 1, 1, 1, 1],
    [3, 3, 3, 1, 1],
    [3, 3, 1, 1, 1],
    [3, 1, 1, 1, 1],
    [1, 1, 1, 1, 1],
];
export const defaultRandGen = {
    bias: 0.5,
    rollQuality: 0.3,
    targetEnergyRegen: 0,
    setId: [],
    mainEcho: null,
};