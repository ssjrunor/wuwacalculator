import {useCallback, useEffect, useMemo, useState} from 'react';
import {isEqual} from 'lodash';
import {attributeColors, attributeIcons, elementToAttribute} from '../utils/attributeHelpers';
import {getUnifiedStatPool} from '../utils/getUnifiedStatPool';
import {getBuffsLogic, getCharacterOverride} from '../data/characters/behavior';
import {getEchoStatsFromEquippedEchoes, getSetCounts} from '../utils/echoHelper';
import {applyEchoLogic} from '../data/buffs/applyEchoLogic';
import {applyWeaponBuffLogic} from '../data/buffs/weaponBuffs';
import {applyEchoSetBuffLogic, applyMainEchoBuffLogic, applySetEffect} from '../data/buffs/setEffect';
import {getFinalStats} from '../utils/getStatsForLevel';
import {getWeaponOverride} from '../data/weapons/behavior';
import {fetchCharacters} from '../data/ingest/wutheringFetch';
import '../styles';
import {characterStore} from '@/state/characterStore.js';
import {fetchWeapons} from '../data/ingest/fetchWeapons';
import {mapExtraStatToCombat} from '../features/weapons/ui/WeaponPane.jsx';

const enableDebugLogging = true;
const logDebug = (...args) => {
    if (!enableDebugLogging) return;
    console.log('[CalculatorStore]', ...args);
};
import {getSkillData} from '../utils/computeSkillDamage.js';
import {getAllSkillLevelsWithEcho, getEffectiveSkillLevels, prepareDamageData} from '../utils/prepareDamageData.js';
import {getSkillDamageCache} from '../utils/skillDamageCache.js';
import {getMainRotationTotals, getTeamRotationTotal} from '../features/rotations/ui/Rotations.jsx';
import {syncAllPresetsForRuntime} from '@/state/echoPresetStore.js';

const defaultSliderValues = { normalAttack: 1, resonanceSkill: 1, forteCircuit: 1, resonanceLiberation: 1, introSkill: 1, sequence: 0 };
const defaultTraceBuffs = { atkPercent: 0, hpPercent: 0, defPercent: 0, healingBonus: 0, critRate: 0, critDmg: 0, activeNodes: {} };
const defaultCustomBuffs = { atkFlat: 0, hpFlat: 0, defFlat: 0, atkPercent: 0, hpPercent: 0, defPercent: 0, critRate: 0, critDmg: 0, energyRegen: 0, healingBonus: 0, basicAtk: 0, heavyAtk: 0, resonanceSkill: 0, resonanceLiberation: 0, aero: 0, glacio: 0, spectro: 0, fusion: 0, electro: 0, havoc: 0 };
const defaultCombatSettings = { critRate: 0, critDmg: 0, weaponBaseAtk: 0, spectroFrazzle: 0, havocBane: 0, electroFlare: 0, aeroErosion: 0, atkPercent: 0, hpPercent: 0, defPercent: 0, energyRegen: 0 };
const skillTabs = ['normalAttack', 'resonanceSkill', 'forteCircuit', 'resonanceLiberation', 'introSkill', 'outroSkill', 'echoAttacks', 'negativeEffect'];

function useCharacterStoreState() {
    const [storeState, setStoreState] = useState(() => characterStore.getCharacters());

    useEffect(() => {
        const unsubscribe = characterStore.subscribe(setStoreState);
        return () => unsubscribe();
    }, []);

    const setStore = (updater) => {
        const current = characterStore.getCharacters();
        const next = typeof updater === 'function' ? updater(current) : updater;
        characterStore.setCharacters(next);
    };

    return [storeState, setStore];
}

function useActiveCharacterIdFromStore() {
    const [activeId, setActiveId] = useState(() => characterStore.getActiveCharacterId());

    useEffect(() => {
        const unsubscribe = characterStore.subscribe(() => setActiveId(characterStore.getActiveCharacterId()));
        return () => unsubscribe();
    }, []);

    const setActiveIdBridge = (next) => {
        const resolved = typeof next === 'function' ? next(characterStore.getActiveCharacterId()) : next;
        characterStore.setActiveCharacterId(resolved);
        setActiveId(resolved);
    };

    return [activeId, setActiveIdBridge];
}

function buildDefaultWeapon(char, weapons, baseCombat) {
    const weaponType = char.weaponType ?? char.Weapon ?? char.raw?.Weapon ?? 0;
    const defaultWeapon = Object.values(weapons)
        .filter(w => w.Type === weaponType)
        .sort((a, b) => (b.Rarity ?? 0) - (a.Rarity ?? 0))[0];

    if (!defaultWeapon) return {};

    const levelData = defaultWeapon.Stats?.['0']?.['1'] ?? defaultWeapon.Stats?.['0']?.['0'];
    const baseAtk = levelData?.[0]?.Value ?? 0;
    const stat = levelData?.[1] ?? null;
    const mappedStat = mapExtraStatToCombat(stat);

    return {
        weapon: {
            id: defaultWeapon.Id,
            level: 1,
            rank: 1,
            rarity: defaultWeapon.Rarity ?? 1,
            baseAtk,
            stat,
            effectName: defaultWeapon.EffectName ?? null,
            effectText: defaultWeapon.Effect ?? null,
            effectParam: defaultWeapon.Param ?? [],
        },
        combat: {
            ...baseCombat,
            weaponId: defaultWeapon.Id,
            weaponLevel: 1,
            weaponRank: 1,
            weaponBaseAtk: baseAtk,
            weaponStat: stat,
            weaponRarity: defaultWeapon.Rarity ?? 1,
            weaponEffect: defaultWeapon.Effect ?? null,
            weaponEffectName: defaultWeapon.EffectName ?? null,
            weaponParam: defaultWeapon.Param ?? [],
            ...mappedStat,
        }
    };
}

function buildNormalizedRuntime(char, weapons, existing, defaults) {
    const charId = char.Id ?? char.id ?? char.link;
    const baseCombat = { ...defaults };
    const weaponInfo = buildDefaultWeapon(char, weapons, baseCombat);

    return {
        character: {
            id: charId,
            name: char.displayName ?? char.Name ?? char.name,
            attribute: char.attribute ?? char.Attribute,
            weaponType: char.weaponType ?? char.Weapon ?? char.raw?.Weapon ?? 0,
        },
        progression: {
            characterLevel: existing?.progression?.characterLevel ?? 1,
            skillLevels: existing?.progression?.skillLevels ?? defaultSliderValues,
            traceNodes: existing?.progression?.traceNodes ?? {activeNodeIds: [], buffs: defaultTraceBuffs},
        },
        stats: {
            base: existing?.stats?.base ?? {},
            final: existing?.stats?.final ?? {},
        },
        equipment: {
            weapon: existing?.equipment?.weapon ?? weaponInfo.weapon,
            echoes: existing?.equipment?.echoes ?? [],
        },
        buffs: {
            custom: existing?.buffs?.custom ?? defaultCustomBuffs,
            combat: existing?.buffs?.combat ?? weaponInfo.combat,
            merged: existing?.buffs?.merged ?? {},
        },
        combat: existing?.combat ?? {...baseCombat, ...weaponInfo.combat},
        team: existing?.team ?? {memberIds: [charId, null, null], members: [], rotations: {}},
        skills: existing?.skills ?? {meta: null, results: [], groupedOptions: {}},
        rotation: existing?.rotation ?? {entries: [], initialized: false},
        calculators: existing?.calculators ?? {targetSkills: null, randGen: null, optimizer: null, suggestions: null},
        uiFlags: existing?.uiFlags ?? {activeStates: {}, sequenceToggles: {}},
    };
}

export default function CalculatorStore() {
    const [allCharacters, setAllCharacters] = useState([]);
    const [storeState] = useCharacterStoreState();
    const [activeCharacterId] = useActiveCharacterIdFromStore();
    const [weapons, setWeapons] = useState({});
    const [activeCharacter, setActiveCharacter] = useState(null);
    const [baseCharacterState, setBaseCharacterState] = useState(null);
    const [savedRotations, setSavedRotations] = useState([]);
    const [savedTeamRotations, setSavedTeamRotations] = useState([]);
    const charId = activeCharacterId;

    const activeRuntime = useMemo(
        () => storeState?.[activeCharacterId] ?? null,
        [storeState, activeCharacterId]
    );
    console.log(activeRuntime)

    const sliderValues = useMemo(
        () => activeRuntime?.progression?.skillLevels ?? defaultSliderValues,
        [activeRuntime]
    );
    const traceNodeBuffs = useMemo(
        () => activeRuntime?.progression?.traceNodes?.buffs ?? defaultTraceBuffs,
        [activeRuntime]
    );
    const customBuffs = useMemo(
        () => activeRuntime?.buffs?.custom ?? defaultCustomBuffs,
        [activeRuntime]
    );
    const combatState = useMemo(
        () => activeRuntime?.buffs?.combat ?? activeRuntime?.combat ?? defaultCombatSettings,
        [activeRuntime]
    );
    const equippedEchoes = useMemo(
        () => activeRuntime?.equipment?.echoes ?? [],
        [activeRuntime]
    );
    const teamMembers = useMemo(
        () => activeRuntime?.team?.memberIds ?? [activeRuntime?.character?.id ?? null, null, null],
        [activeRuntime]
    );

    const legacyRuntimeStates = useMemo(() => {
        const mapped = {};
        for (const [id, runtime] of Object.entries(storeState ?? {})) {
            const baseChar = allCharacters.find(c => String(c.Id ?? c.id ?? c.link) === String(id)) ?? {};
            mapped[id] = {
                Name: runtime.character?.name ?? baseChar.displayName ?? baseChar.Name,
                Id: runtime.character?.id ?? baseChar.Id ?? baseChar.id ?? baseChar.link,
                Attribute: runtime.character?.attribute ?? baseChar.Attribute ?? baseChar.attribute,
                WeaponType: runtime.character?.weaponType ?? baseChar.Weapon ?? baseChar.weaponType,
                equippedEchoes: runtime.equipment?.echoes ?? [],
                Team: runtime.team?.memberIds ?? [],
                rotationEntries: runtime.rotation?.entries ?? [],
                allSkillResults: runtime.skills?.results ?? [],
                teamRotation: runtime.team?.rotations?.teamRotation,
                teamRotationSummary: runtime.team?.rotations?.teamRotationSummary,
                activeStates: runtime.uiFlags?.activeStates ?? {},
                sequenceToggles: runtime.uiFlags?.sequenceToggles ?? {},
                CombatState: runtime.buffs?.combat ?? runtime.combat ?? {},
                CustomBuffs: runtime.buffs?.custom ?? {},
                CharacterLevel: runtime.progression?.characterLevel,
                SkillLevels: runtime.progression?.skillLevels,
                TraceNodeBuffs: runtime.progression?.traceNodes?.buffs,
                Stats: runtime.stats?.base ?? baseChar.Stats ?? {},
                FinalStats: runtime.stats?.final ?? {},
                NameRaw: baseChar
            };
        }
        return mapped;
    }, [storeState, allCharacters]);

    const updateActiveRuntime = useCallback((mutator) => {
        if (!activeRuntime) return;
        const next = mutator(activeRuntime);
        if (!next) return;
        if (isEqual(next, activeRuntime)) return;
        characterStore.updateCharacter(next);
    }, [activeRuntime]);

    const echoStats = useMemo(
        () => getEchoStatsFromEquippedEchoes(equippedEchoes),
        [equippedEchoes]
    );
    const setCounts = useMemo(
        () => getSetCounts(equippedEchoes),
        [equippedEchoes]
    );
    const currentAttribute = useMemo(
        () => elementToAttribute[activeRuntime?.character?.attribute] ?? '',
        [activeRuntime]
    );
    const currentSliderColor = attributeColors[currentAttribute] ?? '#888';
    const attributeIconPath = attributeIcons[currentAttribute] ?? '';

    const handleCharacterSelect = useCallback((target) => {
        if (!target) return;

        const resolvedChar = typeof target === 'object'
            ? target
            : (allCharacters.find(c => String(c.Id ?? c.id ?? c.link) === String(target)) ?? null);

        if (!resolvedChar) return;

        const newId = resolvedChar.Id ?? resolvedChar.id ?? resolvedChar.link;
        const existing = characterStore.getCharacter(newId);
        const normalized = buildNormalizedRuntime(resolvedChar, weapons, existing, defaultCombatSettings);
        characterStore.updateCharacter(normalized);
        characterStore.setActiveCharacterId(newId);
        setActiveCharacter(resolvedChar);
        logDebug('Switched character', { id: newId, name: resolvedChar.displayName ?? resolvedChar.Name ?? resolvedChar.name });
    }, [allCharacters, weapons]);

    // On load: fetch characters and weapons, seed store with normalized entries, pick active char
    useEffect(() => {
        let cancelled = false;
        Promise.all([fetchCharacters(), fetchWeapons()]).then(([charData, weaponData]) => {
            if (cancelled) return;
            setWeapons(weaponData);
            const sorted = [...charData].sort((a, b) =>
                a.displayName.localeCompare(b.displayName, undefined, { sensitivity: 'base' })
            );
            setAllCharacters(sorted);
            logDebug('Fetched base data', { characters: sorted.length, weapons: Object.keys(weaponData ?? {}).length });

            const resolvedActiveId = activeCharacterId ?? sorted[0]?.Id ?? sorted[0]?.id ?? sorted[0]?.link;
            const foundChar = sorted.find(c => String(c.Id ?? c.id ?? c.link) === String(resolvedActiveId));
            if (!foundChar) return;

            // Inline selection to keep this effect stable
            const newId = foundChar.Id ?? foundChar.id ?? foundChar.link;
            const existing = characterStore.getCharacter(newId);
            const normalized = buildNormalizedRuntime(foundChar, weaponData, existing, defaultCombatSettings);
            characterStore.updateCharacter(normalized);
            characterStore.setActiveCharacterId(newId);
            setActiveCharacter(foundChar);
            logDebug('Initialized active character', { id: newId, name: foundChar.displayName ?? foundChar.Name ?? foundChar.name });
        });
        return () => {
            cancelled = true;
        };
    }, []); // run once on mount

    useEffect(() => {
        if (!activeRuntime) return;
        // sync presets based on equipped echoes (adapter to expected shape)
        syncAllPresetsForRuntime({
            Id: activeRuntime.character?.id,
            Name: activeRuntime.character?.name,
            equippedEchoes: activeRuntime.equipment?.echoes ?? []
        });
    }, [activeRuntime?.character?.id, activeRuntime?.equipment?.echoes]);

    useEffect(() => {
        if (!activeRuntime) return;
        const baseState = allCharacters.find(c => String(c.Id ?? c.id ?? c.link) === String(activeRuntime.character?.id));
        setBaseCharacterState(baseState ?? null);
        logDebug('Base character state resolved', { id: activeRuntime.character?.id, name: baseState?.Name ?? baseState?.displayName });
    }, [activeRuntime, allCharacters]);

    const getAllSkillLevelsForTabs = useCallback((id, activeChar, tabs) => {
        const result = {};
        for (const tab of tabs) {
            const skill = getSkillData(activeChar, tab);
            result[tab] = getEffectiveSkillLevels(id, activeChar, tab, skill);
        }
        return result;
    }, []);

    // Respond to external active character id changes by ensuring runtime exists.
    useEffect(() => {
        if (!activeCharacterId || allCharacters.length === 0) return;
        handleCharacterSelect(activeCharacterId);
    }, [activeCharacterId, allCharacters, handleCharacterSelect]);

    // Ensure the active character is always the first team slot in runtime data.
    useEffect(() => {
        if (!activeRuntime || !activeCharacterId) return;
        const memberIds = activeRuntime.team?.memberIds ?? [];
        if (memberIds[0] === activeCharacterId) return;
        const nextMembers = [activeCharacterId, memberIds[1] ?? null, memberIds[2] ?? null];
        updateActiveRuntime(runtime => ({
            ...runtime,
            team: {
                ...runtime.team,
                memberIds: nextMembers
            }
        }));
        logDebug('Normalized team lead slot', { activeCharacterId, team: nextMembers });
    }, [activeRuntime, activeCharacterId, updateActiveRuntime]);

    // Seed missing skill levels / trace buffs / combat defaults for active runtime.
    useEffect(() => {
        if (!activeRuntime) return;
        const skillLevels = activeRuntime.progression?.skillLevels ?? defaultSliderValues;
        const traceBuffs = activeRuntime.progression?.traceNodes?.buffs ?? defaultTraceBuffs;
        const combat = activeRuntime.buffs?.combat ?? activeRuntime.combat ?? {};

        const needsSkillLevels = !isEqual(skillLevels, activeRuntime.progression?.skillLevels ?? {});
        const needsTraceBuffs = !isEqual(traceBuffs, activeRuntime.progression?.traceNodes?.buffs ?? {});
        const needsCombat = !isEqual(combat, activeRuntime.buffs?.combat ?? activeRuntime.combat ?? {});

        if (!needsSkillLevels && !needsTraceBuffs && !needsCombat) return;

        updateActiveRuntime(runtime => ({
            ...runtime,
            progression: {
                ...runtime.progression,
                skillLevels,
                traceNodes: {
                    ...(runtime.progression?.traceNodes ?? {}),
                    buffs: traceBuffs,
                    activeNodeIds: runtime.progression?.traceNodes?.activeNodeIds ?? []
                }
            },
            buffs: {
                ...runtime.buffs,
                combat
            },
            combat
        }));
        logDebug('Seeded defaults', { needsSkillLevels, needsTraceBuffs, needsCombat });
    }, [activeRuntime, updateActiveRuntime]);

    // --- Derived combat/buff pipeline (non-UI) ---
    const overrideLogic = useMemo(() => {
        const id = activeRuntime?.character?.id;
        return id ? getCharacterOverride(id) : null;
    }, [activeRuntime?.character?.id]);

    const mergedBuffsBase = useMemo(() => {
        if (!activeRuntime) return {};
        return getUnifiedStatPool(
            [traceNodeBuffs, combatState, customBuffs, echoStats],
            overrideLogic
        );
    }, [activeRuntime, traceNodeBuffs, combatState, customBuffs, echoStats, overrideLogic]);

    useEffect(() => {
        if (!activeRuntime) return;
        logDebug('Merged buffs base', mergedBuffsBase);
    }, [activeRuntime?.character?.id, mergedBuffsBase]);

    const mergedBuffsTeam = useMemo(() => {
        if (!activeRuntime) return mergedBuffsBase;
        let nextBuffs = { ...mergedBuffsBase };
        teamMembers.forEach((id, index) => {
            if (!id || index === 0) return;
            const buffLogic = getBuffsLogic(id);
            if (!buffLogic) return;
            const teammateRuntime = characterStore.getCharacter(id);
            const characterState = { activeStates: teammateRuntime?.uiFlags?.activeStates ?? {} };
            const result = buffLogic({
                mergedBuffs: { ...nextBuffs },
                characterState,
                activeCharacter: activeRuntime?.character,
                combatState
            });
            if (result?.mergedBuffs) nextBuffs = result.mergedBuffs;
            else if (result) nextBuffs = result;
        });
        logDebug('Applied teammate buffs', { team: teamMembers, mergedBuffs: nextBuffs });
        return nextBuffs;
    }, [activeRuntime, mergedBuffsBase, teamMembers, combatState]);

    const mergedBuffsWeaponEcho = useMemo(() => {
        if (!activeRuntime) return mergedBuffsTeam;
        const characterState = { activeStates: activeRuntime.uiFlags?.activeStates ?? {} };
        let buffCopy = { ...mergedBuffsTeam, damageTypeAmplify: { ...(mergedBuffsTeam.damageTypeAmplify ?? {}) }, elementDmgAmplify: { ...(mergedBuffsTeam.elementDmgAmplify ?? {}) } };

        buffCopy = applyWeaponBuffLogic({
            mergedBuffs: buffCopy,
            characterState,
            activeCharacter: activeRuntime?.character
        }) ?? buffCopy;

        buffCopy = applyEchoLogic({
            mergedBuffs: buffCopy,
            characterState,
            activeCharacter: activeRuntime?.character
        }) ?? buffCopy;

        const echoSetBuffs = applyEchoSetBuffLogic(activeRuntime.equipment?.echoes ?? []);
        const mainEchoBuffs = applyMainEchoBuffLogic(activeRuntime.equipment?.echoes ?? []);
        const setEffectMerged = applySetEffect({
            mergedBuffs: buffCopy,
            characterState,
            activeCharacter: activeRuntime?.character,
            combatState,
            setCounts
        }) ?? buffCopy;

        // mainEchoBuffs and echoSetBuffs are currently unused; include if needed later.
        void echoSetBuffs;
        void mainEchoBuffs;

        logDebug('Applied weapon/echo buffs', { mergedBuffs: setEffectMerged });
        return setEffectMerged;
    }, [activeRuntime, mergedBuffsTeam, combatState, setCounts]);

    const weaponOverride = useMemo(() => getWeaponOverride(combatState?.weaponId), [combatState?.weaponId]);
    useEffect(() => {
        if (!weaponOverride?.applyWeaponLogic || !activeRuntime) return;
        const charId = activeRuntime.character?.id;
        const currentParamValues = combatState.weaponParam?.map(
            p => p?.[Math.min(Math.max((combatState.weaponRank ?? 1) - 1, 0), 4)]
        ) ?? [];
        const characterState = {
            activeStates: activeRuntime.uiFlags?.activeStates ?? {},
            toggles: activeRuntime.uiFlags?.sequenceToggles ?? {}
        };
        weaponOverride.applyWeaponLogic({
            characterId: charId,
            combatState,
            setCombatState: (next) => updateActiveRuntime(runtime => ({
                ...runtime,
                buffs: { ...runtime.buffs, combat: next },
                combat: next
            })),
            characterState,
            weaponParamValues: currentParamValues
        });
        logDebug('Applied weapon override', { weaponId: combatState?.weaponId, charId });
    }, [weaponOverride, combatState, activeRuntime, updateActiveRuntime]);

    const finalMergedBuffs = useMemo(() => mergedBuffsWeaponEcho, [mergedBuffsWeaponEcho]);

    const finalStats = useMemo(() => {
        if (!activeRuntime || !baseCharacterState) return {};
        return getFinalStats(
            activeRuntime.character,
            baseCharacterState,
            activeRuntime.progression?.characterLevel ?? 1,
            finalMergedBuffs,
            combatState
        );
    }, [activeRuntime, baseCharacterState, finalMergedBuffs, combatState]);

    useEffect(() => {
        if (!activeRuntime) return;
        logDebug('Final stats computed', { charId, statsKeys: Object.keys(finalStats ?? {}) });
    }, [activeRuntime?.character?.id, finalStats]);

    const allSkillLevels = useMemo(() => {
        if (!charId || !activeCharacter) return {};
        return getAllSkillLevelsForTabs(charId, activeCharacter, skillTabs);
    }, [charId, activeCharacter, getAllSkillLevelsForTabs]);

    const allSkillLevelsWithEcho = useMemo(() => {
        if (!charId || !activeCharacter) return {};
        return getAllSkillLevelsWithEcho({
            charId,
            activeCharacter,
            characterRuntimeStates: legacyRuntimeStates,
            allSkillLevels
        });
    }, [charId, activeCharacter, legacyRuntimeStates, allSkillLevels]);

    const damageData = useMemo(() => {
        if (!activeCharacter || !charId) return { charSkillResults: [], echoSkillResults: [], negativeEffects: [] };
        const enemyProfile = {
            level: activeRuntime?.CombatState?.enemyLevel ?? 90,
            res: activeRuntime?.CombatState?.enemyResMap ?? {}
        };
        return prepareDamageData({
            activeCharacter,
            charId,
            finalStats,
            characterLevel: activeRuntime?.progression?.characterLevel ?? 1,
            sliderValues,
            characterRuntimeStates: legacyRuntimeStates,
            combatState,
            mergedBuffs: finalMergedBuffs,
            enemyProfile,
            skillTabs,
            getAllSkillLevels: getAllSkillLevelsForTabs
        });
    }, [activeCharacter, charId, finalStats, activeRuntime?.progression?.characterLevel, sliderValues, legacyRuntimeStates, combatState, finalMergedBuffs, getAllSkillLevelsForTabs]);

    const skillResults = useMemo(
        () => [...(damageData.charSkillResults ?? []), ...(damageData.echoSkillResults ?? []), ...(damageData.negativeEffects ?? [])],
        [damageData]
    );

    useEffect(() => {
        if (!activeRuntime) return;
        logDebug('Damage data prepared', {
            charSkills: damageData.charSkillResults?.length ?? 0,
            echoSkills: damageData.echoSkillResults?.length ?? 0,
            negativeEffects: damageData.negativeEffects?.length ?? 0
        });
    }, [activeRuntime?.character?.id, damageData]);

    useEffect(() => {
        if (!activeRuntime) return;
        const prev = activeRuntime.skills?.results ?? [];
        if (isEqual(prev, skillResults)) return;
        updateActiveRuntime(runtime => ({
            ...runtime,
            skills: {
                ...(runtime.skills ?? {}),
                results: skillResults
            }
        }));
        logDebug('Updated skill results', { count: skillResults.length });
    }, [activeRuntime, skillResults, updateActiveRuntime]);

    const groupedSkillOptions = useMemo(() => {
        const allSkillResults =
            skillResults?.length ? skillResults : (activeRuntime?.skills?.results ?? getSkillDamageCache());
        const groups = {};
        for (const skill of allSkillResults.filter(s => s.visible)) {
            const tab = skill.tab ?? 'unknown';
            if (!groups[tab]) groups[tab] = [];
            groups[tab].push({
                name: skill.name,
                type: skill.skillType,
                tab,
                visible: skill.visible,
                element: skill.element ?? null,
            });
        }
        return groups;
    }, [skillResults, activeRuntime?.skills?.results]);

    useEffect(() => {
        if (!activeRuntime || !skillTabs.length) return;
        const tab = skillTabs[0];
        const currentLevels = allSkillLevelsWithEcho?.[tab];
        if (!currentLevels) return;

        const defaultRandGen = {
            poolSize: 50,
            bias: 0.5,
            rollQuality: 0.3,
            targetEnergyRegen: 0,
            setId: [],
            mainEcho: null,
            level: currentLevels[0],
            tab,
        };

        const defaultOptimizer = {
            level: currentLevels[0],
            tab
        };

        const defaultSuggestion = defaultRandGen;

        const existingResults =
            skillResults?.length ? skillResults : activeRuntime.skills?.results ?? getSkillDamageCache();

        const rotationData = getDefaultRotationEntries(charId);
        const entries = rotationData?.entries ?? [];
        const defaultRotationData = buildRotation(charId, groupedSkillOptions);
        const builtRotations = defaultRotationData?.builtRotations ?? [];

        updateActiveRuntime(runtime => {
            const next = { ...runtime };
            let changed = false;

            const calculators = { ...(runtime.calculators ?? {}) };
            if (!calculators.randGen?.level) {
                calculators.randGen = defaultRandGen;
                changed = true;
            }
            if (!calculators.optimizer?.level) {
                calculators.optimizer = defaultOptimizer;
                changed = true;
            }
            if (!calculators.suggestions?.level) {
                calculators.suggestions = defaultSuggestion;
                changed = true;
            }

            const skills = { ...(runtime.skills ?? {}) };
            if (!isEqual(skills.groupedOptions, groupedSkillOptions)) {
                skills.groupedOptions = groupedSkillOptions;
                changed = true;
            }
            if (!isEqual(skills.results ?? [], existingResults ?? [])) {
                skills.results = existingResults;
                changed = true;
            }

            const rotation = { ...(runtime.rotation ?? {}) };
            const hasNoRotation = !Array.isArray(rotation.entries) || rotation.entries.length === 0;
            const hasPreset = Array.isArray(entries) && entries.length > 0 && builtRotations.length > 0;
            if (hasNoRotation && hasPreset && !rotation.initialized) {
                rotation.entries = builtRotations;
                rotation.initialized = true;
                changed = true;
            } else if (!hasNoRotation && hasPreset && !rotation.initialized) {
                rotation.initialized = true;
                changed = true;
            }

            if (!changed) return runtime;

            next.calculators = calculators;
            next.skills = skills;
            next.rotation = rotation;
            logDebug('Seeded calculators/rotation defaults', {
                calculators,
                rotationEntries: rotation.entries?.length ?? 0,
                groupedSkillOptions: Object.keys(groupedSkillOptions ?? {}).length
            });
            return next;
        });
    }, [activeRuntime, skillTabs, allSkillLevelsWithEcho, skillResults, groupedSkillOptions, charId, updateActiveRuntime]);

    useEffect(() => {
        if (!activeRuntime) return;
        const prev = activeRuntime.skills?.results ?? [];
        if (isEqual(prev, skillResults)) return;
        updateActiveRuntime(runtime => ({
            ...runtime,
            skills: {
                ...(runtime.skills ?? {}),
                results: skillResults
            }
        }));
        logDebug('Updated skill results', { count: skillResults.length });
    }, [activeRuntime, skillResults, updateActiveRuntime]);

    // Persist merged buffs and final stats into runtime if changed.
    useEffect(() => {
        if (!activeRuntime) return;
        const prevMerged = activeRuntime.buffs?.merged ?? {};
        const prevFinal = activeRuntime.stats?.final ?? {};
        const mergedChanged = !isEqual(prevMerged, finalMergedBuffs);
        const statsChanged = !isEqual(prevFinal, finalStats);
        if (!mergedChanged && !statsChanged) return;
        updateActiveRuntime(runtime => ({
            ...runtime,
            buffs: {
                ...runtime.buffs,
                merged: mergedChanged ? finalMergedBuffs : runtime.buffs?.merged
            },
            stats: {
                ...(runtime.stats ?? {}),
                final: statsChanged ? finalStats : runtime.stats?.final
            }
        }));
        logDebug('Persisted buffs/stats', { mergedChanged, statsChanged });
    }, [activeRuntime, finalMergedBuffs, finalStats, updateActiveRuntime]);

    const mainRotationTotals = useMemo(() => {
        if (!charId) return { personalRotations: [], teamRotations: [] };
        return getMainRotationTotals(charId, legacyRuntimeStates, savedRotations, savedTeamRotations, skillResults);
    }, [charId, legacyRuntimeStates, savedRotations, savedTeamRotations, skillResults]);

    const teamRotationDmg = useMemo(() => {
        if (!charId) return null;
        return getTeamRotationTotal(charId, legacyRuntimeStates, skillResults);
    }, [charId, legacyRuntimeStates, skillResults]);

    // Derived totals currently unused by UI; kept for future wiring.
    void mainRotationTotals;
    void teamRotationDmg;

    useEffect(() => {
        if (!charId) return;
        logDebug('Rotation totals computed', {
            personal: mainRotationTotals.personalRotations?.length ?? 0,
            team: mainRotationTotals.teamRotations?.length ?? 0,
            teamRotationDmg: teamRotationDmg?.teamTotal
        });
    }, [charId, mainRotationTotals, teamRotationDmg]);


    // Core setup only; UI wiring to follow.
    return null;
}
