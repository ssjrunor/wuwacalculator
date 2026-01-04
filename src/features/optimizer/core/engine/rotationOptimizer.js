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
    TopKHeap,
    makeSortedKey5BigInt,
} from "../misc/index.js";

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

export function buildRotationContexts({ targets, form, lockedIndex = -1 }) {
    return targets.map((target) =>
        buildRotationContextForTarget({ form, target, lockedIndex })
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
}) {
    const comboCountPerRun = comboIndexing?.totalCombos ?? 0;
    const targetCombosPerJob = ECHO_OPTIMIZER_JOB_TARGET_COMBOS_ROTATION_GPU;
    const totalForProgress = combinations ?? (comboCountPerRun * mainFactor * runCount);
    let totalProcessed = 0;
    const startTime = performance.now();
    let lastUpdateTime = startTime;
    let avgSpeed = 0;
    let speedSamples = 0;

    // Keep a larger candidate pool to handle deduplication across batches
    const oversample = 8;
    const candidateLimit = Math.min(Math.max(resultsLimit * oversample, resultsLimit), 512);
    const jobResultsLimit = Math.min(Math.max(resultsLimit * 2, resultsLimit), 128);

    const topResults = new TopKHeap(candidateLimit);
    const globalBestBySet = new Map();

    const applyProgress = (comboDelta) => {
        totalProcessed += comboDelta * mainFactor;
        const now = performance.now();
        const elapsedSinceLast = now - lastUpdateTime;
        if (elapsedSinceLast > 0) {
            const speed = (comboDelta * mainFactor) / elapsedSinceLast;
            avgSpeed = (avgSpeed * speedSamples + speed) / (speedSamples + 1);
            speedSamples++;
            lastUpdateTime = now;
        }
        let remainingMs = Infinity;
        if (avgSpeed > 0) {
            const combosLeft = totalForProgress - totalProcessed;
            remainingMs = combosLeft / avgSpeed;
        }
        if (onProgress) {
            onProgress({
                progress: totalProcessed / totalForProgress,
                elapsedMs: now - startTime,
                remainingMs,
                processed: totalProcessed,
                speed: avgSpeed * 1000,
            });
        }
    };

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
                    if (dmg <= 0) continue;
                    const key = makeSortedKey5BigInt(ids[0], ids[1], ids[2], ids[3], ids[4]);
                    const prev = globalBestBySet.get(key);
                    if (prev == null || dmg > prev) {
                        globalBestBySet.set(key, dmg);
                        topResults.push({ dmg, ids });
                    }
                }
            }

            applyProgress(count);
            start += count;
        }
    }

    const candidates = topResults.sorted().slice(0, resultsLimit);

    return candidates.map(({ dmg, ids }) => {
        const uids = ids.map((idx) => {
            if (idx < 0) return null;
            const echo = echoes?.[idx];
            return echo?.uid ?? null;
        });
        return { ids, uids, damage: dmg };
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
}) {
    const targetCombosPerJob = ECHO_OPTIMIZER_JOB_TARGET_COMBOS_CPU;
    const targetIntsPerJob = targetCombosPerJob * OPTIMIZER_ECHOS_PER_COMBO;

    const totalForProgress = combinations ?? 0;
    let totalProcessed = 0;
    const startTime = performance.now();
    let lastUpdateTime = startTime;
    let avgSpeed = 0;
    let speedSamples = 0;

    const oversample = 8;
    const candidateLimit = Math.min(Math.max(resultsLimit * oversample, resultsLimit), 512);
    const jobResultsLimit = Math.min(Math.max(resultsLimit * 2, resultsLimit), 128);

    const topResults = new TopKHeap(candidateLimit);
    const globalBestBySet = new Map();

    const applyProgress = (comboDelta) => {
        totalProcessed += comboDelta * mainFactor;
        const now = performance.now();
        const elapsedSinceLast = now - lastUpdateTime;
        if (elapsedSinceLast > 0) {
            const speed = (comboDelta * mainFactor) / elapsedSinceLast;
            avgSpeed = (avgSpeed * speedSamples + speed) / (speedSamples + 1);
            speedSamples++;
            lastUpdateTime = now;
        }
        let remainingMs = Infinity;
        if (avgSpeed > 0) {
            const combosLeft = totalForProgress - totalProcessed;
            remainingMs = combosLeft / avgSpeed;
        }
        if (onProgress) {
            onProgress({
                progress: totalProcessed / totalForProgress,
                elapsedMs: now - startTime,
                remainingMs,
                processed: totalProcessed,
                speed: avgSpeed * 1000,
            });
        }
    };

    const runOneJob = async (intsArray, runLockedIndex) => {
        const comboCount = (intsArray.length / OPTIMIZER_ECHOS_PER_COMBO) | 0;

        const packedContext = packOptimizerContext({
            comboCount,
            charId: form.charId,
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
                if (dmg <= 0) continue;
                const key = makeSortedKey5BigInt(ids[0], ids[1], ids[2], ids[3], ids[4]);
                const prev = globalBestBySet.get(key);
                if (prev == null || dmg > prev) {
                    globalBestBySet.set(key, dmg);
                    topResults.push({ dmg, ids });
                }
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
        if (pendingInts <= 0) return { cancelled: false };

        let merged;
        if (pending.length === 1) {
            merged = pending[0];
        } else {
            merged = new Int32Array(pendingInts);
            let off = 0;
            for (const b of pending) {
                merged.set(b, off);
                off += b.length;
            }
        }

        pending = [];
        pendingInts = 0;

        const { cancelled, comboCount } = await runOneJob(merged, runLockedIndex);
        if (cancelled) return { cancelled: true };

        applyProgress(comboCount);
        return { cancelled: false };
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

    const candidates = topResults.sorted().slice(0, resultsLimit);

    return candidates.map(({ dmg, ids }) => {
        const uids = ids.map((idx) => {
            if (idx < 0) return null;
            const echo = echoes?.[idx];
            return echo?.uid ?? null;
        });
        return { ids, uids, damage: dmg };
    });
}