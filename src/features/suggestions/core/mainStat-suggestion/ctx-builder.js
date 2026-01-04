import {prepareGpuContext} from "@/features/optimizer/core/context/gpuContext.js";
import {getDefaultMainStatFilter} from "@/features/optimizer/core/misc/utils.js";
import {applyFixedSecondMainStat, getValidMainStats, removeMainStatsFromBuffs} from "@/utils/echoHelper.js";
import {removeSpecialBuffs} from "@/features/optimizer/core/context/echoContext.js";
import {buildRotationTargets} from "@/features/optimizer/core/engine/rotationOptimizer.js";
import {getSkillData} from "@/utils/computeSkillDamage.js";

export function generateMainStatsContext(form) {
    const charId = form.charId;
    const runtime = form.characterRuntimeStates[charId];
    const withoutMainStats = removeMainStatsFromBuffs(
        removeSpecialBuffs(form.mergedBuffs, structuredClone(form.mergedBuffs), charId, runtime.activeStates, form.sequence, form.skillType),
        form.equippedEchoes
    );

    if (Number(charId) === 1209) {
        const buffs = withoutMainStats;
        const original = form.mergedBuffs;
        const erOver = Math.max(0, buffs.energyRegen);
        const dmgVuln = runtime.activeStates.interferedMarker ?
            Math.min(original.energyRegen * .25, 40) : 0;
        buffs.attribute.all.dmgVuln = (buffs.attribute?.all?.dmgVuln ?? 0) - dmgVuln;
        const bonusCr = Math.min(erOver * .5, 80);
        const bonusCd = Math.min((erOver), 160);
        if (form.levelData.label.includes('Critical Protocol DMG')) {
            buffs.critRate -= bonusCr;
            buffs.critDmg -= bonusCd;
        }
    }

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
        getSkillData,
        mergedBuffs: withoutMainStats,
        sequence: form.sequence,
    };

    return {...prepareGpuContext({
              ...raw,
              mergedBuffsWithoutEchoes: raw.mergedBuffs,
          }), charId: Number(charId)
    };
}

/**
 * Build rotation contexts for suggestions - one context per rotation skill
 * Returns array of { ctx, weight } entries
 */
export function generateRotationContexts(form) {
    const { rotationEntries, skillResults, allSkillLevels } = form;

    const targets = buildRotationTargets({
        rotationEntries,
        skillResults,
        allSkillLevels,
    });

    if (!targets.length) return null;

    const charId = form.charId;
    const runtime = form.characterRuntimeStates[charId];
    const withoutMainStats = removeMainStatsFromBuffs(
        removeSpecialBuffs(form.mergedBuffs, structuredClone(form.mergedBuffs), charId, runtime.activeStates, form.sequence, form.skillType),
        form.equippedEchoes
    );

    if (Number(charId) === 1209) {
        const buffs = withoutMainStats;
        const original = form.mergedBuffs;
        const erOver = Math.max(0, buffs.energyRegen);
        const dmgVuln = runtime.activeStates.interferedMarker ?
            Math.min(original.energyRegen * .25, 40) : 0;
        buffs.attribute.all.dmgVuln = (buffs.attribute?.all?.dmgVuln ?? 0) - dmgVuln;
        const bonusCr = Math.min(erOver * .5, 80);
        const bonusCd = Math.min((erOver), 160);
        if (form.levelData.label.includes('Critical Protocol DMG')) {
            buffs.critRate -= bonusCr;
            buffs.critDmg -= bonusCd;
        }
    }

    const contexts = [];
    for (const target of targets) {
        const entry = {
            label: target.levelData?.Name ?? target.levelData?.label ?? target.label,
            detail: target.levelData?.Type ?? target.tab,
            tab: target.tab,
        };

        const raw = {
            charId,
            activeCharacter: form.activeCharacter,
            baseCharacterState: form.baseCharacterState,
            characterLevel: form.characterRuntimeStates?.[charId]?.CharacterLevel,
            characterRuntimeStates: form.characterRuntimeStates,
            combatState: form.characterRuntimeStates?.[charId]?.CombatState,
            entry,
            levelData: target.levelData,
            sliderValues: form.characterRuntimeStates?.[charId]?.SkillLevels,
            getSkillData,
            mergedBuffs: withoutMainStats,
            skillType: target.skillType ?? form.skillType,
            sequence: form.sequence,
        };

        const ctx = {
            ...prepareGpuContext({
                ...raw,
                mergedBuffsWithoutEchoes: raw.mergedBuffs,
            }),
            charId: Number(charId),
        };

        contexts.push({
            ctx,
            weight: target.n ?? 1,
            target,
        });
    }

    return contexts;
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