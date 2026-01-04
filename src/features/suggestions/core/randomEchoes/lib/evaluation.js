import {
    buildEchoKindIdArray,
    encodeEchoStats,
    OPTIMIZER_MAIN_ECHO_BUFFS_PER_ECHO,
} from "@/features/optimizer/core/misc/index.js";
import {computeDamageForCombo} from "@/features/optimizer/core/cpu/computeDamage.js";

export function buildZeroMainEchoBuffs(count) {
    return new Float32Array(count * OPTIMIZER_MAIN_ECHO_BUFFS_PER_ECHO);
}

export function evaluateEchoSet({
    echoes,
    constraints,
    scratch,
    mainEchoBuffs,
    packedContext,
    combos,
}) {
    const encoded = encodeEchoStats(echoes);
    const echoKindIds = buildEchoKindIdArray(echoes);

    const { dmg } = computeDamageForCombo({
        index: 0,
        combos,
        packedContext,
        encoded,
        mainEchoBuffs,
        echoKindIds,
        statConstraints: constraints,
        scratch,
    });

    return dmg;
}
