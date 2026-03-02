import { getSkillData } from "@shared/utils/computeSkillDamage.js";
import { generateEchoContext } from "@/features/optimizer/core/context/echoContext.js";
import { prepareGpuContext } from "@/features/optimizer/core/context/gpuContext.js";
import { createCpuScratch } from "@/features/optimizer/core/cpu/scratch.js";
import { packOptimizerContext } from "@/features/optimizer/core/context/pack.js";
import { OPTIMIZER_ECHOS_PER_COMBO } from "@/features/optimizer/core/misc/index.js";
import { getDefaultMainStatFilter } from "@/features/optimizer/core/misc/utils.js";
import { buildCostPlans, buildMainStatCombinations } from "./lib/combinations.js";
import { DEFAULT_RESULTS_LIMIT, TRIES_PER_COMBO } from "./lib/constants.js";
import { applyErPlanToEchoes } from "./lib/energyRegen.js";
import { buildEchoSetForCombination } from "./lib/echoSetBuilder.js";
import { buildZeroMainEchoBuffs, evaluateEchoSet } from "./lib/evaluation.js";
import { pickUniqueLoadoutResults } from "./lib/signatures.js";
import {buildMultipleRandomEchoes} from "@shared/utils/echoHelper.js";
import {applyEchoSetBuffLogic, applySetEffect, applyTheoreticalMainEchoBuffs} from "@/data/buffs/setEffect.js";
import {buildRotationTargets} from "@/features/optimizer/core/engine/rotationOptimizer.js";

/**
 * Build merged statWeight from all rotation skills
 * Combines stat preferences weighted by actual damage contribution percentage
 * Bias controls how much weight concentrates on top contributors:
 *   - bias 0: weights proportional to damage contribution
 *   - bias 1: only the top contributor(s) matter
 */
function buildRotationStatWeight(form, bias = 0.5) {
    const { rotationEntries, skillResults } = form;

    const targets = buildRotationTargets({
        rotationEntries,
        skillResults,
        allSkillLevels: form.allSkillLevels,
    });

    if (!targets.length) return form.statWeight ?? {};

    // First pass: calculate each skill's damage contribution
    const skillData = [];
    let totalDamage = 0;

    for (const target of targets) {
        const skill = (skillResults ?? []).find(
            (s) => s?.name === target.label && s?.tab === target.tab
        );
        const skillStatWeight = skill?.statWeight ?? skill?.custSkillMeta?.statWeight ?? {};
        const n = target.n ?? 1;
        const avgDamage = skill?.avg ?? 0;
        const damageContribution = avgDamage * n;

        skillData.push({ skillStatWeight, damageContribution });
        totalDamage += damageContribution;
    }

    // Fallback if no damage data available
    if (totalDamage <= 0) {
        totalDamage = skillData.length;
        for (const data of skillData) {
            data.damageContribution = 1;
        }
    }

    const exponent = bias * 10;
    let scaledTotal = 0;

    for (const data of skillData) {
        const pct = data.damageContribution / totalDamage;
        data.scaledWeight = Math.pow(pct, exponent);
        scaledTotal += data.scaledWeight;
    }

    // Second pass: merge stat weights using scaled weights
    const merged = {};
    for (const { skillStatWeight, scaledWeight } of skillData) {
        const weight = scaledWeight / scaledTotal;

        for (const [stat, value] of Object.entries(skillStatWeight)) {
            merged[stat] = (merged[stat] ?? 0) + value * weight;
        }
    }

    return merged;
}

function buildRotationPackedContexts(form, mergedBuffs) {
    const { rotationEntries, skillResults, allSkillLevels, charId } = form;

    const targets = buildRotationTargets({
        rotationEntries,
        skillResults,
        allSkillLevels,
    });

    if (!targets.length) return null;

    const contexts = [];
    for (const target of targets) {
        const entry = {
            label: target.levelData?.Name ?? target.levelData?.label ?? target.label,
            detail: target.levelData?.Type ?? target.tab,
            tab: target.tab,
        };

        const context = {
            ...form,
            entry,
            levelData: target.levelData,
            skillType: target.skillType ?? form.skillType,
            mergedBuffs,
            getSkillData,
        };

        const ctxObj = prepareGpuContext(generateEchoContext(context));
        const packedContext = packOptimizerContext({
            ...ctxObj,
            comboCount: 1,
            charId: Number(charId),
            lockedEchoIndex: -1,
        });

        // Use hit count (n) for evaluation so damage totals are correct
        contexts.push({
            packedContext,
            weight: target.n ?? 1,
        });
    }

    return contexts;
}

function evaluateRotationEchoSet({
    echoes,
    constraints,
    scratch,
    mainEchoBuffs,
    rotationContexts,
    combos,
}) {
    let totalWeightedDamage = 0;

    for (const { packedContext, weight } of rotationContexts) {
        const dmg = evaluateEchoSet({
            echoes,
            constraints,
            scratch,
            mainEchoBuffs,
            packedContext,
            combos,
        });

        totalWeightedDamage += dmg * weight;
    }

    // Sum of (damage * multiplier) to match buildRotationBreakdown totals
    return totalWeightedDamage;
}

export async function runEchoGenerator({
                                           form,
                                           resultsLimit = DEFAULT_RESULTS_LIMIT,
                                           bias = 0.5,
                                           rollQuality = 0.5,
                                           targetEnergyRegen = 0,
                                           mainEcho = null,
                                           setId = null,
                                       }) {
    void setId;

    const runtime = form.characterRuntimeStates[form.charId];
    let mergedBuffs = structuredClone(form.mergedBuffs);
    if (setId?.length > 0) mergedBuffs = applySetEffect({
        mergedBuffs,
        characterState: {
            activeStates: runtime?.activeStates ?? {}
        },
        combatState: runtime.CombatState,
        setCounts: setId
    })

    if (setId?.length > 0) mergedBuffs = applyEchoSetBuffLogic({
        mergedBuffs,
        setCounts: setId
    })

    if (mainEcho) mergedBuffs = applyTheoreticalMainEchoBuffs({
        mergedBuffs,
        echoId: mainEcho.id,
        charId: form.charId
    })

    form.mergedBuffs = mergedBuffs;

    const rotationMode = form.rotationMode && form.rotationEntries?.length > 0;
    const rotationContexts = rotationMode
        ? buildRotationPackedContexts(form, mergedBuffs)
        : null;

    const context = {
        ...form,
        getSkillData,
    };

    // Use merged statWeight from all rotation skills when in rotation mode
    const statWeight = rotationMode
        ? buildRotationStatWeight(form, bias)
        : (context.statWeight ?? {});

    const ctxObj = prepareGpuContext(generateEchoContext(context));

    const requiredCost = mainEcho?.cost;
    const costPlans = buildCostPlans(requiredCost);
    const mainStatFilter = getDefaultMainStatFilter(
        statWeight,
        context.charId,
    );

    const scratch = createCpuScratch();

    const combos = new Int32Array(OPTIMIZER_ECHOS_PER_COMBO);
    for (let i = 0; i < OPTIMIZER_ECHOS_PER_COMBO; i++) combos[i] = i;

    const packedContext = packOptimizerContext({
        ...ctxObj,
        comboCount: 1,
        charId: context.charId,
        lockedEchoIndex: -1,
    });

    const mainEchoBuffs = buildZeroMainEchoBuffs(
        OPTIMIZER_ECHOS_PER_COMBO,
    );

    const triesPerCombo = TRIES_PER_COMBO;

    const results = [];

    for (const costPlan of costPlans) {
        const combinations = buildMainStatCombinations(
            costPlan,
            mainStatFilter,
        );
        for (const combination of combinations) {
            let bestValue = 0;
            let bestEchoes = null;

            for (let attempt = 0; attempt < triesPerCombo; attempt++) {
                const echoes = buildEchoSetForCombination({
                    combination,
                    costPlan,
                    bias,
                    rollQuality,
                    statWeight,
                });

                const echoesWithEr = applyErPlanToEchoes({
                    echoes,
                    targetEnergyRegen,
                    rollQuality,
                    statWeight,
                });

                const dmg = rotationContexts?.length
                    ? evaluateRotationEchoSet({
                        echoes: echoesWithEr,
                        constraints: null,
                        scratch,
                        mainEchoBuffs,
                        rotationContexts,
                        combos,
                    })
                    : evaluateEchoSet({
                        echoes: echoesWithEr,
                        constraints: null,
                        scratch,
                        mainEchoBuffs,
                        packedContext,
                        combos,
                    });

                if (dmg > bestValue) {
                    bestValue = dmg;
                    bestEchoes = echoesWithEr;
                }
            }

            if (bestEchoes) {
                results.push({
                    value: bestValue,
                    echoes: bestEchoes,
                });
            }
        }
    }

    const targetCount = Math.max(5, resultsLimit);
    const sorted = results.sort((a, b) => b.value - a.value);
    const unique = pickUniqueLoadoutResults(sorted, targetCount);

    const mapped = unique.slice(0, targetCount).map((result) => {
        const baseEchoes = result.echoes ?? [];
        return {
            damage: result.value,
            echoes: buildMultipleRandomEchoes(
                baseEchoes,
                setId,
                mainEcho?.id
            ),
        };
    });

    return { results: mapped };
}
