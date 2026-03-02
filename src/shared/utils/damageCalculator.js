const MOD_KEYS = [
    'resShred',
    'dmgBonus',
    'amplify',
    'defIgnore',
    'defShred',
    'dmgVuln',
    'critRate',
    'critDmg'
];

const SKILLTYPE_MAP = {
    basic: 'basicAtk',
    heavy: 'heavyAtk',
    skill: 'resonanceSkill',
    ultimate: 'resonanceLiberation',
    outro: 'outroSkill',
    intro: 'introSkill',
    echoSkill: 'echoSkill',
    coord: 'coord',
    aeroErosion: 'aeroErosion',
    spectroFrazzle: 'spectroFrazzle',
};

const ATTRIBUTE_TO_ELEMENT_ID = {
    physical: 0,
    glacio: 1,
    fusion: 2,
    electro: 3,
    aero: 4,
    spectro: 5,
    havoc: 6,
    none: 0
};

function aggregateBuffMods(finalStats, { element, skillTypes }) {
    const result = {
        resShred: 0,
        dmgBonus: 0,
        amplify: 0,
        defIgnore: 0,
        defShred: 0,
        dmgVuln: 0,
        critRate: 0,
        critDmg: 0
    };

    if (!finalStats) return result;

    const attribute      = finalStats.attribute ?? {};
    const skillTypeBucket = finalStats.skillType ?? {};
    const buckets        = [];

    // Element bucket:
    if (element && attribute[element]) {
        buckets.push(attribute[element]);
    } else if (!element && attribute.all) {
        buckets.push(attribute.all);
    }

    // Global "all"
    if (skillTypeBucket.all) buckets.push(skillTypeBucket.all);

    // 🔹 Normalize skillTypes using SKILLTYPE_MAP
    const mappedSkillTypes = (skillTypes || [])
        .filter(Boolean)
        .map(t => SKILLTYPE_MAP[t] ?? t);

    const uniqueSkillTypes = [...new Set(mappedSkillTypes)];

    for (const t of uniqueSkillTypes) {
        const bucket = skillTypeBucket[t];
        if (bucket) buckets.push(bucket);
    }

    // Sum over all buckets
    for (const bucket of buckets) {
        for (const key of MOD_KEYS) {
            const v = bucket[key];
            if (typeof v === 'number') {
                result[key] += v;
            }
        }
    }

    result.dmgBonus += finalStats.dmgBonus;
    return result;
}

export function calculateDamage({
                                    finalStats,
                                    flat,
                                    combatState = {},
                                    scaling,
                                    multiplier,
                                    characterLevel,
                                    mergedBuffs,
                                    returnContextOnly = false,
                                    baseTuneRup,
                                    skillMeta: rawSkillMeta = {},
                                    enemyProfile: rawEnemyProfile = {},
                                }) {
    const skillMeta = rawSkillMeta ?? {};
    const enemyProfile = rawEnemyProfile ?? {};

    const {
        element,
        skillType,
        dmgType,
        amplify = 0,
        skillDmgBonus = 0,
        critDmgBonus = 0,
        critRateBonus = 0,
        skillDefIgnore = 0,
        skillResIgnore = 0,
        skillCritDmg = 0,
        skillCritRate = 0,
        fixedDmg = null,
        skillDmgTaken = 0,
    } = skillMeta;

    const effectiveMultiplier = multiplier ?? skillMeta.multiplier ?? 1;

    if (fixedDmg) {
        const normal = Math.max(1, Math.floor(fixedDmg));
        return { normal, crit: normal, avg: normal };
    }

    const skillTypes = (Array.isArray(skillType) ? skillType : [skillType]).filter(Boolean);

    // Support both old scalar finalStats and new { base, final } shape
    const atk =
        typeof finalStats.atk === 'object'
            ? (finalStats.atk.final ?? 0)
            : (finalStats.atk ?? 0);

    const hp =
        typeof finalStats.hp === 'object'
            ? (finalStats.hp.final ?? 0)
            : (finalStats.hp ?? 0);

    const def =
        typeof finalStats.def === 'object'
            ? (finalStats.def.final ?? 0)
            : (finalStats.def ?? 0);

    const energyRegen = finalStats.energyRegen ?? 0;

    const baseAbility =
        (atk * (scaling?.atk ?? 0)) +
        (hp * (scaling?.hp ?? 0)) +
        (def * (scaling?.def ?? 0)) +
        (energyRegen * (scaling?.energyRegen ?? 0));

    let baseDmg = flat != null
        ? flat
        : baseAbility * effectiveMultiplier;

    // global + combat flat damage (still comes from buff pool + combat state)
    baseDmg += (combatState.flatDmg ?? 0) + (mergedBuffs?.flatDmg ?? 0);

    // ---- aggregate buffs from finalStats.attribute / finalStats.skillType ----
    const {
        resShred,
        dmgBonus: totalDmgBonus,
        amplify: buffAmplify,
        defIgnore,
        defShred,
        dmgVuln,
        critRate: buffCritRate,
        critDmg: buffCritDmg
    } = aggregateBuffMods(finalStats, { element, skillTypes });

    // ---- resistance multiplier ----
    const elementId = ATTRIBUTE_TO_ELEMENT_ID[element] ?? 0;
    const baseRes = typeof enemyProfile.res?.[elementId] === 'number' ? enemyProfile.res[elementId] : 0;
    const totalResShred = (resShred ?? 0) + (skillResIgnore ?? 0);
    const enemyRes = baseRes - totalResShred;

    let resMult;
    if (enemyRes < 0) {
        resMult = 1 - (enemyRes / 200);
    } else if (enemyRes < 75) {
        resMult = 1 - (enemyRes / 100);
    } else {
        resMult = 1 / (1 + 5 * (enemyRes / 100));
    }

    if (baseRes === 100) {
        return {
            normal: 0,
            crit: 0,
            avg: 0,
        }
    }

    // ---- defense multiplier ----
    const enemyLevel = enemyProfile.level ?? combatState.enemyLevel ?? 90;
    const charLevel = characterLevel ?? 1;

    const totalDefIgnore = (defIgnore ?? 0) + (skillDefIgnore ?? 0);
    const totalDefShred = defShred ?? 0;

    let enemyDef = ((8 * enemyLevel) + 792) * (1 - (totalDefIgnore + totalDefShred) / 100);
    if (enemyDef < 0) enemyDef = 0;

    const defMult = (800 + 8 * charLevel) / (800 + 8 * charLevel + enemyDef);

    // ---- damage taken / vulnerability ----
    const dmgTakenTotalPercent = (skillDmgTaken ?? 0) + (dmgVuln ?? 0);
    const dmgReductionTotal = 1 + dmgTakenTotalPercent / 100;

    const elementBonusPercent =
        (totalDmgBonus ?? 0) +
        (skillDmgBonus ?? 0);

    const dmgBonus = 1 + elementBonusPercent / 100;

    // ---- amplify (multiplicative DMG%) ----
    let amplifyTotal = (amplify ?? 0) + (buffAmplify ?? 0);
    const dmgAmplify = 1 + amplifyTotal / 100;

    const special = 1 + (finalStats.special ?? 0) / 100;

    let normal =
        baseDmg *
        resMult *
        defMult *
        dmgReductionTotal *
        dmgBonus *
        dmgAmplify *
        special;

    // ---- crit ----
    const totalCritRatePercent =
        (finalStats.critRate ?? 0) +
        (buffCritRate ?? 0) +
        (critRateBonus ?? 0) +
        (skillCritRate ?? 0);

    const totalCritDmgPercent =
        (finalStats.critDmg ?? 0) +
        (buffCritDmg ?? 0) +
        (critDmgBonus ?? 0) +
        (skillCritDmg ?? 0);

    const critRate = totalCritRatePercent / 100;
    const critDmg = totalCritDmgPercent / 100;

    let crit = normal * critDmg;

    let avg = critRate >= 1
        ? crit
        : (crit * critRate) + (normal * (1 - critRate));

    if (returnContextOnly) {
        return {
            baseAtk: atk,
            baseHp: hp,
            baseDef: def,
            baseER: energyRegen,
            scalingAtk: scaling?.atk ?? 0,
            scalingHp: scaling?.hp ?? 0,
            scalingDef: scaling?.def ?? 0,
            scalingER: scaling?.energyRegen ?? 0,
            multiplier: effectiveMultiplier,
            flatDmg: (flat ?? 0) + (combatState.flatDmg ?? 0) + (mergedBuffs?.flatDmg ?? 0),
            special,
            resMult,
            defMult,
            dmgReductionTotal,
            dmgBonus,
            dmgAmplify,
            critRate,
            critDmg,
            normalBase: baseDmg,
            avg
        };
    }


    if (dmgType === 'tuneBreak') {
        let classMod = 1;
        if (enemyProfile.class === 3 || enemyProfile.class === 4) classMod = 14;
        else if (enemyProfile.class === 2) classMod = 3;

        const bonus = (1 +
            (finalStats.skillType?.tuneRupture?.dmgBonus ?? 0) / 100) * (1 + (finalStats.tuneBreakBoost ?? 0) / 100);
        normal = baseTuneRup * resMult *
            defMult *
            dmgReductionTotal * classMod * bonus * special;
        crit = normal * (skillMeta.tuneBreakCd ?? 1);
        const cr = (skillMeta.tuneBreakCr ?? 0)
        avg = cr >= 1
            ? crit
            : (crit * cr) + (normal * (1 - cr));
    }

    return {
        normal,
        crit,
        avg,
    };
}

export function calculateSpectroFrazzleDamage(combatState, finalStats, characterLevel, enemyLevel, enemyResMap = {}) {
    const stacks = combatState?.spectroFrazzle ?? 0;
    if (stacks === 0) return 0;

    const resMap = enemyResMap ?? {};
    const element = 'spectro';
    const elementId = ATTRIBUTE_TO_ELEMENT_ID[element] ?? 0;
    const baseRes = typeof resMap?.[elementId] === 'number' ? resMap[elementId] : 0;
    if (baseRes === 100) {
        return {
            frazzleTotal: 0,
            frazzle: 0,
        }
    }
    // hard-coded internal formula stays the same
    const perStack = (209.9 + 895.8 * stacks);
    const total = (447.9 * Math.pow(stacks, 2)) + (657.8 * stacks);

    const skillTypes = ['spectroFrazzle'];

    const {
        resShred,
        defIgnore,
        defShred,
        dmgVuln,
    } = aggregateBuffMods(finalStats, { element, skillTypes });

    const amplify = finalStats.skillType.spectroFrazzle.amplify;
    const dmgBonus = finalStats.skillType.spectroFrazzle.dmgBonus;
    const special = 1 + (finalStats.special ?? 0) / 100;
    const enemyRes = baseRes - (resShred ?? 0);

    let resMult;
    if (enemyRes < 0) {
        resMult = 1 - enemyRes / 200;
    } else if (enemyRes < 75) {
        resMult = 1 - enemyRes / 100;
    } else {
        resMult = 1 / (1 + 5 * (enemyRes / 100));
    }

    let enemyDef = ((8 * enemyLevel) + 792) * (1 - ((defIgnore ?? 0) + (defShred ?? 0)) / 100);
    if (enemyDef < 0) enemyDef = 0;
    const defMult = (800 + 8 * characterLevel) / (800 + 8 * characterLevel + enemyDef);

    const dmgReduction = 1 + (dmgVuln ?? 0) / 100;
    const bonusMult = (1 + amplify / 100) * (1 + dmgBonus / 100) * special;

    const perStackDmg = Math.floor(perStack * bonusMult * resMult * defMult * dmgReduction);
    const totalDmg = Math.floor(total * bonusMult * resMult * defMult * dmgReduction);

    return { frazzleTotal: totalDmg, frazzle: perStackDmg };
}

export function calculateAeroErosionDamage(combatState, finalStats, characterLevel, enemyLevel, enemyResMap = {}) {
    const stacks = combatState?.aeroErosion ?? 0;
    if (stacks === 0) return 0;

    const resMap = enemyResMap ?? {};
    const element = 'aero';
    const elementId = ATTRIBUTE_TO_ELEMENT_ID[element] ?? 0;
    const baseRes = typeof resMap?.[elementId] === 'number' ? resMap[elementId] : 0;
    if (baseRes === 100) {
        return {
            erosionTotal: 0,
            erosion: 0,
        }
    }


    let perStack = 0;
    if (stacks === 1) {
        perStack = 1655.1;
    } else if (stacks >= 1) {
        perStack = 4133.45 * stacks - 4132.37;
    }

    const total = 0;
    const skillTypes = ['aeroErosion'];

    const {
        resShred,
        defIgnore,
        defShred,
        dmgVuln,
    } = aggregateBuffMods(finalStats, { element, skillTypes });

    const amplify = finalStats.skillType.aeroErosion.amplify;
    const dmgBonus = finalStats.skillType.aeroErosion.dmgBonus;
    const special = 1 + (finalStats.special ?? 0) / 100;

    const enemyRes = baseRes - (resShred ?? 0);

    let resMult;
    if (enemyRes < 0) {
        resMult = 1 - enemyRes / 200;
    } else if (enemyRes < 75) {
        resMult = 1 - enemyRes / 100;
    } else {
        resMult = 1 / (1 + 5 * (enemyRes / 100));
    }

    let enemyDef = ((8 * enemyLevel) + 792) * (1 - ((defIgnore ?? 0) + (defShred ?? 0)) / 100);
    if (enemyDef < 0) enemyDef = 0;
    const defMult = (800 + 8 * characterLevel) / (800 + 8 * characterLevel + enemyDef);

    const dmgReduction = 1 + (dmgVuln ?? 0) / 100;
    const bonusMult = (1 + amplify / 100) * (1 + dmgBonus / 100) * special;

    const perStackDmg = Math.floor(perStack * bonusMult * resMult * defMult * dmgReduction);
    const totalDmg = Math.floor(total * bonusMult * resMult * defMult * dmgReduction);

    return { erosionTotal: totalDmg, erosion: perStackDmg };
}
