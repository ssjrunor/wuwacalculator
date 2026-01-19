export function applyAemeathLogic({
                                       mergedBuffs,
                                       combatState,
                                       skillMeta,
                                       characterState,
                                       isActiveSequence = () => false,
                                       isToggleActive = () => false,
                                       characterLevel = 1,
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
        amplify: skillMeta?.amplify ?? 0,
    };

    const name = skillMeta.name?.toLowerCase() ?? '';
    const tab = skillMeta.tab ?? '';
    const state = characterState?.activeStates ?? {};
    const toggles = characterState?.toggles ?? {};
    const rupture = state.tuneRupture;
    const burst = state.fusionBurst;
    const eitherMode = burst || rupture;

    if (tab === 'tuneBreak' || name.includes('tune rupture') ||
        name.includes('duet of seraphic plumes bonus')) {
        skillMeta.skillType = 'tuneRupture';
        if (tab !== 'tuneBreak') {
            skillMeta.element = 'fusion';
            skillMeta.tuneAmp = skillMeta.multiplier ?? skillMeta.tuneAmp;
        }
        skillMeta.dmgType = 'tuneBreak';
    } else if (name.includes('heavy attack') ||
    name.includes('duet of seraphic plumes')) skillMeta.skillType = ['ultimate'];


    if (name.includes('heavy attack') && state.instantResponse) {
        if (characterLevel >= 50) skillMeta.amplify = (skillMeta.amplify ?? 0) + 200;
        if (isActiveSequence(1)) {
            skillMeta.skillCritDmg = (skillMeta.skillCritDmg ?? 0) + 300;
        }
    }

    let inherent2Stacks = isActiveSequence(3) ? 3 : Math.min(Number(state.aemeathInherent2Stacks ?? 0), 2);
    if (!mergedBuffs.__aemeathInherent2 && eitherMode) {
        mergedBuffs.critDmg += inherent2Stacks * 30;
        mergedBuffs.__aemeathInherent2 = true;
    }
    if (
        name.includes('starbreak falls - finale') && eitherMode &&
        (isActiveSequence(4) ||
            inherent2Stacks >= 2)) skillMeta.skillDefIgnore = (skillMeta.skillDefIgnore ?? 0) + 20;

    if (isActiveSequence(2)) {
        if (name.includes('duet of seraphic plumes')) {
            skillMeta.multiplier *= 2;
        }
        const ruptureStacks = Math.min(Number(toggles['2_stacks'] ?? 0), 5);
        if (ruptureStacks > 0 && name.includes('duet of seraphic plumes bonus')) {
            skillMeta.multiplier *= (1 + 0.2 * ruptureStacks);
        }
    }

    if (isActiveSequence(3) && name.includes('heavenfall falls - finale')) {
        skillMeta.multiplier *= 2;
    }

    if (isActiveSequence(4) && isToggleActive(4) && !mergedBuffs.__aemeathS4) {
        mergedBuffs.attribute.all.dmgBonus += 20;
        mergedBuffs.__aemeathS4 = true;
    }

    if (isActiveSequence(6)) {
        mergedBuffs.skillType.resonanceLiberation.dmgVuln += 40;

        if (rupture && skillMeta.dmgType === 'tuneBreak') {
            skillMeta.tuneBreakCr = Math.max(skillMeta.tuneBreakCr ?? 0, 0.8);
            skillMeta.tuneBreakCd = Math.max(skillMeta.tuneBreakCd ?? 0, 2.75);
        }
/*

        if (mode === 'fusionburst' && name.includes('fusion burst')) {
            skillMeta.skillCritRate = Math.max(skillMeta.skillCritRate ?? 0, 80);
            skillMeta.skillCritDmg = Math.max(skillMeta.skillCritDmg ?? 0, 275);
        }
*/

        // Doubling trail stacks and the increased cap are left as a note because the calc does not track per-target trails yet.
    }

    return {mergedBuffs, combatState, skillMeta};
}

export const aemeathMultipliers = {};

export function aemeathBuffsLogic({
                                        mergedBuffs, characterState
                                    }) {
    const state = characterState?.activeStates ?? {};

    if (state.aemeathOutroActive) {
        mergedBuffs.attribute.all.amplify += 10;
        if (state.aemeathOutroTrigger) mergedBuffs.attribute.all.amplify += 20;
    }

    if (state.aemeathS4Buff) {
        mergedBuffs.attribute.all.dmgBonus += 20;
    }

    return { mergedBuffs };
}
