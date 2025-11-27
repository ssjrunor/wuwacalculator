import {prepareGpuContext} from "../../optimizer/prepareGpuContext.js";
import {getDefaultMainStatFilter} from "../../optimizer/optimizerUtils.js";
import {applyFixedSecondMainStat, getValidMainStats} from "../../utils/echoHelper.js";
import {removeSpecialBuffs} from "../../optimizer/echoOptimizerContext.js";

export function generateMainStatsContext(form) {
    const charId = form.charId;
    const runtime = form.characterRuntimeStates[charId];
    const withoutMainStats = removeMainStatsFromBuffs(
        removeSpecialBuffs(form.mergedBuffs, {...form.mergedBuffs}, charId, runtime.activeStates, form.sequence),
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

export function removeMainStatsFromBuffs(mergedBuffs, echoData) {
    if (!mergedBuffs || !Array.isArray(echoData)) return mergedBuffs ?? {};

    const newBuffs = { ...mergedBuffs };
    const totalMainStats = {};

    // Accumulate all mainStats per statKey
    for (const echo of echoData) {
        if (!echo || !echo.mainStats) continue;

        for (const [key, value] of Object.entries(echo.mainStats)) {
            if (value == null) continue;
            totalMainStats[key] = (totalMainStats[key] ?? 0) + Number(value);
        }
    }

    // Subtract from mergedBuffs
    for (const [key, value] of Object.entries(totalMainStats)) {
        const current = Number(newBuffs[key] ?? 0);
        const result = current - value;

        // Clean up near-zero noise
        if (Math.abs(result) < 1e-6) {
            delete newBuffs[key];
        } else {
            newBuffs[key] = result;
        }
    }

    return newBuffs;
}

export function buildMainStatPoolForSuggestor({ statWeight = {}, charId = null, mainStatFilter = null }) {
    const costs = [1, 3, 4];
    const pool = [];

    // If no explicit filter passed, derive one from statWeight + charId
    const filter = mainStatFilter ?? getDefaultMainStatFilter(statWeight, charId);

    for (const cost of costs) {
        const valid = getValidMainStats(cost); // e.g. { atkPercent: 33, critRate: 22, ... }

        for (const [key, value] of Object.entries(valid)) {
            // Skip stats that are not marked useful for this character
            if (filter && !filter[key]) continue;

            // Build full mainStats for this echo: primary + fixed second stat
            const mainStats = applyFixedSecondMainStat({ [key]: value }, cost);
            // mainStats now includes e.g. { atkPercent: 33, atkFlat: 150 }

            pool.push({
                cost,
                key,
                value,
                stats: mainStats,   // full stats bundle this main stat gives
            });
        }
    }

    return pool;
}