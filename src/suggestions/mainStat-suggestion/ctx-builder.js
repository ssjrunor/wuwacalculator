import {prepareGpuContext} from "../../optimizer/prepareGpuContext.js";
import {getDefaultMainStatFilter} from "../../optimizer/optimizerUtils.js";
import {applyFixedSecondMainStat, getValidMainStats} from "../../utils/echoHelper.js";
import {removeSpecialBuffs} from "../../optimizer/echoOptimizerContext.js";
import {applyStatToMerged} from "../../data/buffs/setEffect.js";

export function generateMainStatsContext(form) {
    const charId = form.charId;
    const runtime = form.characterRuntimeStates[charId];
    const withoutMainStats = removeMainStatsFromBuffs(
        removeSpecialBuffs(form.mergedBuffs, structuredClone(form.mergedBuffs), charId, runtime.activeStates, form.sequence, form.skillType),
        form.equippedEchoes
    );

    const raw = {
        charId,
        activeCharacter: form.activeCharacter,
        baseCharacterState: form.baseCharacterState,
        characterLevel: form.characterRuntimeStates?.[charId]?.CharacterLevel,
        characterRuntimeStates: form.characterRuntimeStates,
        combatState: form.characterRuntimeStates?.[charId]?.CombatState,
        entry: form.entry,
        levelData: form.levelData,
        sliderValues: form.characterRuntimeStates?.[charId]?.SkillLevels,
        getSkillData: form.getSkillData,
        mergedBuffs: withoutMainStats,
    };

    return {...prepareGpuContext({
              ...raw,
              mergedBuffsWithoutEchoes: raw.mergedBuffs,
          }), charId: Number(charId)
    };
}


// assuming applyStatToMerged is already imported in this file

export function removeMainStatsFromBuffs(mergedBuffs, echoData) {
    if (!mergedBuffs || !Array.isArray(echoData)) return mergedBuffs ?? {};

    const newBuffs = structuredClone(mergedBuffs);
    const totalMainStats = {};

    // 1) Accumulate all mainStats per key across echoes
    for (const echo of echoData) {
        if (!echo || !echo.mainStats) continue;

        for (const [key, value] of Object.entries(echo.mainStats)) {
            if (value == null) continue;
            totalMainStats[key] = (totalMainStats[key] ?? 0) + Number(value);
        }
    }

    // 2) Subtract them from the unified buff structure
    for (const [key, total] of Object.entries(totalMainStats)) {
        if (!total) continue;

        switch (key) {
            // flat stats → atk.flat / hp.flat / def.flat
            case 'atkFlat': {
                newBuffs.atk = newBuffs.atk ?? { percent: 0, flat: 0 };
                newBuffs.atk.flat = (newBuffs.atk.flat ?? 0) - total;
                break;
            }
            case 'hpFlat': {
                newBuffs.hp = newBuffs.hp ?? { percent: 0, flat: 0 };
                newBuffs.hp.flat = (newBuffs.hp.flat ?? 0) - total;
                break;
            }
            case 'defFlat': {
                newBuffs.def = newBuffs.def ?? { percent: 0, flat: 0 };
                newBuffs.def.flat = (newBuffs.def.flat ?? 0) - total;
                break;
            }

            default: {
                applyStatToMerged(newBuffs, key, -total);
                break;
            }
        }
    }

    return newBuffs;
}

export function buildMainStatPoolForSuggestor({ statWeight = {}, charId = null, mainStatFilter = null }) {
    const costs = [1, 3, 4];
    const pool = [];

    const filter = mainStatFilter ?? getDefaultMainStatFilter(statWeight, charId);

    for (const cost of costs) {
        const valid = getValidMainStats(cost);

        for (const [key, value] of Object.entries(valid)) {
            if (filter && !filter[key]) continue;

            const mainStats = applyFixedSecondMainStat({ [key]: value }, cost);

            pool.push({
                cost,
                key,
                value,
                stats: mainStats,
            });
        }
    }

    return pool;
}