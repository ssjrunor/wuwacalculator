// Main stat suggestion damage computation
// Uses shared damage core for character-specific logic

import {
    calc1206ErToAtk,
    calc1306CritConversion,
    calc1209Conversion,
    computeAvgDamage,
} from "@/features/optimizer/core/cpu/damageCore.js";
import { getElementIdFromSkillId } from "@shared/utils/computeSkillDamage.js";
import {bitValue} from "@/features/optimizer/core/cpu/helpers.js";

export function computeMainStatDamage(params, mainStats) {
    const {
        baseAtk = 0,
        baseHp = 0,
        baseDef = 0,
        baseER = 0,

        finalAtk: baseFinalAtk = 0,
        finalHp: baseFinalHp = 0,
        finalDef: baseFinalDef = 0,

        scalingAtk = 0,
        scalingHp = 0,
        scalingDef = 0,
        scalingER = 0,

        multiplier = 0,
        flatDmg = 0,

        resMult = 1,
        defMult = 1,

        dmgReductionTotal = 1,
        dmgBonus = 1,
        dmgAmplify = 1,
        special = 1,

        critRate = 0,
        critDmg = 1,

        skillId = 0,
        elementId = 0,
        toggles = 0,

        charId = 0,
        sequence = 0,
    } = params;

    const {
        atkPercent = 0, atkFlat = 0,
        hpPercent = 0, hpFlat = 0,
        defPercent = 0, defFlat = 0,

        critRate: critRateFromStats = 0,
        critDmg: critDmgFromStats = 0,

        energyRegen = 0,
        aero = 0,
        glacio = 0,
        fusion = 0,
        spectro = 0,
        havoc = 0,
        electro = 0,
    } = mainStats || {};

    // Prefer skillId (optimizer style) and fall back to legacy fields
    const elementIdEff = skillId
        ? getElementIdFromSkillId(skillId)
        : (elementId | 0);

    // Element bonus via array lookup (branchless)
    const elemBonuses = [aero, glacio, fusion, spectro, havoc, electro];
    const elemIdx = Math.max(0, Math.min(5, elementIdEff | 0));
    const elementBonus = elemBonuses[elemIdx];

    const dmgBonusTotal = dmgBonus + elementBonus / 100;

    // Final stats
    const finalER = baseER + energyRegen;
    const finalHp = baseHp * (hpPercent / 100) + hpFlat + baseFinalHp;
    const finalDef = baseDef * (defPercent / 100) + defFlat + baseFinalDef;

    // ATK with 1206 conversion
    let finalAtk = baseAtk * (atkPercent / 100) + atkFlat + baseFinalAtk;
    finalAtk += calc1206ErToAtk(charId, finalER, toggles);

    // Crit totals with 1306 conversion
    let critRateTotal = critRate + critRateFromStats / 100;
    let critDmgTotal = critDmg + critDmgFromStats / 100;
    critDmgTotal += calc1306CritConversion(charId, sequence, critRateTotal);

    // 1209 conversions
    const conv1209 = calc1209Conversion(charId, finalER, skillId);
    critRateTotal += conv1209.critRateBonus;
    critDmgTotal += conv1209.critDmgBonus;

    // Scaled value
    const scaled =
        finalAtk * scalingAtk +
        finalHp * scalingHp +
        finalDef * scalingDef +
        finalER * scalingER;


    // Use shared damage computation
    return computeAvgDamage({
        scaled,
        multiplier,
        flatDmg,
        resMult,
        defMult,
        dmgReduction: dmgReductionTotal,
        dmgBonus: dmgBonusTotal +
            conv1209.mornyeDmgBonus * bitValue(toggles, 0),
        dmgAmplify,
        special,
        critRateTotal,
        critDmgTotal,
    });
}

/**
 * Compute total damage across multiple rotation contexts
 * Returns sum of (damage * multiplier) to match buildRotationBreakdown totals
 */
export function computeRotationMainStatDamage(rotationContexts, mainStats) {
    if (!rotationContexts || !rotationContexts.length) return 0;

    let totalWeightedDamage = 0;

    for (const { ctx, weight } of rotationContexts) {
        const result = computeMainStatDamage(ctx, mainStats);
        totalWeightedDamage += result * weight;
    }

    return totalWeightedDamage;
}
