export function calculateDamage({
                                    finalStats,
    flat,
                                    combatState,
                                    scaling,
                                    multiplier,
                                    element,
                                    skillType,
                                    characterLevel,
                                    mergedBuffs,
                                    amplify = 0,
                                    skillDmgBonus = 0,
                                    critDmgBonus = 0,
                                    critRateBonus = 0,
                                    skillDefIgnore = 0,
                                    skillResIgnore = 0,
                                    skillCritDmg = 0,
                                    skillCritRate = 0,
                                }) {
    const skillTypes = Array.isArray(skillType) ? skillType : [skillType];

    const atk = finalStats.atk ?? 0;
    const hp = finalStats.hp ?? 0;
    const def = finalStats.def ?? 0;
    const energyRegen = finalStats.energyRegen ?? 0;

    const baseAbility = (atk * (scaling.atk ?? 0)) +
        (hp * (scaling.hp ?? 0)) +
        (def * (scaling.def ?? 0)) +
        (energyRegen * (scaling.energyRegen ?? 0));


    let baseDmg = 0;
    if (flat != null) {
        baseDmg = flat;
    } else {
        baseDmg = baseAbility * multiplier;
    }
    baseDmg += (combatState.flatDmg ?? 0);

    const enemyResShred = (mergedBuffs?.enemyResShred ?? 0) + skillResIgnore;
    const enemyRes = (combatState.enemyRes ?? 0) - enemyResShred;

    let resMult = 1;
    if (enemyRes < 0) {
        resMult = 1 - (enemyRes / 200);
    } else if (enemyRes < 75) {
        resMult = 1 - (enemyRes / 100);
    } else {
        resMult = 1 / (1 + 5 * (enemyRes / 100));
    }

    const enemyLevel = combatState.enemyLevel ?? 1;
    const charLevel = characterLevel ?? 1;
    const enemyDefIgnore = (skillDefIgnore ?? 0) + (mergedBuffs?.enemyDefIgnore ?? 0);
    const enemyDefShred = mergedBuffs?.enemyDefShred ?? 0;
    const rawEnemyDef = ((8 * enemyLevel) + 792) * (1 - (enemyDefIgnore + enemyDefShred) / 100);
    const enemyDef = Math.max(0, rawEnemyDef);
    const defMult = (800 + 8 * charLevel) / (800 + 8 * charLevel + enemyDef);

    const dmgReductionTotal = 1 + (mergedBuffs.dmgReduction ?? 0)/100;
    const elementReductionTotal = 1 + (mergedBuffs.elementDmgReduction ?? 0)/100;

    let skillTypeBonus = skillDmgBonus;
    for (const type of skillTypes) {
        skillTypeBonus += mergedBuffs?.[`${type}Atk`] ?? mergedBuffs?.[`${type}`] ?? 0;
    }

    let elementBonus = (finalStats[`${element}DmgBonus`] ?? 0) + skillTypeBonus;


    let amplifyTotal = amplify + (mergedBuffs.elementDmgAmplify?.[element] ?? 0);
    for (const type of skillTypes) {
        amplifyTotal += mergedBuffs.damageTypeAmplify?.[type] ?? 0;

        if (type === 'outro') {
            amplifyTotal += mergedBuffs.outroAmplify ?? 0;
        }
        if (type === 'spectroFrazzle') {
            amplifyTotal += mergedBuffs.spectroFrazzleDmg ?? 0;
        }
        if (type === 'aeroErosion') {
            amplifyTotal += mergedBuffs.aeroErosionDmg ?? 0;
        }
    }


    const dmgBonus = 1 + elementBonus / 100;
    const dmgAmplify = 1 + amplifyTotal / 100;
    const special = 1 + 0;

    const normal = baseDmg * resMult * defMult * dmgReductionTotal * elementReductionTotal * dmgBonus * dmgAmplify * special;

    const critRate = Math.min(((finalStats.critRate ?? 0) / 100) + ((critRateBonus + skillCritRate) / 100), 1);
    const critDmg = ((finalStats.critDmg ?? 0) / 100) + ((critDmgBonus + skillCritDmg) / 100);
    const crit = normal * (critDmg);

    const avg = critRate >= 1
        ? crit
        : (crit * critRate) + (normal * (1 - critRate));

    return {
        normal: Math.max(1, Math.floor(normal)),
        crit: Math.max(1, Math.floor(crit)),
        avg: Math.max(1, Math.floor(avg))
    };
}

export function calculateSpectroFrazzleDamage(combatState, mergedBuffs, characterLevel) {
    const stacks = combatState?.spectroFrazzle ?? 0;
    if (stacks === 0) return 0;

    const perStack = (209.9 + 895.8 * stacks)
    const total = (447.9 * Math.pow(stacks, 2)) + (657.8 * stacks);
    const bonus = mergedBuffs?.damageTypeAmplify.spectroFrazzle ?? 0;

    const enemyLevel = combatState.enemyLevel ?? 1;
    const charLevel = characterLevel;

    const resShred = mergedBuffs?.enemyResShred ?? 0;
    const enemyRes = (combatState.enemyRes ?? 0) - resShred;

    let resMult = 1;
    if (enemyRes < 0) {
        resMult = 1 - enemyRes / 200;
    } else if (enemyRes < 75) {
        resMult = 1 - enemyRes / 100;
    } else {
        resMult = 1 / (1 + 5 * (enemyRes / 100));
    }

    const defIgnore = (mergedBuffs?.enemyDefIgnore ?? 0);
    const defShred = (mergedBuffs?.enemyDefShred ?? 0);
    let enemyDef = ((8 * enemyLevel) + 792) * (1 - (defIgnore + defShred) / 100);
    enemyDef = enemyDef > 0 ? enemyDef : 0;
    const defMult = (800 + 8 * charLevel) / (800 + 8 * charLevel + enemyDef);

    const perStackDmg = perStack * (1 + bonus / 100) * (resMult * defMult);
    const totalDmg = total * (1 + bonus / 100) * (resMult * defMult);

    return {frazzleTotal: totalDmg, frazzle: perStackDmg };
}

export function calculateAeroErosionDamage(combatState, mergedBuffs, characterLevel) {
    const stacks = combatState?.aeroErosion ?? 0;
    if (stacks === 0) return 0;

    let perStack = 0;

    if (stacks === 1) {
        perStack = 1655.1;
    } else if (stacks >= 1) {
        perStack = 4133.45 * stacks - 4132.37
    }

    const total = 0;
    const bonus = mergedBuffs?.damageTypeAmplify.aeroErosion ?? 0;

    const enemyLevel = combatState.enemyLevel ?? 1;
    const charLevel = characterLevel;

    const resShred = mergedBuffs?.enemyResShred ?? 0;
    const enemyRes = (combatState.enemyRes ?? 0) - resShred;

    let resMult = 1;
    if (enemyRes < 0) {
        resMult = 1 - enemyRes / 200;
    } else if (enemyRes < 75) {
        resMult = 1 - enemyRes / 100;
    } else {
        resMult = 1 / (1 + 5 * (enemyRes / 100));
    }

    const defIgnore = (mergedBuffs?.enemyDefIgnore ?? 0);
    const defShred = (mergedBuffs?.enemyDefShred ?? 0);
    let enemyDef = ((8 * enemyLevel) + 792) * (1 - (defIgnore + defShred) / 100);
    enemyDef = enemyDef > 0 ? enemyDef : 0;
    const defMult = (800 + 8 * charLevel) / (800 + 8 * charLevel + enemyDef);

    const perStackDmg = perStack * (1 + bonus / 100) * (resMult * defMult);
    const totalDmg = total * (1 + bonus / 100) * (resMult * defMult);

    return { erosionTotal: totalDmg, erosion: perStackDmg };
}