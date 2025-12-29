import { prepareGpuContext } from "./prepareGpuContext.js";
import { generateEchoContext } from "./echoOptimizerContext.js";
import { packOptimizerContext } from "./shared/packContext.js";
import { computeDamageForCombo } from "./cpu/computeDamage.js";
import { createCpuScratch } from "./cpu/scratch.js";
import { OPTIMIZER_CTX_LOCKED_INDEX } from "./optimizerConfig.js";
import { getFinalStats } from "@/utils/getStatsForLevel.js";
import { computeSkillDamage, getSkillData } from "@/utils/computeSkillDamage.js";
import { getEchoStatsFromEquippedEchoes, getSetCounts } from "@/utils/echoHelper.js";
import {
    applyEchoSetBuffLogic,
    applyMainEchoBuffLogic,
    applySetEffect,
} from "@/data/buffs/setEffect.js";
import { applyEchoLogic } from "@/data/buffs/applyEchoLogic.js";
import { applyWeaponBuffLogic } from "@/data/buffs/weaponBuffs.js";
import { getBuffsLogic, getCharacterOverride } from "@/data/characters/behavior/index.js";
import { getWeaponOverride } from "@/data/weapons/behavior/index.js";

function findLevelData(allSkillLevels, tab, label) {
    const levelList = allSkillLevels?.[tab];
    if (!Array.isArray(levelList)) return null;
    return (
        levelList.find((l) => l?.label === label || l?.Name === label) ??
        levelList.find((l) => l?.label?.includes?.(label) || l?.Name?.includes?.(label)) ??
        null
    );
}

export function buildRotationTargets({ rotationEntries, skillResults, allSkillLevels }) {
    const targets = [];
    for (const entry of rotationEntries ?? []) {
        if (!entry || entry.type === "block" || entry.disabled) continue;
        if (entry.tab === "echoAttacks"
            || entry.tab === "negativeEffect") continue;

        const levelData = findLevelData(allSkillLevels, entry.tab, entry.label);
        if (!levelData) continue;

        const skill = (skillResults ?? []).find(
            (s) => s?.name === entry.label && s?.tab === entry.tab
        );
        if (!skill || skill.visible === false || skill.isSupportSkill) continue;

        targets.push({
            tab: entry.tab,
            label: entry.label,
            n: entry.multiplier ?? 1,
            entry,
            levelData,
            skillType: skill.skillType,
        });
    }

    return targets;
}

function normalizeRotationConstraints(encodedConstraints) {
    if (!encodedConstraints) return null;
    const copy = new Float32Array(encodedConstraints);
    if (copy.length >= 16) {
        copy[14] = -Infinity;
        copy[15] = Infinity;
    }
    return copy;
}

function buildRotationContextForTarget({ form, target, lockedIndex }) {
    const entry = {
        label: target.levelData?.Name ?? target.levelData?.label ?? target.label,
        detail: target.levelData?.Type ?? target.tab,
        tab: target.tab,
    };
    const ctx = prepareGpuContext(
        generateEchoContext({
            ...form,
            entry,
            levelData: target.levelData,
            skillType: target.skillType ?? form.skillType,
        })
    );
    const packedContext = packOptimizerContext({
        ...ctx,
        charId: form.charId,
        comboCount: 1,
        lockedEchoIndex: lockedIndex,
        comboMode: 0,
        comboN: 0,
        comboMaxCost: 0,
        comboK: 0,
        comboBaseIndex: 0,
    });
    return { target, packedContext };
}

export function buildRotationContexts({ targets, form, lockedIndex = -1 }) {
    return targets.map((target) =>
        buildRotationContextForTarget({ form, target, lockedIndex })
    );
}

function mergeBuffTrees(target, source) {
    if (!source || typeof source !== "object") return target;
    if (!target || typeof target !== "object") return structuredClone(source);

    for (const [key, value] of Object.entries(source)) {
        if (value == null) continue;

        if (typeof value === "number") {
            const prev = Number(target[key] ?? 0);
            target[key] = prev + value;
            continue;
        }

        if (typeof value === "object" && !Array.isArray(value)) {
            if (typeof target[key] !== "object" || target[key] === null) {
                target[key] = {};
            }
            mergeBuffTrees(target[key], value);
            continue;
        }

        target[key] = value;
    }

    return target;
}

function buildMergedBuffsForCombo({ form, echoObjs, runtimeOverride }) {
    let merged = structuredClone(form.mergedBuffs ?? {});

    const teamIds = runtimeOverride?.[form.charId]?.Team ?? [];
    for (const [index, id] of teamIds.entries()) {
        if (!id || index === 0) continue;
        const buffsLogic = getBuffsLogic(id);
        if (!buffsLogic) continue;

        const result = buffsLogic({
            mergedBuffs: merged,
            characterState: {
                activeStates: runtimeOverride?.[form.charId]?.activeStates ?? {},
            },
            activeCharacter: form.activeCharacter,
            combatState: runtimeOverride?.[form.charId]?.CombatState,
        });
        if (result?.mergedBuffs) merged = result.mergedBuffs;
    }

    const weaponOverride = getWeaponOverride(runtimeOverride?.[form.charId]?.CombatState?.weaponId);
    if (weaponOverride?.applyWeaponLogic) {
        const currentParamValues =
            runtimeOverride?.[form.charId]?.CombatState?.weaponParam?.map(
                p => p?.[Math.min(Math.max((runtimeOverride?.[form.charId]?.CombatState?.weaponRank ?? 1) - 1, 0), 4)]
            ) ?? [];

        const characterState = {
            activeStates: runtimeOverride?.[form.charId]?.activeStates ?? {},
            toggles: runtimeOverride?.[form.charId]?.sequenceToggles ?? {},
        };
        const isToggleActive = (toggleId) =>
            characterState?.toggles?.[toggleId] === true;

        const result = weaponOverride.applyWeaponLogic({
            mergedBuffs: merged,
            combatState: runtimeOverride?.[form.charId]?.CombatState,
            currentParamValues,
            characterState,
            isToggleActive,
            skillMeta: {},
            baseCharacterState: form.baseCharacterState,
            activeCharacter: form.activeCharacter,
        });
        if (result?.mergedBuffs) merged = result.mergedBuffs;
    }

    merged = applyWeaponBuffLogic({
        mergedBuffs: merged,
        characterState: {
            activeStates: runtimeOverride?.[form.charId]?.activeStates ?? {},
        },
        activeCharacter: form.activeCharacter,
    });

    merged = applyEchoLogic({
        mergedBuffs: merged,
        characterState: {
            activeStates: runtimeOverride?.[form.charId]?.activeStates ?? {},
        },
    });

    const echoStats = getEchoStatsFromEquippedEchoes(echoObjs) || {};
    mergeBuffTrees(merged, echoStats);

    const setCounts = getSetCounts(echoObjs);
    merged = applyEchoSetBuffLogic({
        mergedBuffs: merged,
        activeCharacter: form.activeCharacter,
        setCounts,
    });
    merged = applySetEffect({
        characterState: {
            activeStates: runtimeOverride?.[form.charId]?.activeStates ?? {},
        },
        activeCharacter: form.activeCharacter,
        mergedBuffs: merged,
        combatState: runtimeOverride?.[form.charId]?.CombatState,
        setCounts,
    });

    merged = applyMainEchoBuffLogic({
        equippedEchoes: echoObjs,
        mergedBuffs: merged,
        characterState: {
            activeStates: runtimeOverride?.[form.charId]?.activeStates ?? {},
        },
        activeCharacter: form.activeCharacter,
        combatState: runtimeOverride?.[form.charId]?.CombatState,
        charId: form.charId,
    });

    const havocBane = runtimeOverride?.[form.charId]?.CombatState?.havocBane ?? 0;
    if (!merged.attribute) merged.attribute = {};
    if (!merged.attribute.all) merged.attribute.all = {};
    merged.attribute.all.defIgnore = (merged.attribute.all.defIgnore ?? 0) + 2 * havocBane;

    const overrideLogic = getCharacterOverride(
        form.activeCharacter?.Id ?? form.activeCharacter?.id ?? form.activeCharacter?.link
    );
    if (overrideLogic && typeof overrideLogic === "function") {
        const characterState = {
            activeStates: runtimeOverride?.[form.charId]?.activeStates ?? {},
            toggles: runtimeOverride?.[form.charId]?.sequenceToggles ?? {},
        };
        const sequenceLevel = runtimeOverride?.[form.charId]?.SkillLevels?.sequence ?? 0;
        const isActiveSequence = (seqNum) => sequenceLevel >= seqNum;
        const isToggleActive = (toggleId) => characterState?.toggles?.[toggleId] === true;

        const result = overrideLogic({
            mergedBuffs: merged,
            combatState: runtimeOverride?.[form.charId]?.CombatState,
            characterState,
            isActiveSequence,
            isToggleActive,
            skillMeta: {},
            baseCharacterState: form.baseCharacterState,
            sliderValues: runtimeOverride?.[form.charId]?.SkillLevels,
            characterLevel: runtimeOverride?.[form.charId]?.CharacterLevel,
        });
        if (result?.mergedBuffs) merged = result.mergedBuffs;
    }

    return merged;
}

function resolveEchoesFromIds(ids, echoes) {
    const out = [];
    for (let i = 0; i < ids.length; i++) {
        const idx = ids[i];
        if (idx == null || idx < 0) continue;
        const echo = echoes?.[idx];
        if (echo) out.push(echo);
    }
    while (out.length < 5) out.push(null);
    return out;
}

function evaluateRotationAccurate({
    comboIds,
    rotationTargets,
    form,
    echoes,
}) {
    if (!comboIds || comboIds.length === 0) {
        return { total: 0, byTarget: [] };
    }

    const echoObjs = resolveEchoesFromIds(comboIds, echoes);
    const runtimeEntry = form.characterRuntimeStates?.[form.charId] ?? {};
    const runtimeOverride = {
        ...(form.characterRuntimeStates ?? {}),
        [form.charId]: {
            ...runtimeEntry,
            equippedEchoes: echoObjs,
        },
    };

    const mergedBuffs = buildMergedBuffsForCombo({
        form,
        echoObjs,
        runtimeOverride,
    });

    const finalStats = getFinalStats(
        form.activeCharacter,
        form.baseCharacterState,
        runtimeOverride?.[form.charId]?.CharacterLevel,
        mergedBuffs,
        runtimeOverride?.[form.charId]?.CombatState
    );

    const byTarget = [];
    let total = 0;

    for (const target of rotationTargets) {
        const entry = {
            label: target.levelData?.Name ?? target.levelData?.label ?? target.label,
            detail: target.levelData?.Type ?? target.tab,
            tab: target.tab,
        };

        const result = computeSkillDamage({
            entry,
            levelData: target.levelData,
            activeCharacter: form.activeCharacter,
            characterRuntimeStates: runtimeOverride,
            finalStats,
            combatState: runtimeOverride?.[form.charId]?.CombatState,
            mergedBuffs,
            sliderValues: runtimeOverride?.[form.charId]?.SkillLevels,
            characterLevel: runtimeOverride?.[form.charId]?.CharacterLevel,
            getSkillData,
        });

        const dmg = result?.avg ?? 0;
        const weighted = dmg * (target.n ?? 0);
        total += weighted;
        byTarget.push({
            tab: target.tab,
            label: target.label,
            n: target.n,
            damage: dmg,
            weighted,
        });
    }

    return { total, byTarget };
}

export function evaluateRotationForCombo({
    comboIds,
    rotationContexts,
    encoded,
    mainEchoBuffs,
    echoKindIds,
    rotationConstraints,
}) {
    if (!comboIds || comboIds.length === 0) {
        return { total: 0, byTarget: [] };
    }

    const combos = new Int32Array(5);
    for (let i = 0; i < 5; i++) {
        combos[i] = comboIds[i] ?? -1;
    }

    const scratch = createCpuScratch();
    const candidates = new Set();
    const firstCtx = rotationContexts[0]?.packedContext;
    const lockedIndex = firstCtx ? (firstCtx[OPTIMIZER_CTX_LOCKED_INDEX] | 0) : -1;

    if (lockedIndex >= 0) {
        candidates.add(lockedIndex);
    } else {
        for (let i = 0; i < combos.length; i++) {
            const id = combos[i];
            if (id >= 0) candidates.add(id);
        }
    }

    let bestTotal = 0;
    let bestByTarget = [];

    for (const mainId of candidates) {
        let total = 0;
        const byTarget = [];

        for (const { target, packedContext } of rotationContexts) {
            const prevLocked = packedContext[OPTIMIZER_CTX_LOCKED_INDEX];
            packedContext[OPTIMIZER_CTX_LOCKED_INDEX] = mainId;

            const { dmg } = computeDamageForCombo({
                index: 0,
                combos,
                packedContext,
                encoded,
                mainEchoBuffs,
                echoKindIds,
                statConstraints: rotationConstraints,
                scratch,
            });

            packedContext[OPTIMIZER_CTX_LOCKED_INDEX] = prevLocked;

            const weighted = (dmg ?? 0) * (target.n ?? 0);
            total += weighted;
            byTarget.push({
                tab: target.tab,
                label: target.label,
                n: target.n,
                damage: dmg ?? 0,
                weighted,
            });
        }

        if (total > bestTotal) {
            bestTotal = total;
            bestByTarget = byTarget;
        }
    }

    return { total: bestTotal, byTarget: bestByTarget };
}

export function scoreComboForRotation({
    comboIds,
    rotationTargets,
    form,
    echoes,
}) {
    return evaluateRotationAccurate({
        comboIds,
        rotationTargets,
        form,
        echoes,
    });
}

export function rerankResultsForRotation({
    results,
    rotationTargets,
    form,
    echoes,
}) {
    if (!Array.isArray(results) || results.length === 0) {
        return [];
    }

    const scored = results.map((res) => {
        const comboIds = res.ids ?? [];
        const rotationScore = evaluateRotationAccurate({
            comboIds,
            rotationTargets,
            form,
            echoes,
        });
        return {
            ...res,
            rotationTotal: rotationScore.total,
            rotationBreakdown: rotationScore.byTarget,
        };
    });

    scored.sort((a, b) => (b.rotationTotal ?? 0) - (a.rotationTotal ?? 0));
    return scored;
}

export function buildRotationRerankInputs({
    rotationEntries,
    skillResults,
    allSkillLevels,
    form,
    lockedIndex = -1,
    encodedConstraints,
    echoes,
}) {
    const targets = buildRotationTargets({
        rotationEntries,
        skillResults,
        allSkillLevels,
    });

    const rotationContexts = buildRotationContexts({
        targets,
        form,
        lockedIndex,
    });

    const rotationConstraints = normalizeRotationConstraints(encodedConstraints);

    const baseContext = generateEchoContext(form);
    const baseBuffsWithoutEchoes = baseContext.mergedBuffsWithoutEchoes ?? {};

    return {
        targets,
        rotationContexts,
        rotationConstraints,
        baseBuffsWithoutEchoes,
        echoes,
    };
}
