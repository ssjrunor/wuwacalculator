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
    OPTIMIZER_CTX_SKILL_ID,
    OPTIMIZER_CTX_SPECIAL,
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
    OPTIMIZER_ECHOS_PER_COMBO,
    OPTIMIZER_MAIN_ECHO_BUFFS_PER_ECHO,
    OPTIMIZER_SET_SLOTS,
    OPTIMIZER_STATS_PER_ECHO
} from "../misc/index.js";
import { passesConstraints } from "./constraints.js";
import { countOneBits } from "./helpers.js";
import { applySetEffectsFast } from "./setEffects.js";
import { calc1206ErToAtk, calc1306CritConversion, calc1209Conversion } from "./damageCore.js";

const packedContextU32Cache = new WeakMap();

function getPackedContextU32(packedContext) {
    let view = packedContextU32Cache.get(packedContext);
    if (!view) {
        view = new Uint32Array(packedContext.buffer);
        packedContextU32Cache.set(packedContext, view);
    }
    return view;
}

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

    // Accumulate echo stats
    let atkP = 0, atkF = 0, hpP = 0, hpF = 0, defP = 0, defF = 0;
    let critRate = 0, critDmg = 0, er = 0;
    let basic = 0, heavy = 0, skill = 0, lib = 0;
    let aero = 0, spectro = 0, fusion = 0, glacio = 0, havoc = 0, electro = 0;

    for (let i = 0; i < OPTIMIZER_ECHOS_PER_COMBO; i++) {
        const id = echoIds[i];
        if (id < 0) continue;

        const base = id * OPTIMIZER_STATS_PER_ECHO;

        atkP += stats[base];
        atkF += stats[base + 1];
        hpP += stats[base + 2];
        hpF += stats[base + 3];
        defP += stats[base + 4];
        defF += stats[base + 5];
        critRate += stats[base + 6];
        critDmg += stats[base + 7];
        er += stats[base + 8];
        basic += stats[base + 10];
        heavy += stats[base + 11];
        skill += stats[base + 12];
        lib += stats[base + 13];
        aero += stats[base + 14];
        spectro += stats[base + 15];
        fusion += stats[base + 16];
        glacio += stats[base + 17];
        havoc += stats[base + 18];
        electro += stats[base + 19];
    }

    // Count sets using bitmask for unique echoes
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

    // Apply set effects branchlessly
    const packedU32 = getPackedContextU32(packedContext);
    const skillId = packedU32[OPTIMIZER_CTX_SKILL_ID] >>> 0;
    const skillMask = skillId & 0x7fff;
    const setBonus = applySetEffectsFast(setCount, skillMask);

    // Combine echo stats with set bonuses
    atkP += setBonus.atkP;
    critRate += setBonus.critRate;
    critDmg += setBonus.critDmg;
    glacio += setBonus.glacio;
    fusion += setBonus.fusion;
    electro += setBonus.electro;
    aero += setBonus.aero;
    spectro += setBonus.spectro;
    havoc += setBonus.havoc;
    basic += setBonus.basic;
    heavy += setBonus.heavy;
    skill += setBonus.skill;
    lib += setBonus.lib;
    const erSetBonus = setBonus.erSetBonus;
    const echoSkill = setBonus.echoSkill;
    const coord = setBonus.coord;
    const bonusBase = setBonus.bonusBase;

    // Base stats from context
    const baseHp = packedContext[OPTIMIZER_CTX_BASE_HP];
    const baseDef = packedContext[OPTIMIZER_CTX_BASE_DEF];
    const baseAtk = packedContext[OPTIMIZER_CTX_BASE_ATK];

    // Final stats
    const finalHpBase = baseHp * (hpP / 100) + hpF + packedContext[OPTIMIZER_CTX_FINAL_HP];
    const finalDefBase = baseDef * (defP / 100) + defF + packedContext[OPTIMIZER_CTX_FINAL_DEF];
    const atkBaseTerm = baseAtk * (atkP / 100) + atkF + packedContext[OPTIMIZER_CTX_FINAL_ATK];

    let critRateTotal = packedContext[OPTIMIZER_CTX_CRIT_RATE] + critRate / 100;
    let critDmgTotal = packedContext[OPTIMIZER_CTX_CRIT_DMG] + critDmg / 100;

    const charId = packedContext[OPTIMIZER_CTX_CHAR_ID] | 0;
    const sequence = packedContext[OPTIMIZER_CTX_SEQUENCE];
    // Character 1306: Crit conversion (apply the -20% offset only for 1306)
    if (charId === 1306) {
        critDmgTotal += calc1306CritConversion(charId, sequence, critRateTotal) - 0.2;
    }

    // Pre-compute scaled base (HP + DEF contribution)
    const scaledBase =
        finalHpBase * packedContext[OPTIMIZER_CTX_SCALING_HP] +
        finalDefBase * packedContext[OPTIMIZER_CTX_SCALING_DEF];

    let dmgRed = packedContext[OPTIMIZER_CTX_DMG_REDUCTION];

    const finalERBase = packedContext[OPTIMIZER_CTX_BASE_ER] + er + erSetBonus;
    const elementId = (skillId >>> 15) & 0x7;

    // Build element + skill type bonuses branchlessly
    const elemBonuses = [aero, glacio, fusion, spectro, havoc, electro];
    const elemIdx = Math.max(0, Math.min(5, elementId | 0));
    let bonusBaseTotal = bonusBase + elemBonuses[elemIdx];

    // Skill type bonuses via bit extraction
    bonusBaseTotal += basic     * ((skillMask >>> 0) & 1);
    bonusBaseTotal += heavy     * ((skillMask >>> 1) & 1);
    bonusBaseTotal += skill     * ((skillMask >>> 2) & 1);
    bonusBaseTotal += lib       * ((skillMask >>> 3) & 1);
    bonusBaseTotal += echoSkill * ((skillMask >>> 6) & 1);
    bonusBaseTotal += coord     * ((skillMask >>> 7) & 1);

    let bestDmg = 0;
    let bestMain = 0;

    const lockedEchoIndex = packedContext[OPTIMIZER_CTX_LOCKED_INDEX] | 0;
    const multiplier = packedContext[OPTIMIZER_CTX_MULTIPLIER];
    const flatDmg = packedContext[OPTIMIZER_CTX_FLAT_DMG];
    const scalingAtk = packedContext[OPTIMIZER_CTX_SCALING_ATK];
    const scalingER = packedContext[OPTIMIZER_CTX_SCALING_ER];

    for (let mainPos = 0; mainPos < OPTIMIZER_ECHOS_PER_COMBO; mainPos++) {
        const mainId = echoIds[mainPos];
        if (mainId < 0) continue;
        if (lockedEchoIndex >= 0 && mainId !== lockedEchoIndex) continue;

        const b = mainId * OPTIMIZER_MAIN_ECHO_BUFFS_PER_ECHO;
        const mainAtkP = mainEchoBuffs[b];
        const mainAtkF = mainEchoBuffs[b + 1];
        const mainER = mainEchoBuffs[b + 12];

        const finalER = finalERBase + mainER;

        // Set 14 ER threshold bonus (branchless)
        const s14_er_bonus = 30 * ((setCount[14] >= 5 && finalER >= 250) ? 1 : 0);

        // Main echo element bonuses (branchless via an array)
        const mainElems = [
            mainEchoBuffs[b + 6],  // aero
            mainEchoBuffs[b + 7],  // glacio
            mainEchoBuffs[b + 8],  // fusion
            mainEchoBuffs[b + 9],  // spectro
            mainEchoBuffs[b + 10], // havoc
            mainEchoBuffs[b + 11], // electro
        ];

        let bonus = bonusBaseTotal + s14_er_bonus + mainElems[elemIdx];

        // Main echo skill type bonuses (branchless via bit extraction)
        bonus += mainEchoBuffs[b + 2]  * ((skillMask >>> 0) & 1); // basic
        bonus += mainEchoBuffs[b + 3]  * ((skillMask >>> 1) & 1); // heavy
        bonus += mainEchoBuffs[b + 4]  * ((skillMask >>> 2) & 1); // skill
        bonus += mainEchoBuffs[b + 5]  * ((skillMask >>> 3) & 1); // lib
        bonus += mainEchoBuffs[b + 13] * ((skillMask >>> 6) & 1); // echoSkill
        bonus += mainEchoBuffs[b + 14] * ((skillMask >>> 7) & 1); // coord

        const dmgBonus = packedContext[OPTIMIZER_CTX_DMG_BONUS] + bonus / 100;

        // Final ATK with the main echo and 1206 conversion
        let finalAtk = atkBaseTerm + (baseAtk * (mainAtkP / 100)) + mainAtkF;
        finalAtk += calc1206ErToAtk(charId, finalER);

        let {mornyeDmgBonus, critRateBonus, critDmgBonus} = calc1209Conversion(charId, finalER, skillId);

        // Flat damage only case
        if (multiplier === 0 && scalingAtk === 0 && flatDmg > 0) {
            if (flatDmg > bestDmg) {
                bestDmg = flatDmg;
                bestMain = mainPos;
            }
            continue;
        }

        const scaled = scaledBase + finalAtk * scalingAtk + finalER * scalingER;
        const baseMul =
            packedContext[OPTIMIZER_CTX_RES_MULT] *
            packedContext[OPTIMIZER_CTX_DEF_MULT] *
            dmgRed * packedContext[OPTIMIZER_CTX_DMG_AMPLIFY];

        const base = (scaled * multiplier + flatDmg) * baseMul * (dmgBonus + mornyeDmgBonus);
        const critHit = base * (critDmgTotal + critDmgBonus);

/*
        console.log('op: ', dmgBonus);
*/

        // Branchless crit rate handling
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

    return { dmg: bestDmg, mainPos: bestMain };
}
