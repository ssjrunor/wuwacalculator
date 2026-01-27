import {
    getSetPlanFromEchoes,
    removeMainEchoBuffLogic,
    removeSetEffectsFromBuffs,
} from "@/data/buffs/setEffect.js";
import {removeEchoArrayFromBuffs} from "@/utils/echoHelper.js";
export { bitValue } from "../cpu/helpers.js";

export function flipOn(value , bitIndex) {
    if (bitIndex == null || bitIndex < 0 || bitIndex > 31) return value ?? 0;
    const u32 = new Uint32Array(1);
    const f32 = new Float32Array(u32.buffer);
    f32[0] = value;
    u32[0] = (u32[0] | (1 << bitIndex)) >>> 0;
    return f32[0];
}

export function flipOff(value, bitIndex) {
    if (bitIndex == null || bitIndex < 0 || bitIndex > 31) return value ?? 0;
    const u32 = new Uint32Array(1);
    const f32 = new Float32Array(u32.buffer);
    f32[0] = value;
    u32[0] = (u32[0] & ~(1 << bitIndex)) >>> 0;
    return f32[0];
}

export function logFloatBits(f, label = "bits") {
    const u32 = new Uint32Array(1);
    const f32 = new Float32Array(u32.buffer);
    f32[0] = f ?? 0;
    const bits = u32[0] >>> 0;
    console.log(label, bits.toString(2).padStart(32, "0"));
}

export function generateEchoContext(form) {
    const charId = form.charId;
    const runtime = form.characterRuntimeStates[charId];
    let toggles = 0;
    const currentSetPlan = getSetPlanFromEchoes(form.equippedEchoes);
    let clonedMergedBuffs = structuredClone(form.mergedBuffs);
    const withoutSetEffects = removeSetEffectsFromBuffs(clonedMergedBuffs, currentSetPlan, runtime, form.skillType);
    const withoutMainEchoes = removeMainEchoBuffLogic({
        equippedEchoes: form.equippedEchoes, mergedBuffs: withoutSetEffects, charId,
        characterState: {
            activeStates: runtime?.activeStates ?? {}
        },
    })
    const withoutSpecialCharacterBuffs = removeSpecialBuffs(form.mergedBuffs, withoutMainEchoes, charId, runtime.activeStates, form.sequence);
    const mergedBuffsWithoutEchoes = removeEchoArrayFromBuffs(withoutSpecialCharacterBuffs, form.equippedEchoes);

    if (Number(charId) === 1209) {
        const buffs = mergedBuffsWithoutEchoes;
        const original = form.mergedBuffs;
        const erOver = Math.max(0, buffs.energyRegen);
        const dmgBonus = runtime.activeStates.interferedMarker ?
            Math.min(original.energyRegen * .25, 40) : 0;
        if (runtime.activeStates.interferedMarker) {
            buffs.dmgBonus = (buffs.dmgBonus ?? 0) - dmgBonus;
            toggles = flipOn(toggles, 0);
        }
        const bonusCr = Math.min(erOver * .5, 80);
        const bonusCd = Math.min((erOver), 160);
        if (form.levelData.label.includes('Critical Protocol DMG')) {
            buffs.critRate -= bonusCr;
            buffs.critDmg -= bonusCd;
        }
    }

    if (Number(charId) === 1206) if (runtime.activeStates.myMoment) toggles = flipOn(toggles, 0);

    return {
        charId,

        // Character + base state
        activeCharacter: form.activeCharacter,
        baseCharacterState: form.baseCharacterState,
        characterLevel: form.characterRuntimeStates?.[charId]?.CharacterLevel,

        // Runtime states / toggles / passives
        characterRuntimeStates: form.characterRuntimeStates,

        // Combat state (enemy res, enemy def, flatDmg, weapon, etc)
        combatState: form.characterRuntimeStates?.[charId]?.CombatState,

        // Skill info
        entry: form.entry,
        levelData: form.levelData,
        sliderValues: form.characterRuntimeStates?.[charId]?.SkillLevels,
        getSkillData: form.getSkillData,

        // Buffs BEFORE applying echoes
        mergedBuffsWithoutEchoes,
        sequence: form.sequence,
        enemyProfile: form.enemyProfile,
        toggles,
    };
}

export function removeSpecialBuffs(
    original,
    buffs,
    charId,
    activeStates,
    sequence = 0,
) {
    switch (Number(charId)) {
        case 1206: {
            if (original.energyRegen > 50) {
                const excess = original.energyRegen - 50;
                if (activeStates?.myMoment) {
                    const atkBuff = Math.min(excess * 20, 2600);
                    buffs.atk.flat = (buffs.atk?.flat ?? 0) - atkBuff;
                } else {
                    const atkBuff = Math.min(excess * 12, 1560);
                    buffs.atk.flat = (buffs.atk?.flat ?? 0) - atkBuff;
                }
            }
        }
            break;
        case 1306:
            let bonusCd = 0;
            if (sequence >= 2) {
                const excess = original.critRate >= 95 ? (original.critRate ?? 0) - 95 : 0;
                bonusCd += Math.min(100, excess * 2);
            }
            if (sequence >= 6) {
                const excess = original.critRate >= 145 ? (original.critRate ?? 0) - 145 : 0;
                bonusCd += Math.min(50, excess * 2);
            }
            buffs.critDmg = (original.critDmg ?? 0) - bonusCd;
            break;
    }
    return buffs;
}

export function applySpecialBuffs( original, buffs, charId, key, sequence = 0 ) {
    if (!charId) return buffs;
    const idn = Number(charId);

    switch (idn) {
        case 1206:
            if (original.energyRegen > 150 && key === 'atk') {
                const excess = original.energyRegen - 150;
                const atkBuff = Math.min(excess * 20, 2600);
                buffs[key] = (buffs[key] ?? 0) + atkBuff;
            } else return {[key]: 0};
            break;
        case 1306:
            let bonusCd = 0;
            if (sequence >= 2) {
                const excess = original.critRate >= 100 ? (original.critRate ?? 0) - 100 : 0;
                bonusCd += Math.min(100, excess * 2);
            }
            if (sequence >= 6) {
                const excess = original.critRate >= 150 ? (original.critRate ?? 0) - 150 : 0;
                bonusCd += Math.min(50, excess * 2);
            }
            buffs[key] = bonusCd - 20;
            break;
        default:
            buffs[key] = (buffs[key] ?? 0);
    }

    return buffs;
}
