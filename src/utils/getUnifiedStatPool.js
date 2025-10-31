export function getUnifiedStatPool(buffSources, overrideLogic = null) {
    let merged = {
        atkFlat: 0,
        hpFlat: 0,
        defFlat: 0,
        atkPercent: 0,
        hpPercent: 0,
        defPercent: 0,
        critRate: 0,
        critDmg: 0,
        energyRegen: 0,
        healingBonus: 0,
        basicAtk: 0,
        heavyAtk: 0,
        resonanceSkill: 0,
        resonanceLiberation: 0,
        introAtk: 0,
        coord: 0,
        echoSkill: 0,
        outroAtk: 0,
        aero: 0,
        glacio: 0,
        spectro: 0,
        fusion: 0,
        electro: 0,
        havoc: 0,
        outroAmplify: 0,
        elementBonus: 0,
        enemyResShred: 0,
        enemyDefShred: 0,
        enemyDefIgnore: 0,
        flatDmg: 0,
        dmgReduction: 0,
        elementDmgReduction: 0,
        damageTypeAmplify: {},
        elementDmgAmplify: {},
        spectroFrazzleDmg: 0,
        aeroErosionDmg: 0,
        physical: 0,
        negativeStatus: {}
    };

    const ELEMENT_KEYS = ['aero', 'glacio', 'spectro', 'fusion', 'electro', 'havoc', 'physical'];

    for (const source of buffSources) {
        for (const [key, rawVal] of Object.entries(source ?? {})) {
            const val = Number(rawVal ?? 0);
            if (key === 'damageTypeAmplify') {
                for (const [typeKey, typeVal] of Object.entries(rawVal ?? {})) {
                    merged.damageTypeAmplify[typeKey] = (merged.damageTypeAmplify[typeKey] ?? 0) + Number(typeVal ?? 0);
                }
            } else if (key === 'elementDmgAmplify') {
                for (const [elKey, elVal] of Object.entries(rawVal ?? {})) {
                    merged.elementDmgAmplify[elKey] = (merged.elementDmgAmplify[elKey] ?? 0) + Number(elVal ?? 0);
                }
            } else if (key === 'coordAmplify') {
                merged.damageTypeAmplify.coord = (merged.damageTypeAmplify.coord ?? 0) + val;
            } else if (['spectroFrazzleDmg', 'aeroErosionDmg', 'coord'].includes(key)) {
                merged[key] += val;
            } else if (ELEMENT_KEYS.includes(key)) {
                merged[key] += val;
            } else if (merged[key] !== undefined) {
                merged[key] += val;
            }
        }
    }

    if (overrideLogic?.modifyUnifiedStats) {
        const result = overrideLogic.modifyUnifiedStats({
            mergedBuffs: merged,
            combatState: overrideLogic.combatState ?? {},
            skillMeta: overrideLogic.skillMeta ?? {},
            characterState: overrideLogic.characterState ?? {},
            isActiveSequence: overrideLogic.isActiveSequence ?? (() => false),
            isToggleActive: overrideLogic.isToggleActive ?? (() => false),
            characterLevel: overrideLogic.characterLevel ?? 1
        });

        if (result?.mergedBuffs) {
            merged = result.mergedBuffs;
        }
    }

    return merged;
}