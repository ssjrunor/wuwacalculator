import {
    prepareGpuContext,
    generateEchoContext,
    packOptimizerContext,
    ECHO_OPTIMIZER_JOB_TARGET_COMBOS_ROTATION_GPU,
    ECHO_OPTIMIZER_JOB_TARGET_COMBOS_CPU,
    ECHO_OPTIMIZER_MAX_COST,
    OPTIMIZER_CONTEXT_FLOATS,
    OPTIMIZER_ECHOS_PER_COMBO,
    initWorkerPool,
    runWorkerOnRotationIndexRange,
    runWorkerOnRotationBatch,
    setWorkerLockedEchoIndex,
    setWorkerRotationContext,
} from "../misc/index.js";
import {
    evaluatePreparedComboDamage,
    prepareComboDamageState,
    preparePackedDamageContext,
} from "../cpu/computeDamage.js";
import { createCpuScratch } from "../cpu/scratch.js";
import {
    createProgressTracker,
    createResultCollector,
    flushPendingBatches,
} from "./shared.js";
import { areConstraintsDisabled } from "../cpu/constraints.js";

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
        if (!skill || skill.visible === false || skill.isSupportSkill ||
            (skill.dmgType ?? skill.custSkillMeta?.dmgType) === "tuneBreak") continue;

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

function buildRotationContextForTarget({ form, target, lockedIndex, setRuntimeMask }) {
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
        setRuntimeMask,
        comboCount: 1,
        lockedEchoIndex: lockedIndex,
        comboMode: 0,
        comboN: 0,
        comboMaxCost: 0,
        comboK: 0,
        comboBaseIndex: 0,
    });

    return { target, packedContext, ctx };
}

// Find the rotation context with lowest critRate + critDmg (base stats)
function findBaseRotationContext(rotationContexts) {
    if (!rotationContexts.length) return null;

    let baseCtx = rotationContexts[0].ctx;
    let lowestSum = baseCtx.critRate + baseCtx.critDmg;

    for (let i = 1; i < rotationContexts.length; i++) {
        const ctx = rotationContexts[i].ctx;
        const sum = ctx.critRate + ctx.critDmg;
        if (sum < lowestSum) {
            lowestSum = sum;
            baseCtx = ctx;
        }
    }

    return baseCtx;
}

export function buildRotationContexts({ targets, form, lockedIndex = -1, setRuntimeMask }) {
    return targets.map((target) =>
        buildRotationContextForTarget({ form, target, lockedIndex, setRuntimeMask })
    );
}

export async function runRotationOptimizer({
    form,
    echoes,
    encoded,
    mainEchoBuffs,
    echoKindIds,
    comboIndexing,
    lockedIndices,
    lockedIndex,
    runCount,
    mainFactor,
    statConstraints,

    rotationEntries,
    skillResults,
    allSkillLevels,
    resultsLimit,
    combinations,
    onProgress,
    onContext,

    // Backend selection
    backend = "gpu",
    // For CPU: batch generator factory
    comboBatchGeneratorFactory,
}) {
    const targets = buildRotationTargets({
        rotationEntries,
        skillResults,
        allSkillLevels,
    });
    if (!targets.length) return [];

    const rotationContexts = buildRotationContexts({
        targets,
        form,
        lockedIndex,
        setRuntimeMask: encoded.setRuntimeMask,
    });
    const ctxCount = rotationContexts.length;
    if (!ctxCount) return [];

    // Find and report the base context (lowest CR+CD) for stat display
    if (onContext) {
        const baseCtx = findBaseRotationContext(rotationContexts);
        if (baseCtx) {
            onContext(baseCtx);
        }
    }

    // Pack contexts (shared for both backends)
    const ctxLen = rotationContexts[0]?.packedContext?.length ?? OPTIMIZER_CONTEXT_FLOATS;
    const packedContexts = new Float32Array(ctxCount * ctxLen);
    const weights = new Float32Array(ctxCount);
    for (let i = 0; i < ctxCount; i++) {
        const { target, packedContext } = rotationContexts[i];
        packedContexts.set(packedContext, i * ctxLen);
        weights[i] = target?.n ?? 1;
    }

    // Initialize workers and broadcast rotation contexts (shared for both backends)
    await initWorkerPool({
        encoded,
        mainEchoBuffs,
        echoKindIds,
        comboIndexing,
        backend,
    });
    setWorkerRotationContext({
        packedContexts,
        ctxLen,
        ctxCount,
        weights,
    });

    // Branch based on backend
    if (backend === "gpu") {
        return runRotationGpuPath({
            form,
            echoes,
            comboIndexing,
            lockedIndices,
            lockedIndex,
            mainFactor,
            statConstraints,
            resultsLimit,
            combinations,
            onProgress,
            ctxLen,
            ctxCount,
            runCount,
            rotationContexts,
            encoded,
            mainEchoBuffs,
            echoKindIds,
        });
    } else {
        return runRotationCpuPath({
            form,
            echoes,
            lockedIndices,
            lockedIndex,
            mainFactor,
            statConstraints,
            resultsLimit,
            combinations,
            onProgress,
            ctxLen,
            ctxCount,
            comboBatchGeneratorFactory,
            setRuntimeMask: encoded.setRuntimeMask,
        });
    }
}

// GPU path: uses indexed enumeration
async function runRotationGpuPath({
    form,
    echoes,
    comboIndexing,
    lockedIndices,
    lockedIndex,
    mainFactor,
    statConstraints,
    resultsLimit,
    combinations,
    onProgress,
    ctxLen,
    ctxCount,
    runCount,
    rotationContexts,
    encoded,
    mainEchoBuffs,
    echoKindIds,
}) {
    const comboCountPerRun = comboIndexing?.totalCombos ?? 0;
    const targetCombosPerJob = ECHO_OPTIMIZER_JOB_TARGET_COMBOS_ROTATION_GPU;
    const totalForProgress = combinations ?? (comboCountPerRun * mainFactor * runCount);
    const applyProgress = createProgressTracker({
        totalForProgress,
        mainFactor,
        onProgress,
    });

    // Keep a larger candidate pool to handle deduplication across batches
    const oversample = 8;
    const jobResultsLimit = Math.min(Math.max(resultsLimit * 2, resultsLimit), 65536);
    const resultCollector = createResultCollector({ resultsLimit, oversample });

    const lockedRuns =
        Array.isArray(lockedIndices) && lockedIndices.length
            ? lockedIndices
            : [-1];

    for (const runLockedIndex of lockedRuns) {
        if (runLockedIndex >= 0) {
            setWorkerLockedEchoIndex(runLockedIndex);
        }

        let start = 0;
        while (start < comboCountPerRun) {
            const count = Math.min(targetCombosPerJob, comboCountPerRun - start);
            const packedParams = packOptimizerContext({
                comboCount: count,
                comboMode: 2,
                comboN: comboIndexing.comboN,
                comboMaxCost: ECHO_OPTIMIZER_MAX_COST,
                comboK: comboIndexing.comboK,
                comboBaseIndex: start,
                lockedEchoIndex: runLockedIndex,
                charId: form.charId,
                setRuntimeMask: encoded.setRuntimeMask,
                sequence: form.sequence ?? 0,
            });

            const r = await runWorkerOnRotationIndexRange({
                comboStart: start,
                comboCount: count,
                packedContext: packedParams,
                ctxLen,
                ctxCount,
                resultsLimit: jobResultsLimit,
                encodedConstraints: statConstraints,
            });

            if (!r || r.cancelled) {
                return { cancelled: true, error: r?.error ?? null, results: [] };
            }

            if (r.topK) {
                for (const { dmg, ids } of r.topK) {
                    resultCollector.push({ dmg, ids });
                }
            }

            applyProgress(count);
            start += count;
        }
    }

    const gpuResults = resultCollector.toResults({ echoes, limit: resultsLimit });
    return alignRotationResultsWithCpu({
        results: gpuResults,
        rotationContexts,
        encoded,
        mainEchoBuffs,
        echoKindIds,
        statConstraints,
    });
}

// CPU path: uses batch-based enumeration
async function runRotationCpuPath({
    form,
    echoes,
    lockedIndices,
    lockedIndex,
    mainFactor,
    statConstraints,
    resultsLimit,
    combinations,
    onProgress,
    ctxLen,
    ctxCount,
    comboBatchGeneratorFactory,
    setRuntimeMask,
}) {
    const targetCombosPerJob = ECHO_OPTIMIZER_JOB_TARGET_COMBOS_CPU;
    const targetIntsPerJob = targetCombosPerJob * OPTIMIZER_ECHOS_PER_COMBO;

    const totalForProgress = combinations ?? 0;
    const applyProgress = createProgressTracker({
        totalForProgress,
        mainFactor,
        onProgress,
    });

    const oversample = 8;
    const jobResultsLimit = Math.min(Math.max(resultsLimit * 2, resultsLimit), 65536);
    const resultCollector = createResultCollector({ resultsLimit, oversample });

    const runOneJob = async (intsArray, runLockedIndex) => {
        const comboCount = (intsArray.length / OPTIMIZER_ECHOS_PER_COMBO) | 0;

        const packedContext = packOptimizerContext({
            comboCount,
            charId: form.charId,
            setRuntimeMask,
            lockedEchoIndex: runLockedIndex,
            comboMode: 0,
            comboN: 0,
            comboMaxCost: 0,
            comboK: 0,
            comboBaseIndex: 0,
            sequence: form.sequence ?? 0,
        });

        const combosBatch =
            (intsArray.byteOffset === 0 && intsArray.byteLength === intsArray.buffer.byteLength)
                ? intsArray
                : new Int32Array(intsArray);

        const r = await runWorkerOnRotationBatch({
            combosBatch,
            packedContext,
            ctxLen,
            ctxCount,
            resultsLimit: jobResultsLimit,
            encodedConstraints: statConstraints,
        });

        if (!r || r.cancelled) {
            return { cancelled: true, comboCount: 0 };
        }

        if (r.topK) {
            for (const { dmg, ids } of r.topK) {
                resultCollector.push({ dmg, ids });
            }
        }

        return { cancelled: false, comboCount };
    };

    const lockedRuns =
        Array.isArray(lockedIndices) && lockedIndices.length
            ? lockedIndices
            : [lockedIndex];

    let pending = [];
    let pendingInts = 0;

    const flushPending = async (runLockedIndex) => {
        const { cancelled, pending: newPending, pendingInts: newPendingInts } =
            await flushPendingBatches({
                pending,
                pendingInts,
                runJob: (merged) => runOneJob(merged, runLockedIndex),
                applyProgress,
            });

        pending = newPending;
        pendingInts = newPendingInts;

        return { cancelled };
    };

    for (const runLockedIndex of lockedRuns) {
        const gen = comboBatchGeneratorFactory
            ? comboBatchGeneratorFactory(runLockedIndex)
            : null;

        if (!gen) {
            console.warn("runRotationCpuPath: comboBatchGeneratorFactory returned null");
            continue;
        }

        for (const batch of gen) {
            const b = (batch instanceof Int32Array) ? batch : new Int32Array(batch);

            pending.push(b);
            pendingInts += b.length;

            if (pendingInts >= targetIntsPerJob) {
                const res = await flushPending(runLockedIndex);
                if (res.cancelled) {
                    return { cancelled: true, results: [] };
                }
            }
        }

        const tail = await flushPending(runLockedIndex);
        if (tail.cancelled) {
            return { cancelled: true, results: [] };
        }
    }

    return resultCollector.toResults({ echoes, limit: resultsLimit });
}

function alignRotationResultsWithCpu({
    results,
    rotationContexts,
    encoded,
    mainEchoBuffs,
    echoKindIds,
    statConstraints,
}) {
    if (!Array.isArray(results) || results.length === 0) return results;
    if (!Array.isArray(rotationContexts) || rotationContexts.length === 0) return results;
    if (!encoded || !mainEchoBuffs || !echoKindIds) return results;

    const scratch = createCpuScratch();
    const combos = new Int32Array(OPTIMIZER_ECHOS_PER_COMBO);
    const constraintsForEval = areConstraintsDisabled(statConstraints) ? null : statConstraints;
    const preparedContexts = rotationContexts
        .map((rotationContext) => {
            const packedContext = rotationContext?.packedContext;
            if (!packedContext) return null;
            return {
                context: preparePackedDamageContext(packedContext, encoded),
                weight: rotationContext?.target?.n ?? 1,
            };
        })
        .filter(Boolean);

    const refined = results.map((result) => {
        const ids = result?.ids;
        if (!Array.isArray(ids) || ids.length !== OPTIMIZER_ECHOS_PER_COMBO) {
            return result;
        }

        combos[0] = ids[0];
        combos[1] = ids[1];
        combos[2] = ids[2];
        combos[3] = ids[3];
        combos[4] = ids[4];

        const preparedCombo = prepareComboDamageState(
            0,
            combos,
            encoded,
            echoKindIds,
            scratch,
        );

        let totalDamage = 0;
        for (let i = 0; i < preparedContexts.length; i++) {
            const prepared = preparedContexts[i];
            const { dmg } = evaluatePreparedComboDamage(
                preparedCombo,
                prepared.context,
                mainEchoBuffs,
                constraintsForEval,
                scratch,
            );

            totalDamage += dmg * prepared.weight;
        }

        return {
            ...result,
            damage: totalDamage,
        };
    });

    return refined.sort((a, b) => b.damage - a.damage);
}
