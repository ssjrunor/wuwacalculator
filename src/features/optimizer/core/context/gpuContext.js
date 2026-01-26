import { getFinalStats } from "@/utils/getStatsForLevel.js";
import {
    computeSkillDamage,
    getElementIdFromSkillId,
    getSkillTypeMaskFromSkillId
} from "@/utils/computeSkillDamage.js";

export function prepareGpuContext({
                                      activeCharacter,
                                      baseCharacterState,
                                      mergedBuffsWithoutEchoes,
                                      combatState,
                                      characterLevel,
                                      characterRuntimeStates,
                                      charId,
                                      entry,
                                      levelData,
                                      getSkillData,
                                      sequence,
                                      enemyProfile,
                                  }) {
    const finalStatsBase = getFinalStats(
        activeCharacter,
        baseCharacterState,
        characterLevel,
        mergedBuffsWithoutEchoes,
        combatState
    );

    const ctx = computeSkillDamage({
        entry,
        levelData,
        activeCharacter,
        characterRuntimeStates,
        finalStats: finalStatsBase,
        combatState,
        mergedBuffs: mergedBuffsWithoutEchoes,
        sliderValues: characterRuntimeStates?.[charId]?.SkillLevels,
        characterLevel,
        getSkillData,
        enemyProfile,
        returnContextOnly: true
    });

    const skillId = ctx.skillMeta?.skillId ?? 0;
    const hasSkillId = skillId !== 0;
    const skillTypeMaskFromSkillId = hasSkillId ? getSkillTypeMaskFromSkillId(skillId) : 0;

    return {
        baseAtk: finalStatsBase.atk.base,
        baseHp: finalStatsBase.hp.base,
        baseDef: finalStatsBase.def.base,
        baseER: ctx.baseER,

        finalAtk: ctx.baseAtk,
        finalHp: ctx.baseHp,
        finalDef: ctx.baseDef,

        scalingAtk: ctx.scalingAtk,
        scalingHp: ctx.scalingHp,
        scalingDef: ctx.scalingDef,
        scalingER: ctx.scalingER,

        multiplier: ctx.multiplier,
        flatDmg: ctx.flatDmg,

        resMult: ctx.resMult,
        defMult: ctx.defMult,

        dmgReductionTotal: ctx.dmgReductionTotal,
        dmgBonus: ctx.dmgBonus,
        dmgAmplify: ctx.dmgAmplify,

        critRate: ctx.critRate,
        critDmg: ctx.critDmg,

        special: ctx.special,
        skillTypeId: skillTypeMaskFromSkillId || mapSkillTypeToId(ctx?.skillMeta?.skillType),
        skillId,
        sequence
    };
}

export const ELEMENT_MAP = {
    aero: 0,
    glacio: 1,
    fusion: 2,
    spectro: 3,
    havoc: 4,
    electro: 5,
    physical: 6
};

export const SKILLTYPE_FLAGS = {
    basic:          1 << 0, // 1
    heavy:          1 << 1, // 2
    skill:          1 << 2, // 4
    ultimate:       1 << 3, // 8
    outro:          1 << 4, // 16
    intro:          1 << 5, // 32
    echoSkill:      1 << 6, // 64
    coord:          1 << 7, // 128
    aeroErosion:    1 << 8, // 256
    spectroFrazzle: 1 << 9, // 512
};

export function mapElementToId(element) {
    if (!element) return -1;
    return ELEMENT_MAP[element] ?? -1;
}

export function mapSkillTypeToId(skillType) {
    if (!skillType) return 0;

    const arr = Array.isArray(skillType) ? skillType : [skillType];
    let mask = 0;

    for (const type of arr) {
        const flag = SKILLTYPE_FLAGS[type];
        if (flag) {
            mask |= flag;
        }
    }

    return mask;
}
