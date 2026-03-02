import {prepareGpuContext} from "@/features/optimizer/core/context/gpuContext.js";
import {getSetPlanFromEchoes, removeSetEffectsFromBuffs} from "@/data/buffs/setEffect.js";
import {flipOn, removeSpecialBuffs} from "@/features/optimizer/core/context/echoContext.js";
import {buildRotationTargets} from "@/features/optimizer/core/engine/rotationOptimizer.js";
import {getSkillData} from "@shared/utils/computeSkillDamage.js";

export function generateSetPlanContext(form) {
    const charId = form.charId;
    const runtime = form.characterRuntimeStates[charId];
    let toggles = 0;
    const currentSetPlan = getSetPlanFromEchoes(form.equippedEchoes);
    const withoutSetEffects = removeSetEffectsFromBuffs(
        removeSpecialBuffs(form.mergedBuffs, structuredClone(form.mergedBuffs), charId, runtime.activeStates, form.sequence, form.skillType),
        currentSetPlan, runtime, form.skillType);

    if (Number(charId) === 1209) {
        const buffs = withoutSetEffects;
        const original = form.mergedBuffs;
        const erOver = Math.max(0, buffs.energyRegen);
        const dmgBonus = runtime.activeStates.interferedMarker ?
            Math.min(original.energyRegen * .25, 40) : 0;
        if (runtime.activeStates.interferedMarker) {
            buffs.dmgBonus = (buffs.dmgBonus ?? 0) - dmgBonus;
            toggles = flipOn(toggles, 0);
        }
        const bonusCr = Math.min(erOver * .5, 80);
        const bonusCd = Math.min((erOver), 160);
        if (form.levelData.label.includes('Critical Protocol DMG')) {
            buffs.critRate -= bonusCr;
            buffs.critDmg -= bonusCd;
        }
    }

    if (Number(charId) === 1206) if (runtime.activeStates.myMoment) toggles = flipOn(toggles, 0);

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
        mergedBuffs: withoutSetEffects,
        sequence: form.sequence,
        enemyProfile: form.enemyProfile,
        toggles
    };

    return {...prepareGpuContext({
            ...raw,
            mergedBuffsWithoutEchoes: raw.mergedBuffs,
        }), charId: Number(charId)
    };
}

/**
 * Build rotation contexts for set plan suggestions - one context per rotation skill
 * Returns array of { ctx, weight } entries
 */
export function generateRotationSetPlanContexts(form) {
    const { rotationEntries, skillResults, allSkillLevels } = form;

    const targets = buildRotationTargets({
        rotationEntries,
        skillResults,
        allSkillLevels,
    });

    if (!targets.length) return null;

    const charId = form.charId;
    const runtime = form.characterRuntimeStates[charId];
    let toggles = 0;
    const currentSetPlan = getSetPlanFromEchoes(form.equippedEchoes);
    const withoutSetEffects = removeSetEffectsFromBuffs(
        removeSpecialBuffs(form.mergedBuffs, structuredClone(form.mergedBuffs), charId, runtime.activeStates, form.sequence, form.skillType),
        currentSetPlan, runtime, form.skillType);

    if (Number(charId) === 1209) {
        const buffs = withoutSetEffects;
        const original = form.mergedBuffs;
        const erOver = Math.max(0, buffs.energyRegen);
        const dmgBonus = runtime.activeStates.interferedMarker ?
            Math.min(original.energyRegen * .25, 40) : 0;
        if (runtime.activeStates.interferedMarker) {
            buffs.dmgBonus = (buffs.dmgBonus ?? 0) - dmgBonus;
            toggles = flipOn(toggles, 0);
        }
        const bonusCr = Math.min(erOver * .5, 80);
        const bonusCd = Math.min((erOver), 160);
        if (form.levelData.label.includes('Critical Protocol DMG')) {
            buffs.critRate -= bonusCr;
            buffs.critDmg -= bonusCd;
        }
    }

    if (Number(charId) === 1206) if (runtime.activeStates.myMoment) toggles = flipOn(toggles, 0);

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
            mergedBuffs: withoutSetEffects,
            skillType: target.skillType ?? form.skillType,
            sequence: form.sequence,
            enemyProfile: form.enemyProfile,
            toggles
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