// Set plan suggestion damage computation
// Uses shared modules for branchless set effects and character-specific logic

import { applySetEffectsFast } from "@/features/optimizer/core/cpu/setEffects.js";
import {
    calc1206ErToAtk,
    calc1306CritConversion,
    calc1209Conversion,
    computeAvgDamage,
} from "@/features/optimizer/core/cpu/damageCore.js";
import {
    getElementIdFromSkillId,
    getSkillTypeMaskFromSkillId,
} from "@/utils/computeSkillDamage.js";
import {bitValue} from "@/features/optimizer/core/cpu/helpers.js";
import {OPTIMIZER_CTX_TOGGLES} from "@/features/optimizer/core/misc/index.js";

export function computeSetPlanDamage(ctx, setPlan = {}) {
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
        skillTypeId = 0,

        charId = 0,
        sequence = 0,
        toggles = 0
    } = ctx || {};


    // Build set counts from setPlan
    const setCount = new Uint32Array(32);
    for (const [id, pieces] of Object.entries(setPlan || {})) {
        const idx = Number(id);
        if (Number.isFinite(idx) && idx >= 0 && idx < 32) {
            setCount[idx] = pieces;
        }
    }

    // Prefer skillId (optimizer style) and fall back to legacy fields
    const skillMask = skillId
        ? getSkillTypeMaskFromSkillId(skillId)
        : (skillTypeId | 0);
    const elementIdEff = skillId
        ? getElementIdFromSkillId(skillId)
        : (elementId | 0);

    // Apply set effects branchlessly
    const setBonus = applySetEffectsFast(setCount, skillMask);

    // Calculate finalER including set bonuses
    let finalER = baseER + setBonus.erSetBonus;

    // Check set 14 ER threshold (branchless)
    const s14_er_bonus = 30 * ((setCount[14] >= 5 && finalER >= 250) ? 1 : 0);

    // Element bonus via array lookup (branchless)
    const elemBonuses = [
        setBonus.aero,
        setBonus.glacio,
        setBonus.fusion,
        setBonus.spectro,
        setBonus.havoc,
        setBonus.electro
    ];
    const elemIdx = Math.max(0, Math.min(5, elementIdEff | 0));

    // Build total bonus
    let bonus = setBonus.bonusBase + elemBonuses[elemIdx] + s14_er_bonus;

    // Skill type bonuses via bit extraction (branchless)
    bonus += setBonus.basic     * ((skillMask >>> 0) & 1);
    bonus += setBonus.heavy     * ((skillMask >>> 1) & 1);
    bonus += setBonus.skill     * ((skillMask >>> 2) & 1);
    bonus += setBonus.lib       * ((skillMask >>> 3) & 1);
    bonus += setBonus.echoSkill * ((skillMask >>> 6) & 1);
    bonus += setBonus.coord     * ((skillMask >>> 7) & 1);

    const dmgBonusTotal = dmgBonus + bonus / 100;

    // Final stats
    const finalHp = baseHp * (setBonus.hpP / 100) + setBonus.hpF + baseFinalHp;
    const finalDef = baseDef * (setBonus.defP / 100) + setBonus.defF + baseFinalDef;

    // ATK with set bonus and 1206 conversion
    let finalAtk = baseAtk * (setBonus.atkP / 100) + setBonus.atkF + baseFinalAtk;
    finalAtk += calc1206ErToAtk(charId, finalER, toggles);

    // Crit totals with 1306 conversion (FIX: was missing before)
    let critRateTotal = critRate + setBonus.critRate / 100;
    let critDmgTotal = critDmg + setBonus.critDmg / 100;
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
    const avgDamage = computeAvgDamage({
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
        critDmgTotal
    });

    // Calculate base damage for display
    const baseDamage =
        (scaled * multiplier + flatDmg) *
        resMult *
        defMult *
        (dmgReductionTotal + conv1209.dmgVuln / 100) *
        dmgBonusTotal *
        dmgAmplify *
        special;

    return { avgDamage, baseDamage };
}

/**
 * Compute total damage across multiple rotation contexts for set plans
 * Returns sum of (damage * multiplier) to match buildRotationBreakdown totals
 */
export function computeRotationSetPlanDamage(rotationContexts, setPlan = {}) {
    if (!rotationContexts || !rotationContexts.length) {
        return { avgDamage: 0, baseDamage: 0 };
    }

    let totalWeightedDamage = 0;
    let firstResult = null;

    for (const { ctx, weight } of rotationContexts) {
        const result = computeSetPlanDamage(ctx, setPlan);

        if (result && typeof result.avgDamage === "number") {
            totalWeightedDamage += result.avgDamage * weight;

            if (!firstResult) {
                firstResult = result;
            }
        }
    }

    return {
        avgDamage: totalWeightedDamage,
        baseDamage: firstResult?.baseDamage ?? 0,
        isRotation: true,
        contextCount: rotationContexts.length,
    };
}
