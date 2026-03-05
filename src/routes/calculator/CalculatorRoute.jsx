import React, { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Split from 'split.js';
import {fetchCharacters} from '@/data/runtime/wutheringFetch';
import characterStatesRaw from '@/data/characterStates.json';
import '@shared/styles';
import CharacterSelector, {
    applyTraceBuff,
    createEmptyTraceBuffs
} from '@/features/characters/ui/CharacterSelector.jsx';
import CharacterStats from '@/features/characters/ui/CharacterStats.jsx';
import DamageSection from '@/features/calculator/ui/DamageSection.jsx';
import { mapExtraStatToCombat } from '@/features/weapons/lib/mapExtraStatToCombat.js';
import BuffsPane, {getResolvedTeamRotations} from "@/features/buffs/ui/BuffsPane.jsx";
import ToolbarIconButton, {ToolbarSidebarButton} from '@/shared/ui/common/ToolbarIconButton.jsx';
import {attributeColors, attributeIcons, elementToAttribute} from '@shared/utils/attributeHelpers';
import {getFinalStats} from '@shared/utils/getStatsForLevel';
import {getUnifiedStatPool, makeBaseBuffs, makeModBuffs} from '@shared/utils/getUnifiedStatPool';
import {getPersistentValue, setPersistentValue, usePersistentState} from '@shared/hooks/usePersistentState';
import {getBuffsLogic, getCharacterOverride} from '@/data/characters/behavior';
import {
    HelpCircle,
    History,
    Info,
    Moon,
    RotateCcw,
    Settings,
    Sparkle,
    Sun,
    UserRound,
    ScanHeart,
    Backpack,
    ChartColumn,
    Activity
} from 'lucide-react';
import {useNavigate} from 'react-router-dom';
import {fetchWeapons} from '@/data/runtime/fetchWeapons';
import {getWeaponOverride} from '@/data/weapons/behavior';
import {applyEchoLogic} from '@/data/buffs/applyEchoLogic';
import {applyWeaponBuffLogic} from "@/data/buffs/weaponBuffs.js";
import {
    applyEchoSetBuffLogic,
    applyMainEchoBuffLogic,
    applySetEffect,
    computeNebulousCollapsarStates
} from "@/data/buffs/setEffect.js";
import {getEchoStatsFromEquippedEchoes, getSetCounts, normalizeLegacyEchoStats} from '@shared/utils/echoHelper.js';
import {isEqual} from "lodash";
import {getMainRotationTotals, getTeamRotationTotal} from "@/features/rotations/ui/Rotations.jsx";
import { buildRotationBreakdown } from "@/features/rotations/core/rotationBreakdown.js";
import NotificationToast from "@/shared/ui/common/NotificationToast.jsx";
import { changelog } from "@/features/changelog/model/changelogEntries.js";
import ConfirmationModal from "@/shared/ui/common/ConfirmationModal.jsx";
import {deepCompareEchoArrays, getEchoPresetById, syncAllPresetsForRuntime} from "@shared/state/echoPresetStore.js";
import {useGoogleAuth} from '@shared/hooks/useGoogleAuth.js';
import {getCuteMessage} from "@/shared/ui/common/cuteMessages.jsx";
import {getSkillData} from '@shared/utils/computeSkillDamage.js';
import {getAllSkillLevelsWithEcho, getEffectiveSkillLevels, prepareDamageData} from '@shared/utils/prepareDamageData.js';
import {buildRotation, getSkillDamageCache} from '@shared/utils/skillDamageCache.js';
import {getDefaultRotationEntries} from '@shared/constants/charBasicRotations.js';
import AppStatusModal from "@/shared/ui/common/AppStatusModal.jsx";
import {defaultRandGen} from "@/features/suggestions/core/randomEchoes/lib/constants.js";
import { loadCharSetData } from "@shared/constants/charSetData.js";
import enemies from '@/data/enemies.json';
import {
    echoesService,
    weaponService,
    enemyService,
    skillGroupingService,
    characterOverviewService,
    suggestionsService
} from '@/calculator.js';
import {
    attributeMap,
    imageCache,
    loadCalculatorBaseAssets,
    preloadImages,
    weaponMap
} from '@/features/calculator/runtime/visualResourceStore.js';

const SkillsModal = lazy(() => import('@/features/characters/ui/SkillsModal.jsx'));
const EchoBagMenu = lazy(() => import('@/features/echoes/ui/EchoBagMenu.jsx'));
const CharacterOverviewPane = lazy(() => import('@/features/overview/ui/CharacterOverview.jsx'));
const Optimizer = lazy(() => import('@/features/optimizer/ui/Optimizer.jsx'));
const WeaponPane = lazy(() => import('@/features/weapons/ui/WeaponPane.jsx'));
const EnemyPane = lazy(() => import('@/features/enemy/ui/EnemyPane.jsx'));
const CustomBuffsPane = lazy(() => import('@/features/buffs/ui/CustomBuffsPane.jsx'));
const RotationsPane = lazy(() => import('@/features/rotations/ui/RotationsPane.jsx'));
const EchoesPane = lazy(() => import('@/features/echoes/ui/EchoesPane.jsx'));
const SuggestionsPane = lazy(() => import('@/features/suggestions/ui/SuggestionsPane.jsx'));
export const defaultEnemyRes = () => ({
    0: 20,
    1: 20,
    2: 20,
    3: 20,
    4: 20,
    5: 20,
    6: 20
});

export const defaultTraceBuffs = {
    // main stats: only percent is used, flat stays 0
    atk: makeBaseBuffs(),   // use atk.percent
    hp:  makeBaseBuffs(),   // use hp.percent
    def: makeBaseBuffs(),   // use def.percent

    // element dmgBonus only; other fields left at 0
    attribute: {
        aero:    makeModBuffs(),
        glacio:  makeModBuffs(),
        spectro: makeModBuffs(),
        fusion:  makeModBuffs(),
        electro: makeModBuffs(),
        havoc:   makeModBuffs(),
    },

    // scalar stats from traces
    critRate: 0,
    critDmg: 0,
    healingBonus: 0,

    // UI / bookkeeping only
    activeNodes: {}
};

export default function CalculatorRoute(props) {
    // -----------------------------
    // Persistent + UI state
    // -----------------------------
    const [characters, setCharacters] = useState([]);
    loadCalculatorBaseAssets();
    const [popupMessage, setPopupMessage] = useState({
        icon: null,
        message: null,
        color: {},
        duration: null,
        prompt: {}
    });

    const { user } = useGoogleAuth();

    const [showToast, setShowToast] = useState(false);
    const navigate = useNavigate();

    const LATEST_CHANGELOG_VERSION = '2026-03-05 10:25';
    const latest = changelog[changelog.length - 1];
    const latestMessage = latest?.shortDesc || 'New stuff\'s been added~! (〜^∇^)〜';

    const {
        theme,
        setTheme,
        isDark,
    } = props;
    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    };
    const [leftPaneView, setLeftPaneView] = usePersistentState('leftPaneView','characters');
    const [isCollapsedMode, setIsCollapsedMode] = useState(false);
    const [activeCharacterId, setActiveCharacterId] = usePersistentState('activeCharacterId', null);
    const [characterRuntimeStates, setCharacterRuntimeStates] = usePersistentState('characterRuntimeStates', {});
    const [enemyProfile, setEnemyProfile] = usePersistentState('enemyProfile', { id: 340000240, level: 100, res: defaultEnemyRes(), toa: true, class: 4, status: { tuneStrain: 0 } });
    const [customEnemies, setCustomEnemies] = usePersistentState('customEnemies', []);
    const [menuOpen, setMenuOpen] = useState(false);
    const [skillsModalOpen, setSkillsModalOpen] = useState(false);
    const [activeSkillTab, setActiveSkillTab] = useState('normalAttack');
    const [activeCharacter, setActiveCharacter] = useState(null);
    const [baseCharacterState, setBaseCharacterState] = useState(null);
    const [hamburgerOpen, setHamburgerOpen] = useState(false);
    const characterStates = Object.values(characterStatesRaw);
    const menuRef = useRef(null);
    const triggerRef = useRef(null);
    const currentAttribute = elementToAttribute[activeCharacter?.attribute] ?? '';
    const currentSliderColor = attributeColors[currentAttribute] ?? '#888';
    const attributeIconPath = attributeIcons[currentAttribute] ?? '';
    const defaultSliderValues = { normalAttack: 1, resonanceSkill: 1, forteCircuit: 1, resonanceLiberation: 1, introSkill: 1, tuneBreak: 1, sequence: 0 };
    const defaultCustomBuffs = { atkFlat: 0, hpFlat: 0, defFlat: 0, atkPercent: 0, hpPercent: 0, defPercent: 0, critRate: 0, critDmg: 0, energyRegen: 0, healingBonus: 0, basicAtk: 0, heavyAtk: 0, resonanceSkill: 0, resonanceLiberation: 0, aero: 0, glacio: 0, spectro: 0, fusion: 0, electro: 0, havoc: 0 };
    const enemyData = useMemo(
        () => enemyService.buildEnemyMap(enemies, customEnemies),
        [customEnemies]
    );
    const enemyMap = enemyData.map;
    const allEnemiesList = enemyData.all;

    const selectedEnemyId = String(enemyProfile?.id ?? 340000240);
    const selectedEnemy = enemyMap?.[selectedEnemyId] ?? null;

    const defaultCombatState = {
        critRate: 0,
        critDmg: 0,
        weaponBaseAtk: 0,
        spectroFrazzle: 0,
        havocBane: 0,
        electroFlare: 0,
        aeroErosion: 0,
        atkPercent: 0,
        hpPercent: 0,
        defPercent: 0,
        energyRegen: 0
    };
    const [showDropdown, setShowDropdown] = useState(false);
    const [moveToolbarToSidebar, setMoveToolbarToSidebar] = useState(false);
    const [weapons, setWeapons] = useState({});
    const charId = activeCharacterId ?? activeCharacter?.id ?? activeCharacter?.link;
    const runtime = characterRuntimeStates[charId];

    // -----------------------------
    // Derived data (memoized)
    // -----------------------------
    const weaponPrep = useMemo(
        () => weaponService.prepareWeapons({
            weapons,
            weaponType: activeCharacter?.weaponType ?? activeCharacter?.Weapon ?? activeCharacter?.raw?.Weapon
        }),
        [weapons, activeCharacter]
    );
    const updateRuntimeForChar = useCallback((id, updater) => {
        if (!id) return;
        setCharacterRuntimeStates(prev => {
            const prevChar = prev?.[id] ?? {};
            const nextChar = typeof updater === 'function'
                ? updater(prevChar)
                : { ...prevChar, ...updater };
            if (isEqual(prevChar, nextChar)) return prev;
            return {
                ...prev,
                [id]: nextChar
            };
        });
    }, [setCharacterRuntimeStates]);
    const rotationEntries = runtime?.rotationEntries ?? [];
    const setRotationEntries = useCallback((nextOrUpdater) => {
        if (!charId) return;
        updateRuntimeForChar(charId, prevChar => {
            const prevEntries = Array.isArray(prevChar.rotationEntries) ? prevChar.rotationEntries : [];
            const nextEntries =
                typeof nextOrUpdater === 'function' ? nextOrUpdater(prevEntries) : nextOrUpdater;
            if (isEqual(prevEntries, nextEntries)) return prevChar;
            return {
                ...prevChar,
                rotationEntries: nextEntries
            };
        });
    }, [charId, updateRuntimeForChar, defaultCombatState]);
    const team = Array.isArray(runtime?.Team) ? runtime.Team : [activeCharacterId ?? null, null, null];
    const characterLevel = runtime?.CharacterLevel ?? 1;
    const sliderValues = runtime?.SkillLevels ?? defaultSliderValues;
    const traceNodeBuffs = runtime?.TraceNodeBuffs ?? runtime?.TemporaryBuffs ?? defaultTraceBuffs;
    const customBuffs = runtime?.CustomBuffs ?? defaultCustomBuffs;
    const combatState = {
        ...defaultCombatState,
        ...(runtime?.CombatState ?? {}),
    };
    const setTeam = useCallback((nextOrUpdater) => {
        if (!charId) return;
        updateRuntimeForChar(charId, prevChar => {
            const prevTeam = Array.isArray(prevChar.Team) ? prevChar.Team : [activeCharacterId ?? null, null, null];
            const nextTeam =
                typeof nextOrUpdater === 'function' ? nextOrUpdater(prevTeam) : nextOrUpdater;
            if (isEqual(prevTeam, nextTeam)) return prevChar;
            return {
                ...prevChar,
                Team: nextTeam
            };
        });
    }, [charId, activeCharacterId, updateRuntimeForChar]);
    const setCharacterLevel = useCallback((nextOrUpdater) => {
        if (!charId) return;
        updateRuntimeForChar(charId, prevChar => {
            const prevLevel = prevChar.CharacterLevel ?? 1;
            const nextLevel =
                typeof nextOrUpdater === 'function' ? nextOrUpdater(prevLevel) : nextOrUpdater;
            if (prevLevel === nextLevel) return prevChar;
            return {
                ...prevChar,
                CharacterLevel: nextLevel
            };
        });
    }, [charId, updateRuntimeForChar]);
    const setSliderValues = useCallback((nextOrUpdater) => {
        if (!charId) return;
        updateRuntimeForChar(charId, prevChar => {
            const prevValues = prevChar.SkillLevels ?? defaultSliderValues;
            const nextValues =
                typeof nextOrUpdater === 'function' ? nextOrUpdater(prevValues) : nextOrUpdater;
            if (isEqual(prevValues, nextValues)) return prevChar;
            return {
                ...prevChar,
                SkillLevels: nextValues
            };
        });
    }, [charId, updateRuntimeForChar]);
    const setTraceNodeBuffs = useCallback((nextOrUpdater) => {
        if (!charId) return;
        updateRuntimeForChar(charId, prevChar => {
            const prevBuffs = prevChar.TraceNodeBuffs ?? defaultTraceBuffs;
            const nextBuffs =
                typeof nextOrUpdater === 'function' ? nextOrUpdater(prevBuffs) : nextOrUpdater;
            if (isEqual(prevBuffs, nextBuffs)) return prevChar;
            return {
                ...prevChar,
                TraceNodeBuffs: nextBuffs
            };
        });
    }, [charId, updateRuntimeForChar]);
    const setCustomBuffs = useCallback((nextOrUpdater) => {
        if (!charId) return;
        updateRuntimeForChar(charId, prevChar => {
            const prevBuffs = prevChar.CustomBuffs ?? defaultCustomBuffs;
            const nextBuffs =
                typeof nextOrUpdater === 'function' ? nextOrUpdater(prevBuffs) : nextOrUpdater;
            if (isEqual(prevBuffs, nextBuffs)) return prevChar;
            return {
                ...prevChar,
                CustomBuffs: nextBuffs
            };
        });
    }, [charId, updateRuntimeForChar]);
    const setCombatState = useCallback((nextOrUpdater) => {
        if (!charId) return;
        updateRuntimeForChar(charId, prevChar => {
            const prevState = prevChar.CombatState ?? defaultCombatState;
            const nextState =
                typeof nextOrUpdater === 'function' ? nextOrUpdater(prevState) : nextOrUpdater;
            if (isEqual(prevState, nextState)) return prevChar;
            return {
                ...prevChar,
                CombatState: nextState
            };
        });
    }, [charId, updateRuntimeForChar]);
    const equippedEchoes = characterRuntimeStates?.[charId]?.equippedEchoes ?? [];
    const echoMeta = useMemo(
        () => echoesService.computeEchoMeta({ charId, equippedEchoes }),
        [charId, equippedEchoes]
    );
    const echoStats = echoMeta?.echoStatTotals ?? getEchoStatsFromEquippedEchoes(equippedEchoes);
    const [showSubHits, setShowSubHits] = usePersistentState('showSubHits', false);
    const splitInstance = useRef(null);
    const [mainMode, setMainMode] = usePersistentState('mainMode', 'default');
    const [savedRotations, setSavedRotations] = usePersistentState('globalSavedRotations', []);
    const teamRotation = getResolvedTeamRotations(characterRuntimeStates[charId], characterRuntimeStates, savedRotations);
    const [savedTeamRotations, setSavedTeamRotations] = usePersistentState('globalSavedTeamRotations', []);
    const [smartFilter, setSmartFilter] = usePersistentState('smartFilter', true);
    const [generalOptimizerSettings, setGeneralOptimizerSettings] = usePersistentState('generalOptimizerSettings', {
        resultsLimit: 128
    });

    // -----------------------------
    // Effects
    // -----------------------------
    useEffect(() => {
        Promise.all([fetchCharacters(), fetchWeapons()]).then(([charData, weaponData]) => {
            setWeapons(weaponData);

            //const withoutTarget = charData.filter(c => String(c.link) !== "1208");

            const sorted = [...charData].sort((a, b) =>
                a.displayName.localeCompare(b.displayName, undefined, { sensitivity: 'base' })
            );
            setCharacters(sorted);

            const resolvedCharId = activeCharacterId ?? 1506;
            const foundChar = sorted.find(c => String(c.Id ?? c.id ?? c.link) === String(resolvedCharId));
            if (!foundChar) return;

            const weaponType = foundChar.weaponType ?? foundChar.Weapon ?? foundChar.raw?.Weapon ?? 0;

            setActiveCharacter({ ...foundChar, weaponType });
            if (!activeCharacterId) setActiveCharacterId(resolvedCharId);

            const profile = characterRuntimeStates[resolvedCharId] ?? {};
            const state = characterStates.find(c => String(c.Id) === String(foundChar.link));
            const nextTeam = Array.isArray(profile.Team) ? [...profile.Team] : [resolvedCharId, null, null];
            if (!nextTeam[0]) {
                nextTeam[0] = resolvedCharId;
            }
            setBaseCharacterState(state ?? null);
            const nextCharacterLevel = profile.CharacterLevel ?? 1;
            const nextSkillLevels = profile.SkillLevels ?? defaultSliderValues;
            const nextTraceNodeBuffs = profile.TraceNodeBuffs ?? profile.TemporaryBuffs ?? defaultTraceBuffs;
            const nextCustomBuffs = profile.CustomBuffs ?? defaultCustomBuffs;


            const defaultWeapon = Object.values(weaponData)
                .filter(w => w.Type === weaponType)
                .sort((a, b) => (b.Rarity ?? 0) - (a.Rarity ?? 0))[0];

            const extraCombatKeys = [
                'weaponId', 'weaponLevel', 'weaponBaseAtk', 'weaponStat',
                'weaponRarity', 'weaponEffect', 'weaponEffectName', 'weaponParam', 'weaponRank',
                'atkPercent', 'defPercent', 'hpPercent', 'energyRegen'
            ];
            const cleaned = [
                ...Object.keys(defaultCombatState),
                ...extraCombatKeys
            ];
            const cleanedCombatState = Object.fromEntries(
                Object.entries(profile.CombatState ?? {}).filter(([key]) => cleaned.includes(key))
            );
            const hasWeapon = cleanedCombatState?.weaponId != null;
            let nextCombatState = {
                ...defaultCombatState,
                ...cleanedCombatState
            };

            if (defaultWeapon && !hasWeapon) {
                const levelData = defaultWeapon.Stats?.["0"]?.["1"] ?? defaultWeapon.Stats?.["0"]?.["0"];
                const baseAtk = levelData?.[0]?.Value ?? 0;
                const stat = levelData?.[1] ?? null;
                const mappedStat = mapExtraStatToCombat(stat);
                nextCombatState = {
                    ...nextCombatState,
                    weaponId: defaultWeapon.Id,
                    weaponLevel: 1,
                    weaponBaseAtk: baseAtk,
                    weaponStat: stat,
                    weaponRarity: defaultWeapon.Rarity ?? 1,
                    weaponEffect: defaultWeapon.Effect ?? null,
                    weaponEffectName: defaultWeapon.EffectName ?? null,
                    weaponParam: defaultWeapon.Param ?? [],
                    weaponRank: 1,
                    atkPercent: 0,
                    defPercent: 0,
                    hpPercent: 0,
                    critRate: 0,
                    critDmg: 0,
                    energyRegen: 0,
                    ...mappedStat
                };
            }
            const rawEntries = Array.isArray(profile.rotationEntries) ? profile.rotationEntries : [];
            const normalizedEntries = rawEntries.map(entry => ({
                ...entry,
                createdAt: entry.createdAt ?? Date.now() + Math.random()
            }));
            updateRuntimeForChar(resolvedCharId, prevChar => ({
                ...prevChar,
                Team: nextTeam,
                CharacterLevel: nextCharacterLevel,
                SkillLevels: nextSkillLevels,
                TraceNodeBuffs: nextTraceNodeBuffs,
                CustomBuffs: nextCustomBuffs,
                CombatState: nextCombatState,
                rotationEntries: normalizedEntries
            }));
        });
    }, []);

    useEffect(() => {
        fetchWeapons().then(data => {
            setWeapons(data);
        });
    }, []);

    useEffect(() => {
        const seenVersion = getPersistentValue('seenChangelogVersion');
        if (seenVersion !== LATEST_CHANGELOG_VERSION) {
            setPopupMessage({
                message: latestMessage,
                icon: '❤',
                color: { light: 'green', dark: 'limegreen' },
                duration: 60000,
                prompt: {
                    message: latest?.actionMessage ?? 'See updates~!',
                    action: latest?.action ?? (latest?.navigate ? (() => navigate(latest?.navigate)) : (() => setStatusOpen(true))),
                }
            });
            setShowToast(true);
            /*
                        setShowChangelog(true);
                        setShouldScrollChangelog(true);
            */
            setPersistentValue('seenChangelogVersion', LATEST_CHANGELOG_VERSION)
        }
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(e.target) &&
                triggerRef.current &&
                !triggerRef.current.contains(e.target)
            ) {
                setMenuOpen(false);
            }
        };

        if (menuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [menuOpen]);

    useEffect(() => {
        if (mainMode === 'default') {
            const setupSplit = () => {
                const left = document.querySelector('#left-pane');
                const right = document.querySelector('#right-pane');

                if (left && right) {
                    document.querySelectorAll('.gutter').forEach(gutter => gutter.remove());

                    splitInstance.current = Split(['#left-pane', '#right-pane'], {
                        sizes: [50, 50],
                        gutterSize: 1
                    });
                }
            };

            requestAnimationFrame(setupSplit);
        }
    }, [mainMode]);

    useLayoutEffect(() => {
        const handleResize = () => {
            const desktopThreshold = 910;
            if (window.innerWidth >= desktopThreshold) {
                setIsCollapsedMode(false);
                return;
            }
            const leftPane = document.querySelector('#left-pane');
            const rightPane = document.querySelector('#right-pane');
            const sidebar = document.querySelector('.sidebar');
            if (leftPane && rightPane) {
                const leftWidth = leftPane.offsetWidth;
                const rightWidth = rightPane.offsetWidth;
                const sidebarWidth = sidebar.offsetWidth;
                const totalPaneWidth = leftWidth + rightWidth + sidebarWidth;
                setIsCollapsedMode(window.innerWidth < totalPaneWidth);
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, [mainMode]);

    // -----------------------------
    // Event handlers
    // -----------------------------
    const handleCharacterSelect = (char) => {
        if (activeCharacter && charId) {
            const currentCharId = charId;
            setCharacterRuntimeStates(prev => ({
                ...prev,
                [currentCharId]: {
                    ...(prev[currentCharId] ?? {}),
                    Name: activeCharacter.displayName,
                    Id: currentCharId,
                    Attribute: activeCharacter.attribute,
                    WeaponType: activeCharacter.weaponType ?? activeCharacter.Weapon ?? activeCharacter.raw?.Weapon ?? 0,
                    Stats: baseCharacterState?.Stats ?? {},
                    CharacterLevel: characterLevel,
                    SkillLevels: sliderValues,
                    TraceNodeBuffs: traceNodeBuffs,
                    CustomBuffs: customBuffs,
                    CombatState: combatState,
                    Team: team,
                    rotationEntries: rotationEntries,
                    FinalStats: finalStats ?? {},
                    teamRotation: teamRotation ?? {}
                }
            }));
        }

        const newMainId = char.Id ?? char.id ?? char.link;
        const cached = characterRuntimeStates[newMainId] ?? {};
        const normalizedTeam = Array.isArray(cached.Team) ? [...cached.Team] : [newMainId, null, null];
        if (!normalizedTeam[0]) {
            normalizedTeam[0] = newMainId;
        }

        const normalizedSkillLevels = cached?.SkillLevels
            ? {
                ...cached.SkillLevels,
                tuneBreak: cached.SkillLevels.tuneBreak ?? 1,
            }
            : defaultSliderValues;
        const normalizedTraceNodeBuffs = cached?.TraceNodeBuffs ?? cached?.TemporaryBuffs ?? defaultTraceBuffs;
        const normalizedCustomBuffs = cached?.CustomBuffs ?? defaultCustomBuffs;

        const safeRotation = Array.isArray(cached.rotationEntries) ? cached.rotationEntries : [];
        const normalizedRotation = safeRotation.map(entry => ({
            ...entry,
            multiplier: typeof entry.multiplier === 'number' ? entry.multiplier : 1,
            createdAt: entry.createdAt ?? Date.now() + Math.random()
        }));

        setActiveCharacter(char);
        setActiveCharacterId(newMainId);
        setBaseCharacterState(
            cached?.Stats ? { Stats: cached.Stats } : characterStates.find(c => String(c.Id) === String(newMainId)) ?? null
        );

        const cachedCombatState = {
            ...defaultCombatState,
            ...(cached?.CombatState ?? {}),
        };

        const alreadyHasWeapon = cachedCombatState?.weaponId != null;

        if (!alreadyHasWeapon) {
            const weaponType = char.weaponType ?? char.Weapon ?? char.raw?.Weapon ?? 0;
            const defaultWeapon = Object.values(weapons)
                .filter(w => w.Type === weaponType)
                .sort((a, b) => (b.Rarity ?? 0) - (a.Rarity ?? 0))[0];

            if (defaultWeapon) {
                const levelData = defaultWeapon.Stats?.["0"]?.["1"] ?? defaultWeapon.Stats?.["0"]?.["0"];
                const baseAtk = levelData?.[0]?.Value ?? 0;
                const stat = levelData?.[1] ?? null;
                const mappedStat = mapExtraStatToCombat(stat);

                Object.assign(cachedCombatState, {
                    weaponId: defaultWeapon.Id,
                    weaponLevel: 1,
                    weaponBaseAtk: baseAtk,
                    weaponStat: stat,
                    weaponRarity: defaultWeapon.Rarity ?? 1,
                    weaponEffect: defaultWeapon.Effect ?? null,
                    weaponEffectName: defaultWeapon.EffectName ?? null,
                    weaponParam: defaultWeapon.Param ?? [],
                    weaponRank: 1,
                    atkPercent: 0,
                    defPercent: 0,
                    hpPercent: 0,
                    critRate: 0,
                    critDmg: 0,
                    energyRegen: 0,
                    ...mappedStat
                });
            }
        }

        updateRuntimeForChar(newMainId, prevChar => ({
            ...prevChar,
            Team: normalizedTeam,
            CharacterLevel: cached?.CharacterLevel ?? 1,
            SkillLevels: normalizedSkillLevels,
            TraceNodeBuffs: normalizedTraceNodeBuffs,
            CustomBuffs: normalizedCustomBuffs,
            CombatState: cachedCombatState,
            rotationEntries: normalizedRotation
        }));
        setMenuOpen(false);
    };

    useEffect(() => {
        if (team[0] && team[0] !== activeCharacterId) {
            setPersistentValue('activeCharacterId', JSON.stringify(team[0]));
            setActiveCharacterId(team[0]);
        }

    }, [team[0]]);


    useEffect(() => {
        if (!activeCharacterId) return;

        setTeam(prev => {
            if (!Array.isArray(prev)) prev = [null, null, null];

            if (prev[0]?.toString() === activeCharacterId.toString()) {
                return prev;
            }

            const newTeam = [...prev];
            newTeam[0] = activeCharacterId;
            return newTeam;
        });
    }, [activeCharacterId]);

    const overrideLogic = getCharacterOverride(
        activeCharacter?.id ?? activeCharacter?.Id ?? activeCharacter?.link
    );

    let mergedBuffs = getUnifiedStatPool(
        [traceNodeBuffs, customBuffs, normalizeLegacyEchoStats(combatState), echoStats],
        overrideLogic
    );

    team.forEach((id, index) => {
        if (!id || index === 0) return;

        const buffsLogic = getBuffsLogic(id);
        if (!buffsLogic) return;

        const characterState = {
            activeStates: characterRuntimeStates?.[charId]?.activeStates ?? {}
        };

        const result = buffsLogic({
            mergedBuffs,
            characterState,
            activeCharacter,
            combatState
        });

        if (result?.mergedBuffs) {
            mergedBuffs = result.mergedBuffs;
        }
    });

    const weaponOverride = getWeaponOverride(combatState?.weaponId);
    if (weaponOverride?.applyWeaponLogic) {
        const charId = activeCharacter?.Id ?? activeCharacter?.id ?? activeCharacter?.link;

        const currentParamValues = combatState.weaponParam?.map(
            p => p?.[Math.min(Math.max((combatState.weaponRank ?? 1) - 1, 0), 4)]
        ) ?? [];

        const characterState = {
            activeStates: characterRuntimeStates?.[charId]?.activeStates ?? {},
            toggles: characterRuntimeStates?.[charId]?.sequenceToggles ?? {},
        };
        const isToggleActive = (toggleId) =>
            characterState?.toggles?.[toggleId] === true;

        const result = weaponOverride.applyWeaponLogic({
            mergedBuffs,
            combatState,
            currentParamValues,
            characterState,
            isToggleActive,
            skillMeta: {},
            baseCharacterState,
            activeCharacter
        });

        if (result?.mergedBuffs) {
            mergedBuffs = result.mergedBuffs;
        }
    }

    mergedBuffs = applyWeaponBuffLogic({
        mergedBuffs,
        characterState: {
            activeStates: characterRuntimeStates?.[charId]?.activeStates ?? {}
        },
        activeCharacter
    });

    mergedBuffs = applyEchoLogic({
        mergedBuffs,
        characterState: {
            activeStates: characterRuntimeStates?.[charId]?.activeStates ?? {}
        },
        activeCharacter
    })

    const setCounts = getSetCounts(characterRuntimeStates[charId]?.equippedEchoes ?? []);

    mergedBuffs = applyEchoSetBuffLogic({
        mergedBuffs,
        activeCharacter,
        setCounts
    })

    mergedBuffs = applySetEffect({
        characterState: {
            activeStates: characterRuntimeStates?.[charId]?.activeStates ?? {}
        },
        activeCharacter,
        mergedBuffs,
        combatState,
        setCounts
    })

    mergedBuffs = applyMainEchoBuffLogic({
        equippedEchoes,
        mergedBuffs,
        characterState: {
            activeStates: characterRuntimeStates?.[charId]?.activeStates ?? {}
        },
        activeCharacter,
        combatState,
        charId
    })

    mergedBuffs.attribute.all.defIgnore += 2 * combatState.havocBane;

    if (overrideLogic && typeof overrideLogic === 'function') {
        const charId = activeCharacter?.Id ?? activeCharacter?.id ?? activeCharacter?.link;

        const characterState = {
            activeStates: characterRuntimeStates?.[charId]?.activeStates ?? {},
            toggles: characterRuntimeStates?.[charId]?.sequenceToggles ?? {},
        };

        const sequenceLevel = sliderValues?.sequence ?? 0;

        const isActiveSequence = (seqNum) => sequenceLevel >= seqNum;
        const isToggleActive = (toggleId) =>
            characterState?.toggles?.[toggleId] === true;

        const result = overrideLogic({
            mergedBuffs,
            combatState,
            enemyProfile,
            characterState,
            isActiveSequence,
            isToggleActive,
            skillMeta: {},
            baseCharacterState,
            sliderValues,
            characterLevel
        });

        if (result?.mergedBuffs) {
            mergedBuffs = result.mergedBuffs;
        }
    }

    let finalStats = getFinalStats(activeCharacter, baseCharacterState, characterLevel, mergedBuffs, combatState);

    useEffect(() => {
        if (!activeCharacter) return;

        const charId =
            activeCharacter.Id ?? activeCharacter.id ?? activeCharacter.link;

        setCharacterRuntimeStates(prev => {
            const prevChar = prev[charId];

            const updatedChar = {
                ...(prevChar ?? {}),
                Name: activeCharacter.displayName,
                Id: charId,
                Attribute: activeCharacter.attribute,
                WeaponType: activeCharacter.weaponType ?? 0,
                Stats: baseCharacterState?.Stats ?? {},
                CharacterLevel: characterLevel,
                SkillLevels: sliderValues,
                TraceNodeBuffs: traceNodeBuffs,
                CustomBuffs: customBuffs,
                CombatState: combatState,
                FinalStats: finalStats,
            };

            const same = prevChar && Object.keys(updatedChar).every(key => {
                const prevVal = prevChar[key];
                const newVal = updatedChar[key];

                return typeof prevVal === "object" && typeof newVal === "object"
                    ? JSON.stringify(prevVal) === JSON.stringify(newVal)
                    : prevVal === newVal;
            });

            if (same) return prev;
            return { ...prev, [charId]: updatedChar };
        });
    }, [
        activeCharacter,
        characterLevel,
        sliderValues,
        traceNodeBuffs,
        customBuffs,
        combatState,
        finalStats,
    ]);

    useLayoutEffect(() => {
        const handleResize = () => {
            setMoveToolbarToSidebar(window.innerWidth < 900);
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!teamRotation) return;

        const existing = characterRuntimeStates?.[charId]?.teamRotation ?? {};
        if (!isEqual(existing, teamRotation)) {
            setCharacterRuntimeStates(prev => ({
                ...prev,
                [charId]: {
                    ...(prev[charId] ?? {}),
                    teamRotation
                }
            }));
        }

    }, [characterRuntimeStates]);

    useEffect(() => {
        if (!charId) return;

        const runtime = characterRuntimeStates?.[charId];
        if (!runtime) return;

        const hasSummary = !!runtime.teamRotationSummary;

        if (!hasSummary) {
            const teamRotationSummary = {
                name: runtime.Name ?? '',
                total: { normal: 0, crit: 0, avg: 0 },
            };

            setCharacterRuntimeStates(prev => ({
                ...prev,
                [charId]: {
                    ...(prev[charId] ?? {}),
                    teamRotationSummary
                }
            }));
        }
    }, [characterRuntimeStates]);

    useEffect(() => {
        const charId = activeCharacter?.Id ?? activeCharacter?.id ?? activeCharacter?.link;
        const cache = characterRuntimeStates?.[charId]?.allSkillResults ?? [];

        setRotationEntries(prev => {
            return prev.map(entry => {
                const skill = cache.find(s => s.name === entry.label && s.tab === entry.tab);
                const isVisible = skill?.visible !== false;
                return { ...entry, visible: isVisible };
            });
        });
    }, [sliderValues, charId]);

    const keywords = getHighlightKeywords(activeCharacter);

    const rarityMap = Object.fromEntries(
        Object.entries(characterStates)
            .map(([key, val]) => [val.Id, val.Rarity])
    );
    const characterMap = useMemo(
        () => characterOverviewService.buildCharacterMap(characters),
        [characters]
    );
    const sortedCharacterIds = useMemo(
        () => characterOverviewService.sortedIds(characterRuntimeStates, characterMap),
        [characterRuntimeStates, characterMap]
    );

    const [isMobile, setIsMobile] = useState(window.innerWidth < 1070);
    const [isOverlayVisible, setIsOverlayVisible] = useState(false);
    const [isOverlayClosing, setIsOverlayClosing] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 1070);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (isMobile) {
            setHamburgerOpen(false);
        }
    }, [isMobile, leftPaneView, mainMode]);

    useEffect(() => {
        if (hamburgerOpen) {
            setIsOverlayVisible(true);
        } else {
            setIsOverlayClosing(true);
            setTimeout(() => {
                setIsOverlayVisible(false);
                setIsOverlayClosing(false);
            }, 400);
        }
    }, [hamburgerOpen]);

    const layoutRef = useRef(null);
    useLayoutEffect(() => {
        if (layoutRef.current) {
            layoutRef.current.scrollTop = 0;
        }
    }, [leftPaneView]);

    const switchLeftPane = (paneName) => {
        setMainMode('default');
        setLeftPaneView(paneName);
    };

    useEffect(() => {
        const characterIconPaths = characters.map(char =>
            char.icon || 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconRoleHead256/T_IconRoleHead256_1_UI.png'
        );
        preloadImages([...characterIconPaths]);
    }, [characters]);

    const handleReset = () => {
        const activeId = activeCharacterId;
        if (!activeId) return;

        const runtime = getPersistentValue('characterRuntimeStates', {});
        delete runtime[activeId];
        setPersistentValue('characterRuntimeStates', JSON.stringify(runtime));

        setCharacterRuntimeStates(prev => {
            const updated = { ...prev };
            delete updated[activeId];
            return updated;
        });

        setSliderValues(defaultSliderValues);
        setCustomBuffs(defaultCustomBuffs);
        setTraceNodeBuffs(defaultTraceBuffs);
        setCharacterLevel(1);
        setTeam([activeId ?? null, null, null]);
        setRotationEntries([]);

        const weaponId = combatState.weaponId;
        const weapon = weapons?.[weaponId];
        let resetCombatState;

        if (weapon) {
            const levelData = weapon.Stats?.["0"]?.["1"] ?? weapon.Stats?.["0"]?.["0"];
            const baseAtk = levelData?.[0]?.Value ?? 0;
            const stat = levelData?.[1] ?? null;
            const mappedStat = mapExtraStatToCombat(stat);

            resetCombatState = {
                ...defaultCombatState,
                weaponId,
                weaponLevel: 1,
                weaponRank: 1,
                weaponBaseAtk: baseAtk,
                weaponStat: stat,
                weaponRarity: weapon.Rarity ?? 1,
                weaponEffect: weapon.Effect ?? null,
                weaponEffectName: weapon.EffectName ?? null,
                weaponParam: weapon.Param ?? [],
                ...mappedStat
            };
        } else {
            resetCombatState = {
                ...defaultCombatState
            };
        }

        setCombatState(resetCombatState);
        setPopupMessage({
            message: 'Success~! (〜^∇^)〜',
            icon: '✔',
            color: { light: 'green', dark: 'limegreen' }
        });
        setShowToast(true);
    };

    useEffect(() => {
        const cleanedStates = {};

        for (const [charId, state] of Object.entries(characterRuntimeStates)) {
            const { allSkillsResults, ...rest } = state;
            cleanedStates[charId] = rest;
        }

        setCharacterRuntimeStates(cleanedStates);
    }, []);

    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmMessage, setConfirmMessage] = useState({
        title: null,
        message: null,
        confirmLabel: null,
        cancelLabel: null,
        onConfirm: () => {},
        onCancel: () => {}
    });

    useEffect(() => {
        syncAllPresetsForRuntime(characterRuntimeStates[charId]);
    }, [charId, characterRuntimeStates[charId]?.equippedEchoes]);

    function getAllSkillLevels(charId, activeCharacter, skillTabs) {
        const result = {};

        for (const tab of skillTabs) {
            const skill = getSkillData(activeCharacter, tab);
            result[tab] = getEffectiveSkillLevels(charId, activeCharacter, tab, skill);
        }

        return result;
    }

    const { charSkillResults, echoSkillResults, negativeEffects } = prepareDamageData({
        activeCharacter,
        charId,
        finalStats,
        characterLevel,
        sliderValues,
        characterRuntimeStates,
        combatState,
        mergedBuffs,
        enemyProfile,
        skillTabs,
        getAllSkillLevels,
    });

    const skillResults = [...charSkillResults, ...echoSkillResults, ...negativeEffects];
    const groupedSkillOptions = useMemo(
        () => skillGroupingService.groupedSkillOptions({
            skillResults,
            hasRotationEntries: (rotationEntries?.length ?? 0) > 0
        }),
        [skillResults, rotationEntries]
    );

    const rotationGroupedSkillOptions = useMemo(
        () => skillGroupingService.rotationGroupedSkillOptions({
            skillResults,
            hasRotationEntries: (rotationEntries?.length ?? 0) > 0
        }),
        [skillResults, rotationEntries]
    );

    const rotationTotals = characterRuntimeStates?.[charId]?.rotationSummary?.totals ?? {};
    const suggestionSkill = useMemo(() => suggestionsService.rotationAwareSkill({
        skillResults,
        rotationTotals,
        suggestionSettings: characterRuntimeStates?.[charId]?.suggestionSettings
    }), [skillResults, rotationTotals, characterRuntimeStates?.[charId]?.suggestionSettings]);

    const suggestionCacheKey = useMemo(() => suggestionsService.cacheKey({
        charId,
        level: characterRuntimeStates?.[charId]?.suggestionSettings?.level,
        tab: characterRuntimeStates?.[charId]?.suggestionSettings?.tab,
        echoData: equippedEchoes,
        rotationMode: characterRuntimeStates?.[charId]?.suggestionSettings?.rotationMode,
        rotationEntries,
        skillResults
    }), [charId, characterRuntimeStates?.[charId]?.suggestionSettings, equippedEchoes, rotationEntries, skillResults]);
    useEffect(() => {
        setCharacterRuntimeStates(prev => {
            const prevChar = prev?.[charId] ?? {};
            const prevResults = prevChar.allSkillResults ?? [];
            if (JSON.stringify(prevResults) === JSON.stringify(skillResults)) return prev;

            return {
                ...prev,
                [charId]: {
                    ...prevChar,
                    allSkillResults: skillResults,
                },
            };
        });
    }, [skillResults]);

    const skillLevels = getAllSkillLevels(charId, activeCharacter, skillTabs);
    const allSkillLevels = getAllSkillLevelsWithEcho({
        charId,
        activeCharacter,
        characterRuntimeStates,
        allSkillLevels: skillLevels,
    });

    useEffect(() => {
        if (!charId) return;

        const summary = buildRotationBreakdown(
            skillResults ?? characterRuntimeStates?.[charId]?.allSkillResults ?? [],
            allSkillLevels,
            rotationEntries
        );
        setCharacterRuntimeStates(prev => {
            const runtime = prev?.[charId] ?? {};
            if (isEqual(runtime.rotationSummary, summary)) return prev;
            return {
                ...prev,
                [charId]: {
                    ...runtime,
                    rotationSummary: summary
                }
            };
        });
    }, [charId, rotationEntries, skillResults, allSkillLevels]);

    const allRotations = getMainRotationTotals(charId, characterRuntimeStates, savedRotations, savedTeamRotations, skillResults);
    const teamRotationDmg = getTeamRotationTotal(charId, characterRuntimeStates, skillResults);

    useEffect(() => {
        if (!skillTabs?.length || !charId) return;

        const tab = skillTabs[0];
        const currentLevels = allSkillLevels?.[tab];
        if (!currentLevels) return;

        const defaultOptimizer = {
            level: currentLevels[0],
            tab,
            rotationMode: true
        }

        const defaultSuggestion = { ...defaultRandGen, level: currentLevels[0], tab };

        const allSkillResults =
            skillResults ??
            characterRuntimeStates[charId]?.allSkillResults ??
            getSkillDamageCache();

        const rotationData = getDefaultRotationEntries(charId);
        const entries = rotationData?.entries ?? [];
        const defaultRotationData = buildRotation(charId, groupedSkillOptions);
        const builtRotations = defaultRotationData?.builtRotations ?? [];

        setCharacterRuntimeStates(prev => {
            const prevChar = prev?.[charId] ?? {};
            const newChar = { ...prevChar };

            let changed = false;

            if (!newChar.randGenSettings?.level) {
                newChar.randGenSettings = defaultSuggestion;
                changed = true;
            }

            if (!newChar.optimizerSettings?.level) {
                newChar.optimizerSettings = defaultOptimizer;
                changed = true;
            }

            if (!newChar.suggestionSettings?.level) {
                newChar.suggestionSettings = defaultSuggestion;
                changed = true;
            }

            if (!newChar.setData) {
                newChar.setData = loadCharSetData(charId);
                changed = true;
            }

            if (JSON.stringify(newChar.groupedSkillOptions) !== JSON.stringify(groupedSkillOptions)) {
                newChar.groupedSkillOptions = groupedSkillOptions;
                changed = true;
            }

            const existingRotation = newChar.rotationEntries ?? [];
            const hasNoRotation = existingRotation.length === 0;
            const hasPreset =
                Array.isArray(entries) && entries.length > 0 && builtRotations.length > 0;
            if (hasNoRotation && hasPreset && !newChar._rotationInitialized) {
                newChar.rotationEntries = builtRotations;
                newChar._rotationInitialized = true;
                changed = true;
            } else if (!hasNoRotation && hasPreset) {
                newChar._rotationInitialized = true;
            }

            if (!changed) return prev;

            return {
                ...prev,
                [charId]: newChar,
            };
        });

    }, [charId, skillTabs, allSkillLevels, skillResults]);

    const [selectedSet, setSelectedSet] = useState(null);
    const [selectedCost, setSelectedCost] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [bagOpen, setBagOpen] = useState(false);
    const [editingEcho, setEditingEcho] = useState(null);
    const getImageSrc = (icon) => imageCache[icon]?.src || icon;
    const [viewMode, setViewMode] = useState('echoes');

    function onEquipPreset(presetOrId) {
        if (!charId || !setCharacterRuntimeStates) return;
        const preset =
            typeof presetOrId === 'string' || typeof presetOrId === 'number'
                ? getEchoPresetById(presetOrId)
                : presetOrId;
        if (!preset || !Array.isArray(preset.echoes)) return;
        if (deepCompareEchoArrays(characterRuntimeStates[charId].equippedEchoes, preset.echoes)) {
            setPopupMessage({
                message: `OH... seems like you've got this on already... (゜。゜)`,
                icon: '✔',
                color: { light: 'green', dark: 'limegreen' },
            });
            setShowToast(true);
            return;
        }
        setCharacterRuntimeStates(prev => {
            const prevChar = prev[charId] ?? {};
            return {
                ...prev,
                [charId]: {
                    ...prevChar,
                    equippedEchoes: preset.echoes.map(e => (e ? { ...e } : null)),
                },
            };
        });
        setPopupMessage({
            message: 'Equipped~! (〜^∇^)〜',
            icon: '✔',
            color: { light: 'green', dark: 'limegreen' },
        });
        setShowToast(true);
    }

    function onEquipBag(echo, slotIndex) {
        const currentEchoes = characterRuntimeStates[charId]?.equippedEchoes ?? [];
        const currentTotalCost = currentEchoes.reduce((sum, e, i) => {
            return i === slotIndex ? sum : sum + (e?.cost ?? 0);
        }, 0);
        const newTotalCost = currentTotalCost + (echo.cost ?? 0);
        if (newTotalCost > 12) {
            setPopupMessage({
                message: 'Nice Try! But... Cost (' + newTotalCost + ') > 12 (￣￢￣ヾ)',
                icon: '✘',
                color: 'red'
            });
            setShowToast(true);
            return;
        }
        const prevEchoes = characterRuntimeStates[charId]?.equippedEchoes ?? [null, null, null, null, null];
        const updatedEchoes = [...prevEchoes];
        updatedEchoes[slotIndex] = echo;
        setCharacterRuntimeStates(prev => ({
            ...prev,
            [charId]: {
                ...(prev[charId] ?? {}),
                equippedEchoes: updatedEchoes
            }
        }));
        //setBagOpen(false);
    }

    const [optimizerResults, setOptimizerResults] = useState([]);

    const [suggestionsPaneSettings, setSuggestionsPaneSettings] = usePersistentState('suggestionsPaneSettings', {});

    useEffect(() => {
        if (!activeCharacter?.raw?.SkillTrees) return;

        const existing = traceNodeBuffs ?? {};
        const activeNodes = existing.activeNodes ?? {};

        const looksUnified =
            existing.atk &&
            existing.hp &&
            existing.def &&
            existing.attribute;

        if (looksUnified) return;

        const buffs = createEmptyTraceBuffs();
        const newActiveNodes = {};

        for (const [nodeId, node] of Object.entries(activeCharacter.raw.SkillTrees ?? {})) {
            if (!activeNodes[nodeId]) continue;
/*
            if (node.NodeType !== 4) continue;
*/

            const skillName = node.Skill?.Name;
            if (!skillName) continue;

            const raw = node.Skill?.Param?.[0] ?? "0";
            const percent = parseFloat(String(raw).replace('%', ''));

            applyTraceBuff(buffs, skillName, percent);
            newActiveNodes[nodeId] = true;
        }

        buffs.activeNodes = newActiveNodes;

        setTraceNodeBuffs(buffs);
    }, [activeCharacter, traceNodeBuffs?.activeNodes, setTraceNodeBuffs]);

    const [statusOpen, setStatusOpen] = useState(false);

    useEffect(() => {
        if (!equippedEchoes[0]) return;
        const { nebulousCannon, collapsarBlade } =
            computeNebulousCollapsarStates(equippedEchoes);

        setCharacterRuntimeStates(prev => ({
            ...prev,
            [charId]: {
                ...(prev[charId] ?? {}),
                activeStates: {
                    ...(prev[charId]?.activeStates ?? {}),
                    nebulousCannon,
                    collapsarBlade,
                }
            }
        }));
    }, [equippedEchoes]);

    //console.log(runtime);

    // -----------------------------
    // Render
    // -----------------------------
    return (
        <>
            {skillsModalOpen && (
                <Suspense fallback={null}>
                    <SkillsModal
                        skillsModalOpen={skillsModalOpen}
                        setSkillsModalOpen={setSkillsModalOpen}
                        activeCharacter={activeCharacter}
                        activeSkillTab={activeSkillTab}
                        setActiveSkillTab={setActiveSkillTab}
                        sliderValues={sliderValues}
                        currentSliderColor={currentSliderColor}
                        keywords={keywords}
                        isDark={isDark}
                    />
                </Suspense>
            )}

            <AppStatusModal
                open={statusOpen}
                onClose={() => setStatusOpen(false)}
            />

            {bagOpen && (
                <Suspense fallback={null}>
                    <EchoBagMenu
                        runtime={characterRuntimeStates[charId]}
                        characterRuntimeStates={characterRuntimeStates}
                        getImageSrc={getImageSrc}
                        characters={characters}
                        onEquipPreset={onEquipPreset}
                        viewMode={viewMode}
                        setViewMode={setViewMode}
                        setConfirmMessage={setConfirmMessage}
                        setShowToast={setShowToast}
                        setShowConfirm={setShowConfirm}
                        setPopupMessage={setPopupMessage}
                        editingEcho={editingEcho}
                        setEditingEcho={setEditingEcho}
                        selectedSet={selectedSet}
                        setSelectedSet={setSelectedSet}
                        selectedCost={selectedCost}
                        setSelectedCost={setSelectedCost}
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        charId={charId}
                        onClose={() => {
                            setEditingEcho(null);
                            setBagOpen(false);
                        }}
                        onEquip={onEquipBag}
                    />
                </Suspense>
            )}

            <div className={`layout ${isDark ? 'dark-text' : 'light-text'} `}>
                <div className="toolbar">
                    {!moveToolbarToSidebar && (
                        <div className="toolbar-group">
                            <ToolbarIconButton
                                iconName="character"
                                altText="Characters"
                                onClick={() => switchLeftPane('characters')}
                                isDark={isDark}
                            />
                            <ToolbarIconButton
                                iconName="weapon"
                                altText="Weapon"
                                onClick={() => switchLeftPane('weapon')}
                                isDark={isDark}
                            />
                            <ToolbarIconButton
                                iconName="echoes"
                                altText="Echoes"
                                onClick={() => switchLeftPane('echoes')}
                                isDark={isDark}
                            />
                            <ToolbarIconButton
                                iconName="suggestions"
                                altText="Suggestions"
                                onClick={() => switchLeftPane('suggestions-ui')}
                                isDark={isDark}
                            />
                            <ToolbarIconButton
                                iconName="teams"
                                altText="Team"
                                onClick={() => switchLeftPane('teams')}
                                isDark={isDark}
                            />
                            <ToolbarIconButton
                                iconName="enemy"
                                altText="Enemy"
                                onClick={() => switchLeftPane('enemy')}
                                isDark={isDark}
                            />
                            <ToolbarIconButton
                                iconName="buffs"
                                altText="Buffs"
                                onClick={() => switchLeftPane('buffs')}
                                isDark={isDark}
                            />
                            <ToolbarIconButton
                                iconName="rotations"
                                altText="Rotation"
                                onClick={() => switchLeftPane('rotation')}
                                isDark={isDark}
                            />
                        </div>
                    )}
                    <button
                        className={`hamburger-button ${hamburgerOpen ? 'open' : ''}`}
                        onClick={() => setHamburgerOpen(prev => !prev)}
                    >
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>
                </div>

                <div className="horizontal-layout">
                    <div
                        className={`sidebar ${
                            isMobile
                                ? hamburgerOpen ? 'open' : ''
                                : hamburgerOpen ? 'expanded' : 'collapsed'
                        }`}
                    >
                        <div className="sidebar-content">
                            <button
                                className={`sidebar-button ${showDropdown ? 'active' : ''}`}
                                onClick={() => setShowDropdown(prev => !prev)}
                            >
                                <div className="icon-slot">
                                    <Sparkle size={24} />
                                </div>
                                <div className="label-slot">
                                    <span className="label-text">Home</span>
                                </div>
                            </button>

                            <div className={`sidebar-dropdown ${showDropdown ? 'open' : ''}`}>
                                <button className="sidebar-sub-button" onClick={() => navigate('/settings')}>
                                    <div className="icon-slot">
                                        <Settings size={24} className="settings-icon" stroke="currentColor" />
                                    </div>
                                    <div className="label-slot">
                                        <span className="label-text">Settings</span>
                                    </div>
                                </button>

                                <button className="sidebar-sub-button" onClick={() => navigate('/info')}>
                                    <div className="icon-slot">
                                        <Info size={24} />
                                    </div>
                                    <div className="label-slot">
                                        <span className="label-text">Info</span>
                                    </div>
                                </button>
                                <button className="sidebar-sub-button" onClick={() => navigate('/guides')}>
                                    <div className="icon-slot">
                                        <HelpCircle size={24} className="help-icon" stroke="currentColor" />
                                    </div>
                                    <div className="label-slot">
                                        <span className="label-text">Guides</span>
                                    </div>
                                </button>
                                <button
                                    className="sidebar-sub-button"
                                    onClick={() => navigate('/changelog')}
                                >
                                    <div className="icon-slot">
                                        <History size={24} stroke="currentColor" />
                                    </div>
                                    <div className="label-slot">
                                        <span className="label-text">Changelog</span>
                                    </div>
                                </button>
                            </div>

                            {moveToolbarToSidebar && (
                                <div className="sidebar-toolbar">
                                    <ToolbarSidebarButton
                                        iconName="character"
                                        label="Characters"
                                        onClick={() => switchLeftPane('characters')}
                                        selected={leftPaneView === 'characters'}
                                        isDark={isDark}
                                    />
                                    <ToolbarSidebarButton
                                        iconName="weapon"
                                        label="Weapon"
                                        onClick={() => switchLeftPane('weapon')}
                                        selected={leftPaneView === 'weapon'}
                                        isDark={isDark}
                                    />
                                    <ToolbarSidebarButton
                                        iconName="echoes"
                                        label="Echoes"
                                        onClick={() => switchLeftPane('echoes')}
                                        selected={leftPaneView === 'echoes'}
                                        isDark={isDark}
                                    />
                                    <ToolbarSidebarButton
                                        iconName="suggestions"
                                        label="Suggestions"
                                        onClick={() => switchLeftPane('suggestions-ui')}
                                        selected={leftPaneView === 'suggestions-ui'}
                                        isDark={isDark}
                                    />
                                    <ToolbarSidebarButton
                                        iconName="teams"
                                        label="Team Buffs"
                                        onClick={() => switchLeftPane('teams')}
                                        selected={leftPaneView === 'teams'}
                                        isDark={isDark}
                                    />
                                    <ToolbarSidebarButton
                                        iconName="enemy"
                                        label="Enemy"
                                        onClick={() => switchLeftPane('enemy')}
                                        selected={leftPaneView === 'enemy'}
                                        isDark={isDark}
                                    />
                                    <ToolbarSidebarButton
                                        iconName="buffs"
                                        label="Custom Bonuses"
                                        onClick={() => switchLeftPane('buffs')}
                                        selected={leftPaneView === 'buffs'}
                                        isDark={isDark}
                                    />
                                    <ToolbarSidebarButton
                                        iconName="rotations"
                                        label="Rotation"
                                        onClick={() => switchLeftPane('rotation')}
                                        selected={leftPaneView === 'rotations'}
                                        isDark={isDark}
                                    />
                                </div>
                            )}

                            <button className="sidebar-button" onClick={() => setBagOpen(true)}>
                                <div className="icon-slot">
                                    <Backpack />
                                </div>
                                <div className="label-slot">
                                    <span className="label-text">
                                        Bag
                                    </span>
                                </div>
                            </button>


                            <button
                                className="sidebar-button"
                                onClick={() =>
                                    setMainMode(prev => (prev === 'optimizer' ? 'default' : 'optimizer'))
                                }
                            >
                                <div className="icon-slot">
                                    <ChartColumn />
                                </div>
                                <div className="label-slot">
                                    <span className="label-text">Optimizer</span>
                                </div>
                            </button>

                            <button
                                className="sidebar-button"
                                onClick={() =>
                                    setMainMode(prev => (prev === 'overview' ? 'default' : 'overview'))
                                }
                            >
                                <div className="icon-slot">
                                    <UserRound />
                                </div>
                                <div className="label-slot">
                                    <span className="label-text">Overview</span>
                                </div>
                            </button>

                            <button className="sidebar-button" onClick={() => setStatusOpen(true)}>
                                <div className="icon-slot">
                                    <Activity />
                                </div>
                                <div className="label-slot">
                                    <span className="label-text">
                                        Status
                                    </span>
                                </div>
                            </button>

                            {theme !== "background" && (
                                <button className="sidebar-button" onClick={toggleTheme}>
                                    <div className="icon-slot theme-toggle-icon">
                                        <Sun className="icon-sun" size={24} />
                                        <Moon className="icon-moon" size={24} />
                                    </div>
                                    <div className="label-slot">
                                    <span className="label-text">
                                        {!isDark ? 'Dawn' : 'Dusk'}
                                    </span>
                                    </div>
                                </button>
                            )}
                        </div>
                        <div className="sidebar-footer">
                            <button className="sidebar-button"
                                    onClick={() => {
                                        setTimeout(() => {
                                            const message = getCuteMessage(user);
                                            setPopupMessage({
                                                message,
                                                icon: '❤',
                                                color: { light: 'green', dark: 'limegreen' },
                                                duration: 5000
                                            });
                                            setShowToast(true);
                                        }, 300);
                                    }}
                            >
                                <div className="icon-slot">
                                    <ScanHeart size={24} />
                                </div>
                                <div className="label-slot">
                                    <span className="label-text">Say Hi~!</span>
                                </div>
                            </button>
                            <a
                                href="https://discord.gg/wNaauhE4uH"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="sidebar-button discord"
                            >
                                <div className="icon-slot">
                                    <img src="/assets/icons/discord.svg" alt="Discord" className="discord-icon" style={{ maxWidth:'24px', maxHeight:'24px' }} />
                                </div>
                                <div className="label-slot">
                                    <span className="label-text">
                                        Discord
                                    </span>
                                </div>
                            </a>

                            <button className="sidebar-button reset"
                                    onClick={() => {
                                        setConfirmMessage({
                                            confirmLabel: 'Reset Character',
                                            onConfirm: handleReset,
                                        });
                                        setShowConfirm(true);
                                    }}
                            >
                                <div className="icon-slot">
                                    <RotateCcw size={24} className="reset-icon" />
                                </div>
                                <div className="label-slot">
                                    <span className="label-text">Reset</span>
                                </div>
                            </button>
                        </div>
                    </div>

                    {isOverlayVisible && isMobile && (
                        <div
                            className={`mobile-overlay ${hamburgerOpen ? 'visible' : ''} ${isOverlayClosing ? 'closing' : ''}`}
                            onClick={() => setHamburgerOpen(false)}
                        />
                    )}

                    <div className="main-content">
                        <div className={`layout ${isCollapsedMode ? 'collapsed-mode' : ''}`} ref={layoutRef}>
                            {mainMode === 'overview' ? (
                                <Suspense fallback={null}>
                                    <CharacterOverviewPane
                                        characters={characters}
                                        keywords={keywords}
                                        activeCharacterId={activeCharacterId}
                                        characterRuntimeStates={characterRuntimeStates}
                                        characterMap={characterMap}
                                        sortedCharacterIds={sortedCharacterIds}
                                        onClose={() => setMainMode('default')}
                                        weapons={weapons}
                                        handleCharacterSelect={handleCharacterSelect}
                                        switchLeftPane={switchLeftPane}
                                        setLeftPaneView={setLeftPaneView}
                                        isCollapsedMode={isCollapsedMode}
                                        setCharacterRuntimeStates={setCharacterRuntimeStates}
                                        handleReset={handleReset}
                                        allRotations={allRotations}
                                        theme={theme}
                                    />
                                </Suspense>
                            ) : mainMode === 'optimizer' ? (
                                <Suspense fallback={null}>
                                    <Optimizer
                                        rotationEntries={rotationEntries}
                                        charId={charId}
                                        characterRuntimeStates={characterRuntimeStates}
                                        setCharacterRuntimeStates={setCharacterRuntimeStates}
                                        characters={characters}
                                        activeCharacter={activeCharacter}
                                        baseCharacterState={baseCharacterState}
                                        mergedBuffs={mergedBuffs}
                                        allSkillLevels={allSkillLevels}
                                        skillResults={skillResults}
                                        getImageSrc={getImageSrc}
                                        optimizerResults={optimizerResults}
                                        setOptimizerResults={setOptimizerResults}
                                        groupedSkillOptions={groupedSkillOptions}
                                        rarityMap={rarityMap}
                                        triggerRef={triggerRef}
                                        menuOpen={menuOpen}
                                        setMenuOpen={setMenuOpen}
                                        menuRef={menuRef}
                                        handleCharacterSelect={handleCharacterSelect}
                                        generalOptimizerSettings={generalOptimizerSettings}
                                        setGeneralOptimizerSettings={setGeneralOptimizerSettings}
                                        switchLeftPane={switchLeftPane}
                                        finalStats={finalStats}
                                        keywords={keywords}
                                        enemyProfile={enemyProfile}
                                    />
                                </Suspense>
                            ) : (
                                <div className="split">
                                    <div id="left-pane" className={`partition ${leftPaneView}-mode`}>
                                        {leftPaneView === 'characters' && (
                                            characters?.length > 0 ? (
                                                <CharacterSelector
                                                    characters={characters}
                                                    activeCharacter={activeCharacter}
                                                    handleCharacterSelect={handleCharacterSelect}
                                                    menuOpen={menuOpen}
                                                    setMenuOpen={setMenuOpen}
                                                    menuRef={menuRef}
                                                    attributeIconPath={attributeIconPath}
                                                    currentSliderColor={currentSliderColor}
                                                    sliderValues={sliderValues}
                                                    setSliderValues={setSliderValues}
                                                    characterLevel={characterLevel}
                                                    setCharacterLevel={setCharacterLevel}
                                                    setSkillsModalOpen={setSkillsModalOpen}
                                                    traceNodeBuffs={traceNodeBuffs}
                                                    setTraceNodeBuffs={setTraceNodeBuffs}
                                                    characterRuntimeStates={characterRuntimeStates}
                                                    setCharacterRuntimeStates={setCharacterRuntimeStates}
                                                    triggerRef={triggerRef}
                                                    characterStates={characterStates}
                                                    attributeMap={attributeMap}
                                                    weaponMap={weaponMap}
                                                    keywords={keywords}
                                                    rarityMap={rarityMap}
                                                    isDark={isDark}
                                                />
                                            ) : null
                                        )}
                                        {leftPaneView === 'weapon' && (
                                            <Suspense fallback={null}>
                                                <WeaponPane
                                                    activeCharacter={activeCharacter}
                                                    combatState={combatState}
                                                    setCombatState={setCombatState}
                                                    weapons={weapons}
                                                    weaponList={weaponPrep.list}
                                                    weaponById={weaponPrep.weaponById}
                                                    weaponIconPaths={weaponPrep.iconPaths}
                                                    weaponKeywords={weaponPrep.keywords}
                                                    characterRuntimeStates={characterRuntimeStates}
                                                    setCharacterRuntimeStates={setCharacterRuntimeStates}
                                                />
                                            </Suspense>
                                        )}
                                        {leftPaneView === 'enemy' && (
                                            <Suspense fallback={null}>
                                                <EnemyPane
                                                    enemyProfile={enemyProfile}
                                                    setEnemyProfile={setEnemyProfile}
                                                    enemy={selectedEnemy}
                                                    enemies={allEnemiesList}
                                                    allEnemies={allEnemiesList}
                                                    enemyMap={enemyMap}
                                                    customEnemies={customEnemies}
                                                    setCustomEnemies={setCustomEnemies}
                                                    combatState={combatState}
                                                    setCombatState={setCombatState}
                                                    menuRef={menuRef}
                                                />
                                            </Suspense>
                                        )}
                                        {leftPaneView === 'buffs' && (
                                            <Suspense fallback={null}>
                                                <CustomBuffsPane customBuffs={customBuffs} setCustomBuffs={setCustomBuffs} />
                                            </Suspense>
                                        )}
                                        {leftPaneView === 'teams' && (
                                            <BuffsPane
                                                characters={characters}
                                                team={team}
                                                setTeam={setTeam}
                                                setActiveCharacterId={setActiveCharacterId}
                                                combatState={combatState}
                                                setCombatState={setCombatState}
                                                characterRuntimeStates={characterRuntimeStates}
                                                activeCharacter={activeCharacter}
                                                setCharacterRuntimeStates={setCharacterRuntimeStates}
                                                characterStates={characterStates}
                                                rarityMap={rarityMap}
                                                savedRotations={savedRotations}
                                            />
                                        )}
                                        {leftPaneView === 'rotation' && (
                                            <Suspense fallback={null}>
                                                <RotationsPane
                                                    activeCharacter={activeCharacter}
                                                    characterRuntimeStates={characterRuntimeStates}
                                                    characters={characters}
                                                    setActiveCharacter={setActiveCharacter}
                                                    setActiveCharacterId={setActiveCharacterId}
                                                    setCharacterRuntimeStates={setCharacterRuntimeStates}
                                                    setTeam={setTeam}
                                                    setSliderValues={setSliderValues}
                                                    setCharacterLevel={setCharacterLevel}
                                                    setTraceNodeBuffs={setTraceNodeBuffs}
                                                    setCustomBuffs={setCustomBuffs}
                                                    setCombatState={setCombatState}
                                                    setBaseCharacterState={setBaseCharacterState}
                                                    characterStates={characterStates}
                                                    finalStats={finalStats}
                                                    combatState={combatState}
                                                    mergedBuffs={mergedBuffs}
                                                    sliderValues={sliderValues}
                                                    characterLevel={characterLevel}
                                                    rotationEntries={rotationEntries}
                                                    setRotationEntries={setRotationEntries}
                                                    currentSliderColor={currentSliderColor}
                                                    setLeftPaneView={setLeftPaneView}
                                                    savedRotations={savedRotations}
                                                    setSavedRotations={setSavedRotations}
                                                    charId={charId}
                                                    setSavedTeamRotations={setSavedTeamRotations}
                                                    savedTeamRotations={savedTeamRotations}
                                                    smartFilter={smartFilter}
                                                    setSmartFilter={setSmartFilter}
                                                    skillResults={skillResults}
                                                    groupedSkillOptions={rotationGroupedSkillOptions}
                                                />
                                            </Suspense>
                                        )}
                                        {leftPaneView === 'echoes' && (
                                            <Suspense fallback={null}>
                                                <EchoesPane
                                                    charId={charId}
                                                    characterRuntimeStates={characterRuntimeStates}
                                                    setCharacterRuntimeStates={setCharacterRuntimeStates}
                                                    echoMeta={echoMeta}
                                                />
                                            </Suspense>
                                        )}
                                        {leftPaneView === 'suggestions-ui' && (
                                            <Suspense fallback={null}>
                                                <SuggestionsPane
                                                    currentSliderColor={currentSliderColor}
                                                    charId={charId}
                                                    characterRuntimeStates={characterRuntimeStates}
                                                    setCharacterRuntimeStates={setCharacterRuntimeStates}
                                                    activeCharacter={activeCharacter}
                                                    baseCharacterState={baseCharacterState}
                                                    mergedBuffs={mergedBuffs}
                                                    allSkillLevels={allSkillLevels}
                                                    skillResults={skillResults}
                                                    getImageSrc={getImageSrc}
                                                    suggestionsPaneSettings={suggestionsPaneSettings}
                                                    setSuggestionsPaneSettings={setSuggestionsPaneSettings}
                                                    keywords={keywords}
                                                    rotationEntries={rotationEntries}
                                                    enemyProfile={enemyProfile}
                                                    rotationSkill={suggestionSkill}
                                                    suggestionCacheKey={suggestionCacheKey}
                                                />
                                            </Suspense>
                                        )}
                                    </div>

                                    <div id="right-pane" className="partition">
                                        <CharacterStats
                                            activeCharacter={activeCharacter}
                                            baseCharacterState={baseCharacterState}
                                            characterLevel={characterLevel}
                                            traceNodeBuffs={traceNodeBuffs}
                                            finalStats={finalStats}
                                            combatState={combatState}
                                            mergedBuffs={mergedBuffs}
                                        />
                                        <DamageSection
                                            charId={charId}
                                            activeCharacter={activeCharacter}
                                            skillResults={skillResults}
                                            echoSkillResults={echoSkillResults}
                                            negativeEffects={negativeEffects}
                                            rotationEntries={rotationEntries}
                                            setShowSubHits={setShowSubHits}
                                            showSubHits={showSubHits}
                                            teamRotationDmg={teamRotationDmg}
                                            characterRuntimeStates={characterRuntimeStates}
                                            characterStates={characterStates}
                                            setCharacterRuntimeStates={setCharacterRuntimeStates}
                                            isDark={isDark}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>

            {showToast && popupMessage.message && (
                <NotificationToast
                    message={popupMessage.message}
                    icon={popupMessage.icon}
                    color={popupMessage.color}
                    onClose={() => setShowToast(false)}
                    position={'top'}
                    bold={true}
                    duration={popupMessage.duration}
                    prompt={popupMessage.prompt}
                    borderColor={currentSliderColor}
                />
            )}

            {showConfirm && (
                <ConfirmationModal
                    open={showConfirm}
                    title={confirmMessage.title}
                    message={confirmMessage.message}
                    confirmLabel={confirmMessage.confirmLabel}
                    onConfirm={confirmMessage.onConfirm}
                    onCancel={confirmMessage.onCancel}
                    onClose={() => setShowConfirm(false)}
                />
            )}
        </>
    );
}

function getHighlightKeywords(character) {
    const result = [];
    const skillTrees = character?.raw?.SkillTrees;
    if (skillTrees && typeof skillTrees === 'object') {
        if (character?.displayName) {
            result.push(character.displayName);
        }

        const skillNames = [];
        const levelNames = [];

        Object.values(skillTrees).forEach(tree => {
            const skills = tree?.Skill;

            if (skills?.Name) {
                skillNames.push(skills.Name);
            }

            const levelObj = skills?.Level;
            if (levelObj && typeof levelObj === 'object') {
                Object.values(levelObj).forEach(level => {
                    if (level?.Name) {
                        levelNames.push(level.Name);
                    }
                });
            }
        });

        let combined = [...skillNames.slice(0, -8), ...levelNames];
        const cleaned = combined
            .filter(name => {
                return !(
                    name.includes("Concerto Regen") ||
                    name.includes("Cost") ||
                    name.includes("Cooldown") ||
                    name.includes("CD") ||
                    name.includes("HA") ||
                    name.includes('Skill')

                );
            })
            .map(name => {
                return name.replace(/( DMG| Damage)$/i, '');
            });

        result.push(...cleaned);
    }

    result.push('Negative Statuses', 'Negative Status');


    return result;
}

const skillTabs = ['normalAttack', 'resonanceSkill', 'forteCircuit', 'resonanceLiberation', 'introSkill', 'outroSkill', 'tuneBreak', 'echoAttacks', 'negativeEffect'];
