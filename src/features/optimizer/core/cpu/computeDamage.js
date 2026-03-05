import {
    OPTIMIZER_CTX_BASE_ATK,
    OPTIMIZER_CTX_BASE_DEF,
    OPTIMIZER_CTX_BASE_ER,
    OPTIMIZER_CTX_BASE_HP,
    OPTIMIZER_CTX_CRIT_DMG,
    OPTIMIZER_CTX_CRIT_RATE,
    OPTIMIZER_CTX_DEF_MULT,
    OPTIMIZER_CTX_DMG_AMPLIFY,
    OPTIMIZER_CTX_DMG_BONUS,
    OPTIMIZER_CTX_DMG_REDUCTION,
    OPTIMIZER_CTX_SKILL_ID,
    OPTIMIZER_CTX_META0,
    OPTIMIZER_CTX_LOCKED_PACKED,
    OPTIMIZER_CTX_SET_RUNTIME_MASK,
    OPTIMIZER_CTX_FINAL_ATK,
    OPTIMIZER_CTX_FINAL_DEF,
    OPTIMIZER_CTX_FINAL_HP,
    OPTIMIZER_CTX_FLAT_DMG,
    OPTIMIZER_CTX_MULTIPLIER,
    OPTIMIZER_CTX_RES_MULT,
    OPTIMIZER_CTX_SCALING_ATK,
    OPTIMIZER_CTX_SCALING_DEF,
    OPTIMIZER_CTX_SCALING_ER,
    OPTIMIZER_CTX_SCALING_HP,
    OPTIMIZER_ECHOS_PER_COMBO,
    OPTIMIZER_MAIN_ECHO_BUFFS_PER_ECHO,
    OPTIMIZER_SET_SLOTS,
    OPTIMIZER_STATS_PER_ECHO,
    OPTIMIZER_CTX_TOGGLES,
    SET_RUNTIME_TOGGLE_ALL,
    SET_RUNTIME_TOGGLE_SET14_FIVE,
} from "../misc/index.js";
import { passesConstraints } from "./constraints.js";
import { countOneBits } from "./helpers.js";
import { applySetEffectsEncoded } from "./setEffects.js";
import { calc1206ErToAtk, calc1306CritConversion, calc1412Conversion } from "./damageCore.js";

const packedContextU32Cache = new WeakMap();

function getPackedContextU32(packedContext) {
    let view = packedContextU32Cache.get(packedContext);
    if (!view) {
        view = new Uint32Array(packedContext.buffer);
        packedContextU32Cache.set(packedContext, view);
    }
    return view;
}

function clampElementIndex(elementId) {
    return elementId < 0 ? 0 : (elementId > 5 ? 5 : elementId);
}

function selectSetElementBonus(aero, glacio, fusion, spectro, havoc, electro, elementIdx) {
    switch (elementIdx) {
    case 0: return aero;
    case 1: return glacio;
    case 2: return fusion;
    case 3: return spectro;
    case 4: return havoc;
    default: return electro;
    }
}

function selectMainElementBonus(mainEchoBuffs, base, elementIdx) {
    switch (elementIdx) {
    case 0: return mainEchoBuffs[base + 6];
    case 1: return mainEchoBuffs[base + 7];
    case 2: return mainEchoBuffs[base + 8];
    case 3: return mainEchoBuffs[base + 9];
    case 4: return mainEchoBuffs[base + 10];
    default: return mainEchoBuffs[base + 11];
    }
}

function getComboState(scratch) {
    if (scratch.comboState) return scratch.comboState;

    const state = {
        echoIds: scratch.echoIds,
        setCount: scratch.setCount,
        touchedSetIds: scratch.touchedSetIds,
        touchedSetCount: 0,
        atkP: 0,
        atkF: 0,
        hpP: 0,
        hpF: 0,
        defP: 0,
        defF: 0,
        critRate: 0,
        critDmg: 0,
        er: 0,
        basic: 0,
        heavy: 0,
        skill: 0,
        lib: 0,
        aero: 0,
        spectro: 0,
        fusion: 0,
        glacio: 0,
        havoc: 0,
        electro: 0,
    };

    scratch.comboState = state;
    return state;
}

function getDamageResult(scratch) {
    if (scratch.damageResult) return scratch.damageResult;
    const result = { dmg: 0, mainPos: 0 };
    scratch.damageResult = result;
    return result;
}

export function preparePackedDamageContext(packedContext, encoded) {
    const packedU32 = getPackedContextU32(packedContext);

    const skillId = packedU32[OPTIMIZER_CTX_SKILL_ID] >>> 0;
    const skillMask = skillId & 0x7fff;
    const elementIdx = clampElementIndex((skillId >>> 15) & 0x7);
    const meta0 = packedU32[OPTIMIZER_CTX_META0] >>> 0;
    const charId = meta0 & 0xfff;
    const sequence = (meta0 >>> 12) & 0xf;
    const lockedPacked = packedU32[OPTIMIZER_CTX_LOCKED_PACKED] >>> 0;
    const lockedEchoIndex = lockedPacked === 0 ? -1 : ((lockedPacked - 1) | 0);

    const packedRuntimeMask = packedU32[OPTIMIZER_CTX_SET_RUNTIME_MASK] >>> 0;
    const encodedRuntimeMask = (encoded?.setRuntimeMask ?? 0) >>> 0;
    const setRuntimeMask =
        (packedRuntimeMask !== 0)
            ? packedRuntimeMask
            : ((encodedRuntimeMask !== 0) ? encodedRuntimeMask : SET_RUNTIME_TOGGLE_ALL);

    const togglesBits = packedU32[OPTIMIZER_CTX_TOGGLES] >>> 0;

    return {
        packedContext,
        setConstLut: encoded?.setConstLut,
        setRuntimeMask,
        set14FiveEnabled: (setRuntimeMask & SET_RUNTIME_TOGGLE_SET14_FIVE) !== 0,

        skillId,
        skillMask,
        elementIdx,
        charId,
        sequence,
        lockedEchoIndex,

        toggle0: (togglesBits & 1) ? 1 : 0,

        baseAtk: packedContext[OPTIMIZER_CTX_BASE_ATK],
        baseHp: packedContext[OPTIMIZER_CTX_BASE_HP],
        baseDef: packedContext[OPTIMIZER_CTX_BASE_DEF],
        baseER: packedContext[OPTIMIZER_CTX_BASE_ER],

        finalAtk: packedContext[OPTIMIZER_CTX_FINAL_ATK],
        finalHp: packedContext[OPTIMIZER_CTX_FINAL_HP],
        finalDef: packedContext[OPTIMIZER_CTX_FINAL_DEF],

        critRate: packedContext[OPTIMIZER_CTX_CRIT_RATE],
        critDmg: packedContext[OPTIMIZER_CTX_CRIT_DMG],

        scalingAtk: packedContext[OPTIMIZER_CTX_SCALING_ATK],
        scalingHp: packedContext[OPTIMIZER_CTX_SCALING_HP],
        scalingDef: packedContext[OPTIMIZER_CTX_SCALING_DEF],
        scalingER: packedContext[OPTIMIZER_CTX_SCALING_ER],

        multiplier: packedContext[OPTIMIZER_CTX_MULTIPLIER],
        flatDmg: packedContext[OPTIMIZER_CTX_FLAT_DMG],
        resMult: packedContext[OPTIMIZER_CTX_RES_MULT],
        defMult: packedContext[OPTIMIZER_CTX_DEF_MULT],
        dmgReduction: packedContext[OPTIMIZER_CTX_DMG_REDUCTION],
        dmgBonus: packedContext[OPTIMIZER_CTX_DMG_BONUS],
        dmgAmplify: packedContext[OPTIMIZER_CTX_DMG_AMPLIFY],
    };
}

export function prepareComboDamageState(index, combos, encoded, echoKindIds, scratch) {
    const baseOffset = index * OPTIMIZER_ECHOS_PER_COMBO;
    const echoIds = scratch.echoIds;
    echoIds[0] = combos[baseOffset];
    echoIds[1] = combos[baseOffset + 1];
    echoIds[2] = combos[baseOffset + 2];
    echoIds[3] = combos[baseOffset + 3];
    echoIds[4] = combos[baseOffset + 4];

    const state = getComboState(scratch);

    const stats = encoded.stats;
    const sets = encoded.sets;

    let atkP = 0;
    let atkF = 0;
    let hpP = 0;
    let hpF = 0;
    let defP = 0;
    let defF = 0;
    let critRate = 0;
    let critDmg = 0;
    let er = 0;
    let basic = 0;
    let heavy = 0;
    let skill = 0;
    let lib = 0;
    let aero = 0;
    let spectro = 0;
    let fusion = 0;
    let glacio = 0;
    let havoc = 0;
    let electro = 0;

    const setMask = scratch.setMask;
    const setCount = scratch.setCount;
    const touchedSetIds = scratch.touchedSetIds;
    const prevTouchedSetIds = scratch.prevTouchedSetIds;
    const prevTouchedSetCount = scratch.prevTouchedSetCount | 0;
    for (let i = 0; i < prevTouchedSetCount; i++) {
        const setId = prevTouchedSetIds[i];
        setMask[setId] = 0;
        setCount[setId] = 0;
    }
    let touchedSetCount = 0;

    for (let i = 0; i < OPTIMIZER_ECHOS_PER_COMBO; i++) {
        const id = echoIds[i];
        if (id < 0) continue;

        const statBase = id * OPTIMIZER_STATS_PER_ECHO;
        atkP += stats[statBase];
        atkF += stats[statBase + 1];
        hpP += stats[statBase + 2];
        hpF += stats[statBase + 3];
        defP += stats[statBase + 4];
        defF += stats[statBase + 5];
        critRate += stats[statBase + 6];
        critDmg += stats[statBase + 7];
        er += stats[statBase + 8];
        basic += stats[statBase + 10];
        heavy += stats[statBase + 11];
        skill += stats[statBase + 12];
        lib += stats[statBase + 13];
        aero += stats[statBase + 14];
        spectro += stats[statBase + 15];
        fusion += stats[statBase + 16];
        glacio += stats[statBase + 17];
        havoc += stats[statBase + 18];
        electro += stats[statBase + 19];

        const setId = sets[id] | 0;
        if (setId >= OPTIMIZER_SET_SLOTS || setId < 0) continue;

        const kindId = echoKindIds[id] | 0;
        const bit = (1 << (kindId & 31)) >>> 0;
        const prevMask = setMask[setId] >>> 0;
        const nextMask = (prevMask | bit) >>> 0;

        if (nextMask !== prevMask) {
            if (prevMask === 0) {
                touchedSetIds[touchedSetCount++] = setId;
            }
            setMask[setId] = nextMask;
        }
    }

    for (let i = 0; i < touchedSetCount; i++) {
        const setId = touchedSetIds[i];
        setCount[setId] = countOneBits(setMask[setId]);
        prevTouchedSetIds[i] = setId;
    }
    scratch.prevTouchedSetCount = touchedSetCount;

    state.atkP = atkP;
    state.atkF = atkF;
    state.hpP = hpP;
    state.hpF = hpF;
    state.defP = defP;
    state.defF = defF;
    state.critRate = critRate;
    state.critDmg = critDmg;
    state.er = er;
    state.basic = basic;
    state.heavy = heavy;
    state.skill = skill;
    state.lib = lib;
    state.aero = aero;
    state.spectro = spectro;
    state.fusion = fusion;
    state.glacio = glacio;
    state.havoc = havoc;
    state.electro = electro;
    state.touchedSetCount = touchedSetCount;

    return state;
}

export function evaluatePreparedComboDamage(
    preparedCombo,
    preparedContext,
    mainEchoBuffs,
    statConstraints,
    scratch,
) {
    const setCount = preparedCombo.setCount;
    const skillMask = preparedContext.skillMask;

    const setBonus = applySetEffectsEncoded(
        setCount,
        skillMask,
        preparedContext.setConstLut,
        preparedContext.setRuntimeMask,
        preparedCombo.touchedSetIds,
        preparedCombo.touchedSetCount
    );

    const atkP = preparedCombo.atkP + setBonus.atkP;
    const atkF = preparedCombo.atkF;
    const hpP = preparedCombo.hpP;
    const hpF = preparedCombo.hpF;
    const defP = preparedCombo.defP;
    const defF = preparedCombo.defF;
    const critRate = preparedCombo.critRate + setBonus.critRate;
    const critDmg = preparedCombo.critDmg + setBonus.critDmg;
    const er = preparedCombo.er;
    const basic = preparedCombo.basic + setBonus.basic;
    const heavy = preparedCombo.heavy + setBonus.heavy;
    const skill = preparedCombo.skill + setBonus.skill;
    const lib = preparedCombo.lib + setBonus.lib;
    const aero = preparedCombo.aero + setBonus.aero;
    const spectro = preparedCombo.spectro + setBonus.spectro;
    const fusion = preparedCombo.fusion + setBonus.fusion;
    const glacio = preparedCombo.glacio + setBonus.glacio;
    const havoc = preparedCombo.havoc + setBonus.havoc;
    const electro = preparedCombo.electro + setBonus.electro;

    const erSetBonus = setBonus.erSetBonus;
    const echoSkill = setBonus.echoSkill;
    const coord = setBonus.coord;

    const finalHpBase = preparedContext.baseHp * (hpP / 100) + hpF + preparedContext.finalHp;
    const finalDefBase = preparedContext.baseDef * (defP / 100) + defF + preparedContext.finalDef;
    const atkBaseTerm = preparedContext.baseAtk * (atkP / 100) + atkF + preparedContext.finalAtk;

    let critRateTotal = preparedContext.critRate + critRate / 100;
    let critDmgTotal = preparedContext.critDmg + critDmg / 100;

    if (preparedContext.charId === 1306) {
        critDmgTotal += calc1306CritConversion(preparedContext.charId, preparedContext.sequence, critRateTotal) - 0.2;
    }

    const scaledBase =
        finalHpBase * preparedContext.scalingHp +
        finalDefBase * preparedContext.scalingDef;

    const finalERBase = preparedContext.baseER + er + erSetBonus;

    let bonusBaseTotal =
        setBonus.bonusBase +
        selectSetElementBonus(aero, glacio, fusion, spectro, havoc, electro, preparedContext.elementIdx);

    bonusBaseTotal += basic * ((skillMask >>> 0) & 1);
    bonusBaseTotal += heavy * ((skillMask >>> 1) & 1);
    bonusBaseTotal += skill * ((skillMask >>> 2) & 1);
    bonusBaseTotal += lib * ((skillMask >>> 3) & 1);
    bonusBaseTotal += echoSkill * ((skillMask >>> 6) & 1);
    bonusBaseTotal += coord * ((skillMask >>> 7) & 1);

    const set14Active = preparedContext.set14FiveEnabled && setCount[14] >= 5;
    const echoSkillBit = (skillMask >>> 6) & 1;

    let bestDmg = 0;
    let bestMain = 0;

    const multiplier = preparedContext.multiplier;
    const flatDmg = preparedContext.flatDmg;
    const scalingAtk = preparedContext.scalingAtk;
    const scalingER = preparedContext.scalingER;
    const baseMul =
        preparedContext.resMult *
        preparedContext.defMult *
        preparedContext.dmgReduction *
        preparedContext.dmgAmplify;

    const echoIds = preparedCombo.echoIds;

    for (let mainPos = 0; mainPos < OPTIMIZER_ECHOS_PER_COMBO; mainPos++) {
        const mainId = echoIds[mainPos];
        if (mainId < 0) continue;
        if (preparedContext.lockedEchoIndex >= 0 && mainId !== preparedContext.lockedEchoIndex) continue;

        const b = mainId * OPTIMIZER_MAIN_ECHO_BUFFS_PER_ECHO;
        const mainAtkP = mainEchoBuffs[b];
        const mainAtkF = mainEchoBuffs[b + 1];
        const mainER = mainEchoBuffs[b + 12];

        const finalER = finalERBase + mainER;

        const s14ErBonus = (set14Active && finalER >= 250) ? 30 : 0;
        let bonus =
            bonusBaseTotal +
            s14ErBonus +
            selectMainElementBonus(mainEchoBuffs, b, preparedContext.elementIdx);

        bonus += mainEchoBuffs[b + 2] * ((skillMask >>> 0) & 1);
        bonus += mainEchoBuffs[b + 3] * ((skillMask >>> 1) & 1);
        bonus += mainEchoBuffs[b + 4] * ((skillMask >>> 2) & 1);
        bonus += mainEchoBuffs[b + 5] * ((skillMask >>> 3) & 1);
        bonus += mainEchoBuffs[b + 13] * ((skillMask >>> 6) & 1);
        bonus += mainEchoBuffs[b + 14] * ((skillMask >>> 7) & 1);

        const dmgBonus =
            preparedContext.dmgBonus +
            bonus / 100 +
            calc1412Conversion(preparedContext.charId, finalER) * echoSkillBit;

        let finalAtk = atkBaseTerm + (preparedContext.baseAtk * (mainAtkP / 100)) + mainAtkF;
        finalAtk += calc1206ErToAtk(preparedContext.charId, finalER, preparedContext.toggle0);

        let mornyeDmgBonus = 0;
        let critRateBonus = 0;
        let critDmgBonus = 0;
        if (preparedContext.charId === 1209 && finalER > 0) {
            const erOver = finalER - 100;
            mornyeDmgBonus = Math.min(erOver * 0.25, 40) / 100;
            if (preparedContext.skillId === 2206007304) {
                critRateBonus = Math.min(erOver * 0.5, 80) / 100;
                critDmgBonus = Math.min(erOver, 160) / 100;
            }
        }

        if (multiplier === 0 && scalingAtk === 0 && flatDmg > 0) {
            if (flatDmg > bestDmg) {
                bestDmg = flatDmg;
                bestMain = mainPos;
            }
            continue;
        }

        const scaled = scaledBase + finalAtk * scalingAtk + finalER * scalingER;
        const base = (scaled * multiplier + flatDmg) * baseMul *
            (dmgBonus + mornyeDmgBonus * preparedContext.toggle0);
        const critHit = base * (critDmgTotal + critDmgBonus);

        const cr = Math.max(0, Math.min(1, critRateTotal + critRateBonus));
        const avg = cr * critHit + (1 - cr) * base;

        if (!passesConstraints(
            statConstraints,
            finalAtk,
            finalHpBase,
            finalDefBase,
            critRateTotal,
            critDmgTotal,
            finalER,
            dmgBonus,
            avg
        )) {
            continue;
        }

        if (avg > bestDmg) {
            bestDmg = avg;
            bestMain = mainPos;
        }
    }

    const result = getDamageResult(scratch);
    result.dmg = bestDmg;
    result.mainPos = bestMain;
    return result;
}

export function computeDamageForCombo({
    index,
    combos,
    packedContext,
    preparedContext = null,
    encoded,
    mainEchoBuffs,
    echoKindIds,
    statConstraints,
    scratch,
}) {
    const comboState = prepareComboDamageState(index, combos, encoded, echoKindIds, scratch);
    const ctx = preparedContext ?? preparePackedDamageContext(packedContext, encoded);

    return evaluatePreparedComboDamage(
        comboState,
        ctx,
        mainEchoBuffs,
        statConstraints,
        scratch
    );
}
