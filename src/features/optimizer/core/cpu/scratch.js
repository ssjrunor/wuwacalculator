import { OPTIMIZER_ECHOS_PER_COMBO, OPTIMIZER_SET_SLOTS } from "../optimizerConfig.js";

export function createCpuScratch() {
    return {
        setMask: new Uint32Array(OPTIMIZER_SET_SLOTS),
        setCount: new Uint32Array(OPTIMIZER_SET_SLOTS),
        echoIds: new Int32Array(OPTIMIZER_ECHOS_PER_COMBO),
    };
}
