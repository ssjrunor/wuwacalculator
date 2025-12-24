import {
    OPTIMIZER_CTX_BASE_ATK,
    OPTIMIZER_CTX_BASE_DEF,
    OPTIMIZER_CTX_BASE_ER,
    OPTIMIZER_CTX_BASE_HP,
    OPTIMIZER_CTX_CHAR_ID,
    OPTIMIZER_CTX_CRIT_DMG,
    OPTIMIZER_CTX_CRIT_RATE,
    OPTIMIZER_CTX_DEF_MULT,
    OPTIMIZER_CTX_DMG_AMPLIFY,
    OPTIMIZER_CTX_DMG_BONUS,
    OPTIMIZER_CTX_DMG_REDUCTION,
    OPTIMIZER_CTX_ELEMENT_ID,
    OPTIMIZER_CTX_FINAL_ATK,
    OPTIMIZER_CTX_FINAL_DEF,
    OPTIMIZER_CTX_FINAL_HP,
    OPTIMIZER_CTX_FLAT_DMG,
    OPTIMIZER_CTX_LOCKED_INDEX,
    OPTIMIZER_CTX_MULTIPLIER,
    OPTIMIZER_CTX_RES_MULT,
    OPTIMIZER_CTX_SCALING_ATK,
    OPTIMIZER_CTX_SCALING_DEF,
    OPTIMIZER_CTX_SCALING_ER,
    OPTIMIZER_CTX_SCALING_HP,
    OPTIMIZER_CTX_SEQUENCE,
    OPTIMIZER_CTX_SKILL_MASK,
    OPTIMIZER_ECHOS_PER_COMBO,
    OPTIMIZER_FLAG_BASIC,
    OPTIMIZER_FLAG_COORD,
    OPTIMIZER_FLAG_ECHO_SKILL,
    OPTIMIZER_FLAG_HEAVY,
    OPTIMIZER_FLAG_LIB,
    OPTIMIZER_FLAG_SKILL,
    OPTIMIZER_MAIN_ECHO_BUFFS_PER_ECHO,
    OPTIMIZER_SET_SLOTS,
    OPTIMIZER_SKILL_ECHO_SKILL,
    OPTIMIZER_SKILL_HEAVY,
    OPTIMIZER_STATS_PER_ECHO
} from "../optimizerConfig.js";
import { passesConstraints } from "./constraints.js";
import { countOneBits, hasSkill } from "./helpers.js";


let best = 0;

export function computeDamageForCombo({
    index,
    combos,
    packedContext,
    encoded,
    mainEchoBuffs,
    echoKindIds,
    statConstraints,
    scratch,
}) {
    const baseOffset = index * OPTIMIZER_ECHOS_PER_COMBO;
    const echoIds = scratch.echoIds;
    echoIds[0] = combos[baseOffset];
    echoIds[1] = combos[baseOffset + 1];
    echoIds[2] = combos[baseOffset + 2];
    echoIds[3] = combos[baseOffset + 3];
    echoIds[4] = combos[baseOffset + 4];

    const stats = encoded.stats;
    const sets = encoded.sets;

    let atkPBase = 0;
    let atkFBase = 0;
    let hpPBase = 0;
    let hpFBase = 0;
    let defPBase = 0;
    let defFBase = 0;

    let critRateBase = 0;
    let critDmgBase = 0;
    let erBase = 0;

    let basicBase = 0;
    let heavyBase = 0;
    let skillBase = 0;
    let libBase = 0;

    let aeroBase = 0;
    let spectroBase = 0;
    let fusionBase = 0;
    let glacioBase = 0;
    let havocBase = 0;
    let electroBase = 0;

    let echoSkillBase = 0;
    let coordBase = 0;

    for (let i = 0; i < OPTIMIZER_ECHOS_PER_COMBO; i++) {
        const id = echoIds[i];
        if (id < 0) continue;

        const base = id * OPTIMIZER_STATS_PER_ECHO;

        const v0x = stats[base + 0];
        const v0y = stats[base + 1];
        const v0z = stats[base + 2];
        const v0w = stats[base + 3];

        const v1x = stats[base + 4];
        const v1y = stats[base + 5];
        const v1z = stats[base + 6];
        const v1w = stats[base + 7];

        const v2x = stats[base + 8];
        const v2z = stats[base + 10];
        const v2w = stats[base + 11];

        const v3x = stats[base + 12];
        const v3y = stats[base + 13];
        const v3z = stats[base + 14];
        const v3w = stats[base + 15];

        const v4x = stats[base + 16];
        const v4y = stats[base + 17];
        const v4z = stats[base + 18];
        const v4w = stats[base + 19];

        atkPBase += v0x;
        atkFBase += v0y;
        hpPBase += v0z;
        hpFBase += v0w;
        defPBase += v1x;
        defFBase += v1y;
        critRateBase += v1z;
        critDmgBase += v1w;
        erBase += v2x;
        basicBase += v2z;
        heavyBase += v2w;
        skillBase += v3x;
        libBase += v3y;
        aeroBase += v3z;
        spectroBase += v3w;
        fusionBase += v4x;
        glacioBase += v4y;
        havocBase += v4z;
        electroBase += v4w;
    }

    const setMask = scratch.setMask;
    const setCount = scratch.setCount;
    setMask.fill(0);

    for (let i = 0; i < OPTIMIZER_ECHOS_PER_COMBO; i++) {
        const idx = echoIds[i];
        if (idx < 0) continue;

        const setId = sets[idx] | 0;
        if (setId >= OPTIMIZER_SET_SLOTS || setId < 0) continue;

        const kindId = echoKindIds[idx] | 0;
        const bit = (1 << (kindId & 31)) >>> 0;
        setMask[setId] = (setMask[setId] | bit) >>> 0;
    }

    for (let s = 0; s < OPTIMIZER_SET_SLOTS; s++) {
        setCount[s] = countOneBits(setMask[s]);
    }

    let atkPSet = atkPBase;
    let atkFSet = atkFBase;
    let hpPSet = hpPBase;
    let hpFSet = hpFBase;
    let defPSet = defPBase;
    let defFSet = defFBase;

    let critRateSet = critRateBase;
    let critDmgSet = critDmgBase;
    let erSet = erBase;

    let basicSet = basicBase;
    let heavySet = heavyBase;
    let skillSet = skillBase;
    let libSet = libBase;

    let aeroSet = aeroBase;
    let spectroSet = spectroBase;
    let fusionSet = fusionBase;
    let glacioSet = glacioBase;
    let havocSet = havocBase;
    let electroSet = electroBase;

    let echoSkillSet = echoSkillBase;
    let coordSet = coordBase;

    let bonusBase = 0;
    let erSetBonus = 0;

    if (setCount[1] >= 2) glacioSet += 10;
    if (setCount[1] >= 5) glacioSet += 30;

    if (setCount[2] >= 2) fusionSet += 10;
    if (setCount[2] >= 5) fusionSet += 30;

    if (setCount[3] >= 2) electroSet += 10;
    if (setCount[3] >= 5) electroSet += 30;

    if (setCount[4] >= 2) aeroSet += 10;
    if (setCount[4] >= 5) aeroSet += 30;

    if (setCount[5] >= 2) spectroSet += 10;
    if (setCount[5] >= 5) spectroSet += 30;

    if (setCount[6] >= 2) havocSet += 10;
    if (setCount[6] >= 5) havocSet += 30;

    if (setCount[7] >= 5) atkPSet += 15;

    if (setCount[8] >= 2) erSetBonus += 10;

    if (setCount[9] >= 2) atkPSet += 10;
    if (setCount[9] >= 5) atkPSet += 20;

    if (setCount[10] >= 2) glacioSet += 12;
    if (setCount[10] >= 5) {
        glacioSet += 22.5;
        skillSet += 36;
    }

    if (setCount[11] >= 2) spectroSet += 10;
    if (setCount[11] >= 5) {
        critRateSet += 20;
        spectroSet += 15;
    }

    if (setCount[12] >= 2) havocSet += 10;

    if (setCount[13] >= 2) erSetBonus += 10;
    if (setCount[13] >= 5) {
        coordSet += 80;
        atkPSet += 20;
    }

    if (setCount[14] >= 2) erSetBonus += 10;
    if (setCount[14] >= 5) atkPSet += 15;

    if (setCount[16] >= 2) aeroSet += 10;
    if (setCount[16] >= 5) aeroSet += 30;

    if (setCount[17] >= 2) aeroSet += 10;
    if (setCount[17] >= 5) {
        critRateSet += 10;
        aeroSet += 30;
    }

    if (setCount[18] >= 2) fusionSet += 10;
    if (setCount[18] >= 5) {
        fusionSet += 15;
        libSet += 20;
    }

    if (setCount[19] >= 3) {
        critRateSet += 20;
        echoSkillSet += 35;
    }

    if (setCount[20] >= 3) {
        atkPSet += 30;
        critDmgSet += 20;
    }

    if (setCount[21] >= 3) {
        heavySet += 30;
        echoSkillSet += 16;
    }

    if (setCount[22] >= 3) {
        fusionSet += 16;
    }

    const skillMask = packedContext[OPTIMIZER_CTX_SKILL_MASK] | 0;
    if (
        setCount[22] >= 3 &&
        (hasSkill(skillMask, OPTIMIZER_SKILL_HEAVY) || hasSkill(skillMask, OPTIMIZER_SKILL_ECHO_SKILL))
    ) {
        critRateSet += 20;
    }

    if (setCount[23] >= 3) {
        atkPSet += 20;
        libSet += 30;
    }

    if (setCount[24] >= 2) spectroSet += 10;

    if (setCount[25] >= 5) bonusBase += 25;

    if (setCount[26] >= 2) spectroSet += 10;
    if (setCount[26] >= 5) {
        spectroSet += 30;
        basicSet += 40;
    }

    const baseHp = packedContext[OPTIMIZER_CTX_BASE_HP];
    const baseDef = packedContext[OPTIMIZER_CTX_BASE_DEF];
    const baseAtk = packedContext[OPTIMIZER_CTX_BASE_ATK];

    const finalHpBase = baseHp * (hpPSet / 100) + hpFSet + packedContext[OPTIMIZER_CTX_FINAL_HP];
    const finalDefBase = baseDef * (defPSet / 100) + defFSet + packedContext[OPTIMIZER_CTX_FINAL_DEF];

    const atkBaseTerm = baseAtk * (atkPSet / 100) + atkFSet + packedContext[OPTIMIZER_CTX_FINAL_ATK];

    let critRateTotal = packedContext[OPTIMIZER_CTX_CRIT_RATE] + critRateSet / 100;
    let critDmgTotal = packedContext[OPTIMIZER_CTX_CRIT_DMG] + critDmgSet / 100;

    const charId = packedContext[OPTIMIZER_CTX_CHAR_ID] | 0;
    if (charId === 1306) {
        let bonusCd = 0;
        if (packedContext[OPTIMIZER_CTX_SEQUENCE] >= 2 && critRateTotal >= 1) {
            const excess = critRateTotal - 1;
            bonusCd += Math.min(excess * 2, 1);
        }
        if (packedContext[OPTIMIZER_CTX_SEQUENCE] >= 6 && critRateTotal >= 1.5) {
            const excess2 = critRateTotal - 1.5;
            bonusCd += Math.min(excess2 * 2, 0.5);
        }
        critDmgTotal += bonusCd - 0.2;
    }

    const scaledBase =
        finalHpBase * packedContext[OPTIMIZER_CTX_SCALING_HP] +
        finalDefBase * packedContext[OPTIMIZER_CTX_SCALING_DEF];

    const baseMul =
        packedContext[OPTIMIZER_CTX_RES_MULT] *
        packedContext[OPTIMIZER_CTX_DEF_MULT] *
        packedContext[OPTIMIZER_CTX_DMG_REDUCTION] *
        packedContext[OPTIMIZER_CTX_DMG_AMPLIFY];

    const finalERBase = packedContext[OPTIMIZER_CTX_BASE_ER] + erSet + erSetBonus;

    const elementId = packedContext[OPTIMIZER_CTX_ELEMENT_ID];

    const hasBasic = hasSkill(skillMask, OPTIMIZER_FLAG_BASIC);
    const hasHeavy = hasSkill(skillMask, OPTIMIZER_FLAG_HEAVY);
    const hasSkillD = hasSkill(skillMask, OPTIMIZER_FLAG_SKILL);
    const hasLib = hasSkill(skillMask, OPTIMIZER_FLAG_LIB);
    const hasEchoSkill = hasSkill(skillMask, OPTIMIZER_FLAG_ECHO_SKILL);
    const hasCoord = hasSkill(skillMask, OPTIMIZER_FLAG_COORD);

    let bonusBaseTotal = bonusBase;
    if (elementId === 0) bonusBaseTotal += aeroSet;
    if (elementId === 1) bonusBaseTotal += glacioSet;
    if (elementId === 2) bonusBaseTotal += fusionSet;
    if (elementId === 3) bonusBaseTotal += spectroSet;
    if (elementId === 4) bonusBaseTotal += havocSet;
    if (elementId === 5) bonusBaseTotal += electroSet;

    if (hasBasic) bonusBaseTotal += basicSet;
    if (hasHeavy) bonusBaseTotal += heavySet;
    if (hasSkillD) bonusBaseTotal += skillSet;
    if (hasLib) bonusBaseTotal += libSet;
    if (hasEchoSkill) bonusBaseTotal += echoSkillSet;
    if (hasCoord) bonusBaseTotal += coordSet;

    let bestDmg = 0;
    let bestMain = 0;

    const lockedEchoIndex = packedContext[OPTIMIZER_CTX_LOCKED_INDEX] | 0;

    for (let mainPos = 0; mainPos < OPTIMIZER_ECHOS_PER_COMBO; mainPos++) {
        const mainId = echoIds[mainPos];
        if (mainId < 0) continue;
        if (lockedEchoIndex >= 0 && mainId !== lockedEchoIndex) continue;

        const b = mainId * OPTIMIZER_MAIN_ECHO_BUFFS_PER_ECHO;
        const mainAtkP = mainEchoBuffs[b];
        const mainAtkF = mainEchoBuffs[b + 1];
        const mainBasic = mainEchoBuffs[b + 2];
        const mainHeavy = mainEchoBuffs[b + 3];
        const mainSkill = mainEchoBuffs[b + 4];
        const mainLib = mainEchoBuffs[b + 5];
        const mainAero = mainEchoBuffs[b + 6];
        const mainGlac = mainEchoBuffs[b + 7];
        const mainFus = mainEchoBuffs[b + 8];
        const mainSpec = mainEchoBuffs[b + 9];
        const mainHav = mainEchoBuffs[b + 10];
        const mainElec = mainEchoBuffs[b + 11];
        const mainER = mainEchoBuffs[b + 12];
        const mainEchoSkill = mainEchoBuffs[b + 13];
        const mainCoord = mainEchoBuffs[b + 14];

        const finalER = finalERBase + mainER;

        let bonus = bonusBaseTotal;
        if (setCount[14] >= 5 && finalER >= 250) {
            bonus += 30;
        }

        if (elementId === 0) bonus += mainAero;
        if (elementId === 1) bonus += mainGlac;
        if (elementId === 2) bonus += mainFus;
        if (elementId === 3) bonus += mainSpec;
        if (elementId === 4) bonus += mainHav;
        if (elementId === 5) bonus += mainElec;

        if (hasBasic) bonus += mainBasic;
        if (hasHeavy) bonus += mainHeavy;
        if (hasSkillD) bonus += mainSkill;
        if (hasLib) bonus += mainLib;
        if (hasEchoSkill) bonus += mainEchoSkill;
        if (hasCoord) bonus += mainCoord;

        const dmgBonus = packedContext[OPTIMIZER_CTX_DMG_BONUS] + bonus / 100;

        let finalAtk =
            atkBaseTerm + (baseAtk * (mainAtkP / 100)) + mainAtkF;

        if (charId === 1206) {
            const erOver = Math.max(0, finalER - 150);
            let extraAtk = erOver * 20;
            extraAtk = Math.min(extraAtk, 2600);
            finalAtk += extraAtk;
        }

        const scaled =
            scaledBase +
            finalAtk * packedContext[OPTIMIZER_CTX_SCALING_ATK] +
            finalER * packedContext[OPTIMIZER_CTX_SCALING_ER];

        const multiplier = packedContext[OPTIMIZER_CTX_MULTIPLIER];
        const flatDmg = packedContext[OPTIMIZER_CTX_FLAT_DMG];

        if (multiplier === 0 && packedContext[OPTIMIZER_CTX_SCALING_ATK] === 0 && flatDmg > 0) {
            if (flatDmg > bestDmg) {
                bestDmg = flatDmg;
                bestMain = mainPos;
            }
            continue;
        }

        const base = (scaled * multiplier + flatDmg) * baseMul * dmgBonus;
        const critHit = base * critDmgTotal;
        let avg = critRateTotal * critHit + (1 - critRateTotal) * base;

        if (critRateTotal >= 1) avg = critHit;

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

    if (best < bestDmg) best = bestDmg

    return { dmg: bestDmg, mainPos: bestMain };
}
