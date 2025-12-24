import { getSkillData } from "@/utils/computeSkillDamage.js";
import { generateEchoContext } from "@/features/optimizer/core/echoOptimizerContext.js";
import { prepareGpuContext } from "@/features/optimizer/core/prepareGpuContext.js";
import { createCpuScratch } from "@/features/optimizer/core/cpu/scratch.js";
import { packOptimizerContext } from "@/features/optimizer/core/shared/packContext.js";
import { OPTIMIZER_ECHOS_PER_COMBO } from "@/features/optimizer/core/optimizerConfig.js";
import { getDefaultMainStatFilter } from "@/features/optimizer/core/optimizerUtils.js";
import { buildCostPlans, buildMainStatCombinations } from "./lib/combinations.js";
import { DEFAULT_RESULTS_LIMIT, TRIES_PER_COMBO } from "./lib/constants.js";
import { applyErPlanToEchoes } from "./lib/energyRegen.js";
import { buildEchoSetForCombination } from "./lib/echoSetBuilder.js";
import { buildZeroMainEchoBuffs, evaluateEchoSet } from "./lib/evaluation.js";
import { pickUniqueLoadoutResults } from "./lib/signatures.js";
import {buildMultipleRandomEchoes} from "@/utils/echoHelper.js";
import {applyEchoSetBuffLogic, applySetEffect, applyTheoreticalMainEchoBuffs} from "@/data/buffs/setEffect.js";

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

    const context = {
        ...form,
        getSkillData,
    };

    const statWeight = context.statWeight ?? {};

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
    /*const progressTotal = Math.max(
        1,
        costPlans.reduce(
            (sum, plan) =>
                sum +
                buildMainStatCombinations(plan, mainStatFilter).length *
                    triesPerCombo,
            0,
        ),
    );*/

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

                const dmg = evaluateEchoSet({
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
