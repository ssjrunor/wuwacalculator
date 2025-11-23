// src/workers/echoWorker.js
import { findBestFullEchoSetMonteCarlo } from '../utils/echoGenerator.js';
import { buildMultipleRandomEchoes } from '../utils/echoHelper.js';

self.onmessage = async (event) => {
    const { payload } = event.data;
    try {
        const {
            characterRuntimeStates,
            charId,
            activeCharacter,
            entry,
            levelData,
            randGen,
            baseCharacterState,
            mergedBuffs,
            echoData,
            skill,
        } = payload;

        const result = await findBestFullEchoSetMonteCarlo(
            {
                characterRuntimeStates,
                charId,
                activeCharacter,
                entry,
                levelData,
            },
            randGen.iterations,
            randGen.bias,
            randGen.targetEnergyRegen,
            baseCharacterState,
            randGen.rollQuality,
            mergedBuffs,
            echoData,
            skill.statWeight ?? skill.custSkillMeta?.statWeight ?? {},
            Date.now(),
            randGen.mainEcho?.cost,
            (progress) => {
                self.postMessage({ type: 'progress', progress });
            }
        );

        const newEchoes = buildMultipleRandomEchoes(
            result.echoes.map((e) => ({
                cost: e.cost,
                mainStats: e.mainStats,
                subStats: e.subStats,
            })),
            randGen.setId,
            randGen.mainEcho?.id
        );

        self.postMessage({ type: 'result', builtEchoes: newEchoes });
    } catch (err) {
        self.postMessage({ type: 'error', message: err.message });
    }
};