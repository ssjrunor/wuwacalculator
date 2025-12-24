import {getCharacterOverride, skillMetaBuffsLogic} from "../data/characters/behavior/index.js";
import {getWeaponOverride} from "../data/weapons/behavior/index.js";
import {calculateSupportEffect} from "./supportCalculator.js";
import {calculateDamage} from "./damageCalculator.js";
import {elementToAttribute} from './attributeHelpers.js';
import {echoScalingRatios} from "../data/echoes/echoMultipliers.js";
import {mainEchoBuffs} from "../data/buffs/setEffect.js";
import {getSetCounts} from "./echoHelper.js";
import {getEchoSetSkillMeta} from "../data/set-behaviour/index.js";
import {applyWeaponSkillMetaBuffLogic} from "../data/buffs/weaponBuffs.js";
import {typeMap} from "../constants/skillTabs.js";

export function computeSkillDamage({
                                       entry,
                                       levelData,
                                       activeCharacter,
                                       characterRuntimeStates,
                                       finalStats,
                                       combatState,
                                       mergedBuffs,
                                       sliderValues,
                                       characterLevel,
                                       echoElement,
                                       returnContextOnly = false

                                   }) {
    const charId = activeCharacter?.Id ?? activeCharacter?.id ?? activeCharacter?.link;
    let element = elementToAttribute[activeCharacter?.attribute] ?? echoElement ?? '';

    const characterState = {
        activeStates: characterRuntimeStates?.[charId]?.activeStates ?? {},
        toggles: characterRuntimeStates?.[charId]?.sequenceToggles ?? {},
    };

    const isActiveSequence = (n) => sliderValues?.sequence >= n;
    const isToggleActive = (id) => characterState.toggles?.[id] || characterState.activeStates?.[id];

    const label = entry.label;
    let skillType = entry.detail?.toLowerCase?.() || '';

    if (!['basic', 'heavy', 'skill', 'ultimate', 'intro', 'outro', 'echoSkill', 'tuneBreak'].includes(skillType)) {
        const label = entry.label?.toLowerCase?.() ?? '';

        if (entry.tab === 'echoAttacks' || label.includes('echo attacks')) {
            skillType = 'echoSkill';
        } else if (label.includes('heavy attack') || label.includes('aimed shot')) {
            skillType = 'heavy';
        } else if (entry.tab === 'resonanceSkill') {
            skillType = 'skill';
        } else if (entry.tab === 'resonanceLiberation') {
            skillType = 'ultimate';
        } else if (entry.tab === 'normalAttack') {
            skillType = 'basic';
        } else if (entry.tab === 'introSkill') {
            skillType = 'intro';
        } else if (entry.tab === 'outroSkill') {
            skillType = 'outro';
        } else if (entry.tab === 'tuneBreak') {
            skillType = 'tuneRupture';
            element = '';
        } else {
            skillType = 'basic';
        }
    }
    const tab = entry.tab;

    let rawMultiplier = '0%';
    if (levelData?.Param) {
        rawMultiplier = typeof levelData.Param[0] === 'string'
            ? levelData.Param[0]
            : levelData.Param?.[0]?.[sliderValues?.[tab] - 1] ?? '0%';
    }

    const { flat, percent } = extractFlatAndPercent(rawMultiplier);
    const parsedMultiplier = parseCompoundMultiplier(rawMultiplier);

    let skillMeta = {
        name: label,
        skillType,
        multiplier: parsedMultiplier || 1,
        amplify: 0,
        tab,
        visible: true,
        tags: [
            ...(levelData?.healing ? ['healing'] : []),
            ...(levelData?.shielding ? ['shielding'] : [])
        ],
        element: element
    };

    let localMergedBuffs = structuredClone(mergedBuffs);

    const override = getCharacterOverride(charId);
    if (override) {
        const result = override({
            mergedBuffs: localMergedBuffs,
            combatState,
            skillMeta,
            characterState,
            isActiveSequence,
            isToggleActive,
            baseCharacterState: activeCharacter,
            sliderValues,
            getSkillData,
            finalStats,
            element,
            characterLevel
        });
        skillMeta = result.skillMeta ?? skillMeta;
        localMergedBuffs = result.mergedBuffs ?? localMergedBuffs;
    }

    characterRuntimeStates[charId]?.Team?.forEach((id, index) => {
        if (!id || index === 0) return;

        const buffsLogic = skillMetaBuffsLogic(id);
        if (!buffsLogic) return;

        const characterState = {
            activeStates: characterRuntimeStates?.[charId]?.activeStates ?? {}
        };

        const result = buffsLogic({
            mergedBuffs,
            characterState,
            activeCharacter,
            combatState,
            skillMeta
        });

        if (result?.skillMeta) {
            skillMeta = result.skillMeta ?? skillMeta;
            localMergedBuffs = result.mergedBuffs ?? localMergedBuffs;
        }
    });

    const weaponSkillMetaBuffLogic = applyWeaponSkillMetaBuffLogic({
        mergedBuffs,
        characterState: {
            activeStates: characterRuntimeStates?.[charId]?.activeStates ?? {}
        },
        activeCharacter,
        skillMeta,
        combatState
    });
    skillMeta = weaponSkillMetaBuffLogic.skillMeta;

    const echoData = characterRuntimeStates?.[charId]?.equippedEchoes ?? [null, null, null, null, null];
    const setCounts = getSetCounts(echoData);
    for (const setId of Object.keys(setCounts)) {
        const skillMetaBuffs = getEchoSetSkillMeta(setId);
        if (skillMetaBuffs) {
            const result = skillMetaBuffs({
                mergedBuffs,
                activeStates: characterRuntimeStates?.[charId]?.activeStates ?? {},
                activeCharacter,
                combatState,
                skillMeta
            });

            if (result?.skillMeta) {
                skillMeta = result.skillMeta ?? skillMeta;
            }
        }
    }

    const weaponLogic = getWeaponOverride(combatState?.weaponId);

    if (typeof weaponLogic?.updateSkillMeta === 'function') {
        const currentParamValues = combatState.weaponParam?.map(
            p => p?.[Math.min(Math.max((combatState.weaponRank ?? 1) - 1, 0), 4)]
        ) ?? [];

        const result = weaponLogic.updateSkillMeta ({
            mergedBuffs: localMergedBuffs,
            combatState,
            skillMeta,
            characterState,
            isToggleActive,
            finalStats,
            element,
            currentParamValues,
            baseCharacterState: activeCharacter
        });

        skillMeta = result?.skillMeta ?? skillMeta;
        localMergedBuffs = result?.mergedBuffs ?? localMergedBuffs;
    }

    let scaling;
    if (entry.echoId && echoScalingRatios[entry.echoId]) {
        scaling = echoScalingRatios[entry.echoId];
    } else if (entry.echoId) {
        scaling = { atk: 1, hp: 0, def: 0, energyRegen: 0 };
    } else if (levelData.scaling) {
        scaling = levelData.scaling;
    } else {
        scaling = skillMeta.scaling ?? (
            characterRuntimeStates?.[charId]?.CalculationData?.skillScalingRatios?.[tab] ?? {
                atk: 1, hp: 0, def: 0, energyRegen: 0
            }
        );
    }

    if (!scaling) scaling = { atk: 1, hp: 0, def: 0, energyRegen: 0 };

    const mainEcho = characterRuntimeStates?.[charId]?.equippedEchoes?.[0];
    const echoBuffEntry = mainEcho && mainEchoBuffs?.[mainEcho.id];
    const echoModifier = echoBuffEntry?.skillMetaModifier;
    skillMeta.scaling = scaling ?? skillMeta?.scaling;

    if (typeof echoModifier === 'function') {
        skillMeta = echoModifier(skillMeta, {
            characterState: characterRuntimeStates?.[charId]?.activeStates,
            activeCharacter,
            combatState,
            charId
        }) ?? skillMeta;
    }
    skillMeta = buildSkillStatWeight(skillMeta);

    const tag = skillMeta.tags?.[0];
    const isSupportSkill = tag === 'healing' || tag === 'shielding';

    if (returnContextOnly) {
        const ctx = calculateDamage({
            finalStats,
            combatState,
            scaling,
            multiplier: skillMeta.multiplier,
            element: skillMeta.element,
            skillType: skillMeta.skillType,
            characterLevel,
            mergedBuffs: localMergedBuffs,
            amplify: skillMeta.amplify,
            skillDmgBonus: skillMeta.skillDmgBonus,
            critDmgBonus: skillMeta.critDmgBonus,
            critRateBonus: skillMeta.critRateBonus,
            skillDefIgnore: skillMeta.skillDefIgnore,
            skillResIgnore: skillMeta.skillResIgnore,
            skillCritDmg: skillMeta.skillCritDmg,
            skillCritRate: skillMeta.skillCritRate,
            fixedDmg: skillMeta.fixedDmg,
            skillDmgTaken: skillMeta.skillDmgTaken,

            returnContextOnly: true
        });

        return {
            ...ctx,
            skillMeta
        };
    }

    if (isSupportSkill) {
        const avg = skillMeta.flatOverride ?? calculateSupportEffect({
            finalStats,
            scaling: skillMeta.scaling,
            multiplier: skillMeta.multiplier,
            type: tag,
            skillHealingBonus: skillMeta.skillHealingBonus ?? 0,
            skillShieldBonus: skillMeta.skillShieldBonus ?? 0,
            flat
        });

        return { normal: 0, crit: 0, avg, skillMeta};
    }

    let { normal, crit, avg } = calculateDamage({
        finalStats,
        combatState,
        multiplier: skillMeta.multiplier,
        amplify: skillMeta.amplify,
        scaling: skillMeta.scaling,
        element: skillMeta.element ?? echoElement ?? element,
        skillType: skillMeta.skillType,
        characterLevel,
        mergedBuffs: localMergedBuffs,
        skillDmgBonus: skillMeta.skillDmgBonus ?? 0,
        critDmgBonus: skillMeta.critDmgBonus ?? 0,
        critRateBonus: skillMeta.critRateBonus ?? 0,
        skillDefIgnore: skillMeta.skillDefIgnore ?? 0,
        skillResIgnore: skillMeta.skillResIgnore ?? 0,
        skillCritDmg: skillMeta.skillCritDmg ?? 0,
        skillCritRate: skillMeta.skillCritRate ?? 0,
        fixedDmg: skillMeta.fixedDmg ?? null,
        skillDmgTaken: skillMeta.skillDmgTaken ?? 0,
    });

    let subHits = [];

    const rawMultiplierString = typeof levelData?.Param?.[0] === 'string'
        ? levelData.Param[0]
        : levelData.Param?.[0]?.[sliderValues?.[tab] - 1];

    const parts = parseMultiplierParts(rawMultiplierString);

    const rawTotalMultiplier = parts.reduce((sum, p) => {
        const val = parseFloat(p.value) / 100;
        return sum + val * p.count;
    }, 0);

    const overrideMultiplier = skillMeta.multiplier ?? rawTotalMultiplier;
    const multiplierRatio = rawTotalMultiplier > 0 ? (overrideMultiplier / rawTotalMultiplier) : 1;

    if (parts.length > 1 || (parts.length === 1 && parts[0].count > 1)) {
        subHits = [];

        for (const part of parts) {
            if (part.isFlat) {
                const flatValue = parseFloat(part.value);

                const { normal, crit, avg } = calculateDamage({
                    finalStats,
                    combatState,
                    flat: flatValue,
                    scaling,
                    element: skillMeta.element ?? echoElement ?? element,
                    skillType: skillMeta.skillType,
                    characterLevel,
                    mergedBuffs: localMergedBuffs,
                    amplify: skillMeta.amplify,
                    skillDmgBonus: skillMeta.skillDmgBonus ?? 0,
                    critDmgBonus: skillMeta.critDmgBonus ?? 0,
                    critRateBonus: skillMeta.critRateBonus ?? 0,
                    skillDefIgnore: skillMeta.skillDefIgnore ?? 0,
                    skillResIgnore: skillMeta.skillResIgnore ?? 0,
                    skillCritDmg: skillMeta.skillCritDmg ?? 0,
                    skillCritRate: skillMeta.skillCritRate ?? 0,
                    fixedDmg: skillMeta.fixedDmg ?? null,
                    skillDmgTaken: skillMeta.skillDmgTaken ?? 0,
                });

                subHits.push({
                    label: part.count > 1 ? `${part.count} Hits` : '',
                    count: part.count,
                    normal,
                    crit,
                    avg
                });

            } else {
                const baseMultiplier = parseFloat(part.value) / 100;
                const adjustedMultiplier = baseMultiplier * multiplierRatio;

                const oneHitMeta = structuredClone(skillMeta);
                oneHitMeta.multiplier = adjustedMultiplier;

                const { normal, crit, avg } = calculateDamage({
                    finalStats,
                    combatState,
                    multiplier: oneHitMeta.multiplier,
                    amplify: oneHitMeta.amplify,
                    scaling,
                    element: echoElement ?? element,
                    skillType: oneHitMeta.skillType,
                    characterLevel,
                    mergedBuffs: localMergedBuffs,
                    skillDmgBonus: oneHitMeta.skillDmgBonus ?? 0,
                    critDmgBonus: oneHitMeta.critDmgBonus ?? 0,
                    critRateBonus: oneHitMeta.critRateBonus ?? 0,
                    skillDefIgnore: oneHitMeta.skillDefIgnore ?? 0,
                    skillResIgnore: skillMeta.skillResIgnore ?? 0,
                    skillCritDmg: skillMeta.skillCritDmg ?? 0,
                    skillCritRate: skillMeta.skillCritRate ?? 0,
                    fixedDmg: skillMeta.fixedDmg ?? null,
                    skillDmgTaken: skillMeta.skillDmgTaken ?? 0,
                    name: levelData?.Name ?? ''
                });


                subHits.push({
                    label: part.count > 1 ? `${part.count} Hits` : '',
                    count: part.count,
                    normal,
                    crit,
                    avg
                });
            }
        }

        normal = subHits.reduce((sum, hit) => sum + hit.normal * hit.count, 0);
        crit = subHits.reduce((sum, hit) => sum + hit.crit * hit.count, 0);
        avg = subHits.reduce((sum, hit) => sum + hit.avg * hit.count, 0);
    }

    return { normal, crit, avg, skillMeta, subHits };
}

export function getSkillData(char, tab) {
    if (!char?.raw?.SkillTrees) return null;
    const tree = Object.values(char.raw.SkillTrees).find(tree =>
        tree.Skill?.Type?.toLowerCase?.().replace(/\s/g, '') === tab.toLowerCase()
    );
    return tree?.Skill ?? null;
}

export function parseCompoundMultiplier(formula) {
    if (!formula) return 0;

    const parts = formula.match(/\d+(\.\d+)?%(\*\d+)?/g);
    if (!parts) return 0;

    return parts.reduce((sum, part) => {
        const [percent, timesStr] = part.split('*');
        const value = parseFloat(percent.replace('%', '')) / 100;
        const times = timesStr ? parseInt(timesStr, 10) : 1;
        return sum + value * times;
    }, 0);
}

export function parseFlatComponent(formula) {
    if (!formula) return 0;

    const allNumbers = formula.match(/\d+(\.\d+)?/g)?.map(Number) ?? [];

    const percentMultiplier = parseCompoundMultiplier(formula) * 100;

    const total = allNumbers.reduce((sum, n) => sum + n, 0);
    return total - percentMultiplier;
}

export function extractFlatAndPercent(str) {
    const flatMatch = str.match(/^(\d+(\.\d+)?)/);
    const percentMatch = str.match(/(\d+(\.\d+)?)%/);
    const statMatch = str.match(/%[\s]*([a-zA-Z\s]+)/);

    return {
        flat: flatMatch ? parseFloat(flatMatch[1]) : 0,
        percent: percentMatch ? parseFloat(percentMatch[1]) / 100 : 0,
        stat: statMatch ? statMatch[1].trim().toLowerCase() : null
    };
}

export function parseMultiplierParts(multiplierString) {
    if (typeof multiplierString !== 'string') return [];

    const parts = multiplierString.match(/[\d.]+(%|\b)(\s*\*\s*\d+)?/g);
    if (!parts) return [];

    return parts.map(part => {
        const match = part.trim().match(/^([\d.]+)(%?)(\s*\*\s*(\d+))?$/);
        if (!match) return null;
        const [, value, percentSymbol, , repeat] = match;
        return {
            value,
            isFlat: percentSymbol !== '%',
            count: repeat ? parseInt(repeat, 10) : 1
        };
    }).filter(Boolean);
}

export function buildSkillStatWeight(skillMeta) {
    if (!skillMeta || typeof skillMeta !== "object") {
        console.warn("⚠️ Invalid skillMeta provided to buildSkillStatWeight()");
        return {};
    }

    const { scaling = {}, skillType, element } = skillMeta;
    const statWeight = {};

    for (const [key, value] of Object.entries(scaling)) {
        const normalized = key.toLowerCase();

        if (["atk", "hp", "def"].includes(normalized) && value > 0) {
            const percentKey = `${normalized}Percent`;
            const flatKey = `${normalized}Flat`;

            statWeight[percentKey] = value;
            statWeight[flatKey] = value / 2;
        }
    }

    if (typeof element === "string" && element.trim()) {
        statWeight[element.toLowerCase()] = 1;
    }

    const typeList = Array.isArray(skillType) ? skillType : [skillType];

    let isSpecialSkill = false;

    for (const type of typeList) {
        if (!type || typeof type !== "string") continue;
        const normalized = type.trim();
        const mapped = typeMap[normalized];

        if (normalized === "echoSkill" || normalized === "outro" || normalized === "intro") {
            isSpecialSkill = true;
        }

        if (mapped) {
            statWeight[mapped] = 1;
        }
    }

    if (isSpecialSkill) {
        for (const key of Object.keys(statWeight)) {
            if (key.endsWith("Flat")) {
                const value = statWeight[key];
                statWeight[key] += value / 2;
            }
        }
    }

    for (const key of Object.keys(statWeight)) {
        if (!statWeight[key] || statWeight[key] === 0 || isNaN(statWeight[key])) {
            delete statWeight[key];
        }
    }

    statWeight.critDmg = 1;
    statWeight.critRate = 2;
    skillMeta.statWeight = statWeight;
    return skillMeta;
}