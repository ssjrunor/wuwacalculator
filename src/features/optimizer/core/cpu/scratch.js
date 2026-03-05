import { OPTIMIZER_ECHOS_PER_COMBO, OPTIMIZER_SET_SLOTS } from "../misc/index.js";

export function createCpuScratch() {
    return {
        setMask: new Uint32Array(OPTIMIZER_SET_SLOTS),
        // Set counts never exceed 5; Uint8 saves memory across worker batches
        setCount: new Uint8Array(OPTIMIZER_SET_SLOTS),
        echoIds: new Int32Array(OPTIMIZER_ECHOS_PER_COMBO),
        touchedSetIds: new Uint8Array(OPTIMIZER_ECHOS_PER_COMBO),
        prevTouchedSetIds: new Uint8Array(OPTIMIZER_ECHOS_PER_COMBO),
        prevTouchedSetCount: 0,
        comboState: null,
        damageResult: null,
    };
}
