export function applyZaniLogic({
                               mergedBuffs,
                               combatState,
                               skillMeta,
                               characterState,
                               isActiveSequence = () => false,
                               isToggleActive = () => false,
                           }) {
    skillMeta = {
        ...skillMeta,

        name: skillMeta?.name ?? '',
        skillType: Array.isArray(skillMeta?.skillType)
            ? [...skillMeta.skillType]
            : skillMeta?.skillType
                ? [skillMeta.skillType]
                : [],
        multiplier: skillMeta?.multiplier ?? 1,
        amplify: skillMeta?.amplify ?? 0
    };

    const isToggleActiveLocal = (key) => characterState?.activeStates?.[key] === true;
    const name = skillMeta.name?.toLowerCase() ?? '';
    const tab = skillMeta.tab ?? '';
    const ember = characterState?.activeStates?.ember ?? 0;

    if (tab === 'resonanceSkill') {
        if (name.includes('targeted') || name.includes('forcible')) {
            skillMeta.skillType = ['skill', 'spectroFrazzle'];
        }
    } else if (tab === 'forteCircuit') {
        skillMeta.skillType = ['heavy', 'spectroFrazzle'];
    } else if (tab === 'outroSkill') {
        skillMeta.skillType = ['outro', 'spectroFrazzle'];
        skillMeta.multiplier = 1.5;
        skillMeta.skillDmgBonus = (skillMeta.skillDmgBonus ?? 0) + ember * 10;
    }

    if (characterState?.activeStates?.sunburst && !mergedBuffs.__zaniSunburst) {
        mergedBuffs.skillType.spectroFrazzle.amplify += 20;
        mergedBuffs.__zaniSunburst = true;
    }

    if (name === 'basic attack multiplier increase') {
        characterState.activeStates.__infernoValue = skillMeta.multiplier;
        skillMeta.visible = false;
    }

    if (tab === 'normalAttack' && !name.includes('heavy') && characterState?.activeStates?.inferno) {
        skillMeta.multiplier *= (1 + characterState.activeStates.__infernoValue);
    }

    if (name === 'additional multiplier per blaze') {
        characterState.activeStates.__blazeValue = skillMeta.multiplier;
        skillMeta.visible = false;
    }

    if (name === 'heavy slash - nightfall dmg') {
        const stacks = characterState?.activeStates?.blaze ?? 0;
        const perStack = characterState?.activeStates?.__blazeValue ?? 0;
        const bonusMultiplier = Math.min(stacks * perStack, perStack * 40);
        skillMeta.multiplier += bonusMultiplier;
    }

    if (isToggleActiveLocal('inherent1') && !mergedBuffs.__ZaniInherent1) {
        mergedBuffs.attribute.spectro.dmgBonus += 12;
        mergedBuffs.__ZaniInherent1 = true;
    }

    if (isToggleActive(1) && isActiveSequence(1) && !mergedBuffs.__zaniS1) {
        mergedBuffs.attribute.spectro.dmgBonus += 50;
        mergedBuffs.__zaniS1 = true;
    }

    if (isActiveSequence(2)) {
        if (!mergedBuffs.__zaniS2) {
            mergedBuffs.critRate += 20;
            mergedBuffs.__zaniS2 = true;
        }
        if (name.includes('forcible') || name.includes('targeted')) {
            skillMeta.multiplier *= 1.8;
        }
    }

    const blazeS3 = characterState?.toggles?.['3_value'] ?? 0;
    if (isActiveSequence(3) && name.includes('the last stand')) {
        skillMeta.multiplier += Math.min(blazeS3 * 8, 1200)/100;
    }

    if (isToggleActive(4) && isActiveSequence(4) && !mergedBuffs.__zaniS4) {
        mergedBuffs.atk.percent += 20;
        mergedBuffs.__zaniS4 = true;
    }

    if (isActiveSequence(5) && name.includes('rekindle')) {
        skillMeta.multiplier *= 2.2;
    }

    if (isActiveSequence(6) && tab === 'forteCircuit') {
        skillMeta.multiplier *= 1.4;
    }

    return {mergedBuffs, combatState, skillMeta};
}

export const zaniMultipliers = { outroSkill: [ { name: "Beacon For the Future DMG" } ] };

export function zaniBuffsLogic({
                                   mergedBuffs, characterState
                               }) {
    const state = characterState?.activeStates ?? {};

    if (state.beacon) {
        mergedBuffs.attribute.spectro.amplify = (mergedBuffs.attribute.spectro.amplify ?? 0) + 20;
    }

    if (state.efficiency) {
        mergedBuffs.atk.percent = (mergedBuffs.atk.percent ?? 0) + 20;
    }

    return { mergedBuffs };
}