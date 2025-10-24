import { computeSkillDamage, getSkillData } from "./computeSkillDamage.js";
import { getHardcodedMultipliers } from "../data/character-behaviour";
import { calculateAeroErosionDamage, calculateSpectroFrazzleDamage } from "./damageCalculator.js";
import { elementToAttribute } from "./attributeHelpers.js";
import { echoAttackMultipliers, echoElements } from "../data/echoes/echoMultipliers";

export function prepareDamageData({
                                      activeCharacter,
                                      charId,
                                      finalStats,
                                      characterLevel,
                                      sliderValues,
                                      characterRuntimeStates,
                                      combatState,
                                      mergedBuffs,
                                      skillTabs,
                                      getAllSkillLevels
                                  }) {
    if (!activeCharacter) return { charSkillResults: [], echoSkillResults: [], negativeEffects: [] };

    const charSkillResults = [];
    const echoSkillResults = [];
    const negativeEffects = [];

    const { frazzle } = calculateSpectroFrazzleDamage(combatState, mergedBuffs, characterLevel);
    const { erosion } = calculateAeroErosionDamage(combatState, mergedBuffs, characterLevel);

    if (frazzle > 0) {
        negativeEffects.push({
            name: 'Spectro Frazzle',
            tab: 'negativeEffect',
            skillType: 'spectroFrazzle',
            normal: Math.floor(frazzle),
            crit: Math.floor(frazzle),
            avg: Math.floor(frazzle),
            isSupportSkill: false,
            element: 'spectro',
            visible: true,
            supportLabel: null,
            supportColor: null
        });
    }

    if (erosion > 0) {
        negativeEffects.push({
            name: 'Aero Erosion',
            tab: 'negativeEffect',
            skillType: 'aeroErosion',
            normal: Math.floor(erosion),
            crit: Math.floor(erosion),
            avg: Math.floor(erosion),
            isSupportSkill: false,
            element: 'aero',
            visible: true,
            supportLabel: null,
            supportColor: null
        });
    }

    const mainEcho = characterRuntimeStates?.[charId]?.equippedEchoes?.[0];
    if (mainEcho) {
        const echoId = mainEcho.id ?? mainEcho.name?.toLowerCase();
        const echoElement = echoElements[echoId] ?? elementToAttribute[activeCharacter?.attribute] ?? "";
        const rawMultipliers = echoAttackMultipliers[echoId];

        if (rawMultipliers) {
            const skillArrays = Array.isArray(rawMultipliers[0]) ? rawMultipliers : [rawMultipliers];

            skillArrays.forEach((skillArray, skillIndex) => {
                if (!Array.isArray(skillArray) || skillArray.length < 5) return;
                const rawMultiplier = skillArray[4];
                const tempLabelBase =
                    skillArrays.length === 1 ? mainEcho.name : `${mainEcho.name} Skill ${skillIndex + 1}`;

                const result = computeSkillDamage({
                    entry: { label: tempLabelBase, detail: "echoSkill", tab: "echoAttacks", echoId },
                    levelData: { Name: tempLabelBase, Param: [rawMultiplier], Type: "echoSkill" },
                    activeCharacter,
                    characterRuntimeStates,
                    finalStats,
                    combatState,
                    mergedBuffs,
                    echoElement,
                    sliderValues,
                    characterLevel,
                });

                const tags = result.skillMeta?.tags ?? [];
                const suffix = tags.includes("healing")
                    ? " Healing"
                    : tags.includes("shielding")
                        ? " Shield"
                        : skillArrays.length > 1
                            ? ` Skill ${skillIndex + 1}`
                            : "";

                const label = `${mainEcho.name}${suffix}`;
                const { normal, crit, avg, subHits } = result;

                echoSkillResults.push({
                    name: label,
                    skillType: "echoSkill",
                    tags,
                    element: echoElement ?? result.skillMeta?.element,
                    normal,
                    crit,
                    avg,
                    subHits,
                    visible: true,
                    custSkillMeta: result.skillMeta,
                    tab: 'echoAttacks'
                });
            });
        }
    }

    const allLevels = getAllSkillLevels(charId, activeCharacter, skillTabs);

    for (const tab of skillTabs) {
        //const skill = getSkillData(activeCharacter, tab);
        const levels = allLevels[tab] ?? [];

        levels.forEach((level) => {
            const result = computeSkillDamage({
                entry: { label: level.Name, detail: level.Type ?? tab, tab },
                levelData: level,
                activeCharacter,
                characterRuntimeStates,
                finalStats,
                combatState,
                mergedBuffs,
                sliderValues,
                characterLevel,
                getSkillData,
            });

            const { normal, crit, avg, skillMeta = {} } = result;
            const isSupportSkill =
                skillMeta.tags?.includes("healing") || skillMeta.tags?.includes("shielding");
            const supportColor = skillMeta.tags?.includes("healing") ? "limegreen" : "#838383";

            charSkillResults.push({
                name: level.label ?? level.Name,
                tab,
                skillType: result.skillMeta?.skillType ?? "basic",
                statWeight: skillMeta.statWeight ?? {},
                normal,
                crit,
                avg,
                isSupportSkill,
                supportColor,
                supportLabel: skillMeta.tags?.includes("healing")
                    ? "Healing"
                    : skillMeta.tags?.includes("shielding")
                        ? "Shield"
                        : null,
                element: skillMeta.element ?? elementToAttribute[activeCharacter?.attribute],
                visible: skillMeta.visible ?? true,
                subHits: result.subHits ?? [],
                custSkillMeta: result.skillMeta
            });
        });
    }

    return { charSkillResults, echoSkillResults, negativeEffects };
}

export function getEffectiveSkillLevels(charId, activeCharacter, tab, skill) {
    let levels = [];

    if (skill?.Level) {
        levels = Object.values(skill.Level).filter(
            (level) =>
                Array.isArray(level.Param?.[0]) &&
                level.Param[0].some((v) => typeof v === "string" && v.includes("%"))
        );
    }

    const extra = getHardcodedMultipliers(charId, activeCharacter)?.[tab] ?? [];
    const customLevels = extra.map((entry) => ({ ...entry, Name: entry.name }));

    if (levels.length === 0) levels = customLevels;
    else {
        const existingNames = levels.map((l) => l.Name);
        const newCustom = customLevels.filter((e) => !existingNames.includes(e.Name));

        levels = levels
            .map((level) => {
                const match = customLevels.find((e) => e.Name === level.Name);
                return match ? { ...level, ...match, visible: match.visible ?? true } : level;
            })
            .concat(newCustom);
    }

    return levels.map((level) => {
        let label = level.Name;
        const skillName = skill?.Name ?? "";


        if (label === 'Skill DMG' || label === 'Skill Dmg' || label === 'Skill Damage') {
            label = `${skillName} DMG`;
        } else if (label === 'Healing' || label === 'Shielding' || label === 'Shield') {
            label = `${skillName} ${label}`;
        }

        return { ...level, label };
    });
}

export function getAllSkillLevelsWithEcho({ charId, activeCharacter, characterRuntimeStates, allSkillLevels }) {
    const merged = structuredClone(allSkillLevels ?? {});
    const mainEcho = characterRuntimeStates?.[charId]?.equippedEchoes?.[0];

    if (!mainEcho) return merged;

    const echoId = mainEcho.id ?? mainEcho.name?.toLowerCase();
    const echoElement = echoElements[echoId] ?? elementToAttribute[activeCharacter?.attribute] ?? "";
    const rawMultipliers = echoAttackMultipliers[echoId];

    if (!rawMultipliers) return merged;

    const skillArrays = Array.isArray(rawMultipliers[0]) ? rawMultipliers : [rawMultipliers];
    const echoSkillLevels = [];

    skillArrays.forEach((skillArray, skillIndex) => {
        if (!Array.isArray(skillArray) || skillArray.length < 5) return;

        const rawMultiplier = skillArray[4];
        const value = Array.isArray(rawMultiplier) ? rawMultiplier[0] : rawMultiplier;

        const paramArray = Array(20).fill(value);

        const label =
            skillArrays.length === 1
                ? mainEcho.name
                : `${mainEcho.name} Skill ${skillIndex + 1}`;

        echoSkillLevels.push({
            Name: label,
            Param: [paramArray],
            Type: "echoSkill",
            Format: null,
            Element: echoElement,
        });
    });

    merged.echoAttacks = echoSkillLevels;

    return merged;
}