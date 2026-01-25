export const getStatsForLevel = (statsObj, level) => {
    for (const [stage, levels] of Object.entries(statsObj ?? {})) {
        const min = Math.min(...Object.keys(levels).map(Number));
        const max = Math.max(...Object.keys(levels).map(Number));
        if (level >= min && level <= max) {
            return levels[String(level)] ?? {};
        }
    }
    return {};
};


const ELEMENT_KEYS = ['aero', 'glacio', 'spectro', 'fusion', 'electro', 'havoc', 'physical'];

const SKILL_TYPE_KEYS = [
    'all',
    'basicAtk',
    'heavyAtk',
    'resonanceSkill',
    'resonanceLiberation',
    'introSkill',
    'coord',
    'echoSkill',
    'outroSkill',
    'spectroFrazzle',
    'aeroErosion',
    'havocBane',
    'electroFlare'
];

function cloneModBuff(mod = {}) {
    return {
        resShred: mod.resShred ?? 0,
        dmgBonus: mod.dmgBonus ?? 0,
        amplify: mod.amplify ?? 0,
        defIgnore: mod.defIgnore ?? 0,
        defShred: mod.defShred ?? 0,
        dmgVuln: mod.dmgVuln ?? 0,
        critRate: mod.critRate ?? 0,
        critDmg: mod.critDmg ?? 0
    };
}

export function getFinalStats(
    activeCharacter,
    baseCharacterState,
    characterLevel,
    mergedBuffs,
    combatState
) {
    const baseStats = getStatsForLevel(activeCharacter?.raw?.Stats, characterLevel) ?? {};
    const charExtra = baseCharacterState?.Stats ?? {};
    const buffs = mergedBuffs ?? {};
    const attrBuffs = buffs.attribute ?? {};
    const skillTypeBuffs = buffs.skillType ?? {};

    // -------------------------
    // ATK / HP / DEF
    // -------------------------
    const weaponBaseAtk = combatState?.weaponBaseAtk ?? 0;
    const characterBaseAtk = baseStats['Atk'] ?? 0;
    const atkBase = characterBaseAtk + weaponBaseAtk;
    const atkPercent = buffs.atk?.percent ?? 0;
    const atkFlat = buffs.atk?.flat ?? 0;
    const atkFinal = atkBase * (1 + atkPercent / 100) + atkFlat;

    const hpBase = baseStats['Life'] ?? 0;
    const hpPercent = buffs.hp?.percent ?? 0;
    const hpFlat = buffs.hp?.flat ?? 0;
    const hpFinal = hpBase * (1 + hpPercent / 100) + hpFlat;

    const defBase = baseStats['Def'] ?? 0;
    const defPercent = buffs.def?.percent ?? 0;
    const defFlat = buffs.def?.flat ?? 0;
    const defFinal = defBase * (1 + defPercent / 100) + defFlat;

    // -------------------------
    // Attribute bucket
    // (base element dmg bonus + all/element buffs)
    // -------------------------
    const attribute = {};

    // global attribute "all" – purely from buffs
    if (attrBuffs.all) {
        attribute.all = cloneModBuff(attrBuffs.all);
    } else {
        attribute.all = cloneModBuff();
    }

    for (const element of ELEMENT_KEYS) {
        const baseElementDmg = charExtra[`${element}DmgBonus`] ?? 0;

        const fromAll = attrBuffs.all ?? {};
        const fromElement = attrBuffs[element] ?? {};

        // total for this element = base + buffs
        attribute[element] = {
            resShred: (fromAll.resShred ?? 0) + (fromElement.resShred ?? 0),
            dmgBonus:
                baseElementDmg +
                (fromAll.dmgBonus ?? 0) +
                (fromElement.dmgBonus ?? 0),
            amplify: (fromAll.amplify ?? 0) + (fromElement.amplify ?? 0),
            defIgnore: (fromAll.defIgnore ?? 0) + (fromElement.defIgnore ?? 0),
            defShred: (fromAll.defShred ?? 0) + (fromElement.defShred ?? 0),
            dmgVuln: (fromAll.dmgVuln ?? 0) + (fromElement.dmgVuln ?? 0),
            critRate: (fromAll.critRate ?? 0) + (fromElement.critRate ?? 0),
            critDmg: (fromAll.critDmg ?? 0) + (fromElement.critDmg ?? 0)
        };
    }

    // -------------------------
    // SkillType bucket
    // (base skill-type bonuses + buffs; base usually 0)
    // -------------------------
    const skillType = {};

    for (const key of SKILL_TYPE_KEYS) {
        const buff = skillTypeBuffs[key] ?? {};

        skillType[key] = {
            resShred: buff.resShred ?? 0,
            dmgBonus: (buff.dmgBonus ?? 0),
            amplify: buff.amplify ?? 0,
            defIgnore: buff.defIgnore ?? 0,
            defShred: buff.defShred ?? 0,
            dmgVuln: buff.dmgVuln ?? 0,
            critRate: buff.critRate ?? 0,
            critDmg: buff.critDmg ?? 0
        };
    }

    // -------------------------
    // Global scalar stats
    // -------------------------
    const critRate =
        (charExtra.critRate ?? 0) +
        (buffs.critRate ?? 0);

    const critDmg =
        (charExtra.critDmg ?? 0) +
        (buffs.critDmg ?? 0);

    const energyRegen =
        (charExtra.energyRegen ?? 0) +
        (buffs.energyRegen ?? 0);

    const healingBonus =
        (charExtra.healingBonus ?? 0) +
        (buffs.healingBonus ?? 0);

    const shieldBonus =
        (charExtra.shieldBonus ?? 0) +
        (buffs.shieldBonus ?? 0);

    const dmgBonus =
        (buffs.dmgBonus ?? 0);


    // -------------------------
    // Final shape
    // -------------------------
    return {
        atk: {
            base: atkBase,
            final: atkFinal
        },
        hp: {
            base: hpBase,
            final: hpFinal
        },
        def: {
            base: defBase,
            final: defFinal
        },
        attribute,
        skillType,
        critRate,
        critDmg,
        energyRegen,
        healingBonus,
        shieldBonus,
        dmgBonus,
        tuneBreakBoost: buffs.tuneBreakBoost,
        special: buffs.special ?? 0,
    };
}
