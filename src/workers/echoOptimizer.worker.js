import { findBestFullEchoSetMonteCarlo } from "../utils/echoGenerator.js";

self.onmessage = async (event) => {
    const {
        characterRuntimeStates,
        charId,
        activeCharacter,
        entry,
        levelData,
        baseCharacterState,
        mergedBuffs,
        echoData,
        skillStatWeight,
    } = event.data;

    try {
        const result = await findBestFullEchoSetMonteCarlo(
            { characterRuntimeStates, charId, activeCharacter, entry, levelData },
            1000, 0.5, 20, baseCharacterState, 0.3,
            mergedBuffs, echoData, skillStatWeight, Date.now(), 4
        );

        self.postMessage({ success: true, result });
    } catch (err) {
        self.postMessage({ success: false, error: String(err?.message || err) });
    }
};