export function applyIunoLogic({
                                   mergedBuffs,
                                   combatState,
                                   skillMeta,
                                   characterState,
                                   isActiveSequence = () => false,
                                      isToggleActive = () => false,
                                      characterLevel = 1,
                                      finalStats
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

    const name = skillMeta.name?.toLowerCase();
    const tab = skillMeta.tab ?? '';

    if (tab === 'forteCircuit' || name.includes('arc beyond the edge') || name.includes('moonbow')) {
        skillMeta.skillType = 'ultimate';
    }

    if (name.includes('waxing ascent')) {
        skillMeta.visible = characterLevel >= 50;
        skillMeta.multiplier = 0.32;
    }

    if (name.includes('gloom to gleam')) {
        skillMeta.multiplier = 1;
    }

    const wanLightStacks = characterState?.activeStates?.wanLight ?? 0;
    const wanLight = Math.min(wanLightStacks * 4, 4 * 10);
    if (!mergedBuffs.__iunoWanLight) {
        mergedBuffs.attribute.all.amplify += wanLight;
        mergedBuffs.__iunoWanLight = true;
    }

    if (isActiveSequence(1) && isToggleActive(1) && !mergedBuffs.__iunoS1) {
        mergedBuffs.atk.percent += 40;
        mergedBuffs.__iunoS1 = true;
    }

    if (isActiveSequence(2) && wanLightStacks >= 10) {
        mergedBuffs.attribute.all.amplify += 40;
        mergedBuffs.__iunoS2 = true;
    }

    if (isActiveSequence(3) && isToggleActive(3)) {
        const affectedSkills = [
            'moonbow',
            'arc beyond the edge',
            'thunderoar: uppercut',
        ];
        const isAffected = affectedSkills.some(skill => name?.includes(skill));

        if (isAffected) {
            skillMeta.amplify = (skillMeta.amplify ?? 0) + 65;
        }
    }

    if (name.includes('rainy season dwell in my eyes')) {
        skillMeta.visible = isActiveSequence(4);
        skillMeta.multiplier = 1.6;
    }

    if (isActiveSequence(5) && !mergedBuffs.__iunoS5) {
        mergedBuffs.skillType.resonanceLiberation.dmgBonus += 20;
        mergedBuffs.__iunoS5 = true;
    }

    if (name.includes('absolute fullness dmg') && isActiveSequence(6)) {
        skillMeta.multiplier *= 17;
    }

    return {mergedBuffs, combatState, skillMeta};
}

export const iunoMultipliers = {
    forteCircuit: [
        {
            name: "Inherent Skill: Waxing Ascent Shield",
            scaling: { atk: 1 },
            shielding: true,
        },
        {
            name: "Rainy Season Dwell in My Eyes: Shield",
            scaling: { atk: 1 },
            shielding: true,
        },
        {
            name: "Moonbow - Basic Attack 1 Healing",
            scaling: { atk: 1 },
            healing: true
        },
        {
            name: "Moonbow - Basic Attack 2 Healing",
            scaling: { atk: 1 },
            healing: true
        },
        {
            name: "Moonbow - Basic Attack 3 Healing",
            scaling: { atk: 1 },
            healing: true
        },
        {
            name: "Moonbow - Dodge Counter Healing",
            scaling: { atk: 1 },
            healing: true
        },
        {
            name: "Arc Beyond the Edge Healing",
            scaling: { atk: 1 },
            healing: true
        },
        {
            name: "Absolute Fullness Healing",
            scaling: { atk: 1 },
            healing: true
        },
        {
            name: "Full Moon Domain Healing",
            scaling: { atk: 1 },
            healing: true
        }
    ],
    outroSkill: [
        {
            name: "From Gloom to Gleam DMG",
            scaling: { atk: 1 },
        }
    ]
};


export function iunoBuffsLogic({
                                   mergedBuffs, characterState
                               }) {
    const state = characterState?.activeStates ?? {};

    const wanLightStacks = state?.wanLight ?? 0;
    const wanLight = Math.min(wanLightStacks * 4, 4 * 10);

    mergedBuffs.attribute.all.amplify += wanLight;

    if (wanLightStacks >= 10 && state.iunoS2) {
        mergedBuffs.attribute.all.amplify += 40;
    }

    if (state.gloomtoGleam) {
        mergedBuffs.skillType.heavyAtk.amplify += 50;
    }

    return { mergedBuffs };
}