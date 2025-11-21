import { getFinalStats } from "../utils/getStatsForLevel.js";
import { computeSkillDamage } from "../utils/computeSkillDamage.js";

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
                                      getSkillData
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
        returnContextOnly: true
    });

    const weaponBaseAtk = combatState?.weaponBaseAtk ?? 0;

    return {
        baseAtk: finalStatsBase.Atk + weaponBaseAtk,
        baseHp: finalStatsBase.Life,
        baseDef: finalStatsBase.Def,
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

        normalBase: ctx.normalBase,

        elementId: mapElementToId(ctx?.skillMeta?.element),
        skillTypeId: mapSkillTypeToId(ctx?.skillMeta?.skillType)
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

export const SKILLTYPE_MAP = {
    basic: 0,
    heavy: 1,
    skill: 2,
    ultimate: 3,
    outro: 4,
    intro: 5,
    echoSkill: 6,
    coord: 7,
    aeroErosion: 8,
    spectroFrazzle: 9
};

export function mapElementToId(element) {
    if (!element) return -1;
    return ELEMENT_MAP[element] ?? -1;
}

export function mapSkillTypeToId(skillType) {
    if (!skillType) return -1;
    if (Array.isArray(skillType)) {
        for (const type of skillType) {
            const id = SKILLTYPE_MAP[type];
            if (id !== undefined) return id;
        }
        return -1;
    }

    return SKILLTYPE_MAP[skillType] ?? -1;
}