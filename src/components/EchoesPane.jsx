import React, {useEffect, useRef, useState} from 'react';
import EchoMenu from './EchoMenu.jsx';
import EditSubstatsModal from './EchoEditModal.jsx';
import echoSets, {setIconMap, skillKeywords, statKeywords} from "../constants/echoSetData.jsx";
import { getEchoSetUIOverrides } from "../data/set-ui/index.js";
import { echoes } from '../json-data-scripts/getEchoes.js';
import {attributeColors} from "../utils/attributeHelpers.js";
import {Backpack, X, Save, Info} from "lucide-react";
import {mainEchoBuffs} from "../data/buffs/setEffect.js";
import DropdownSelect from "./DropdownSelect.jsx";
import EchoBagMenu from "./EchoBagMenu.jsx";
import {
    getEchoBag,
    subscribeEchoBag,
    addEchoToBag,
} from '../state/echoBagStore';
import ExpandableSection from "./Expandable";
import EchoParser from "./EchoParser.jsx";
import {applyParsedEchoesToEquipped} from "../utils/buildEchoObjectsFromParsedResults.js";
import {
    applyFixedSecondMainStat, computeRollForStat, formatDescription, formatStatKey, getEchoScores,
    getEchoStatsFromEquippedEchoes,
    getSetCounts, getTop5SubstatScoreDetails,
    getValidMainStats, statDisplayOrder, statIconMap
} from "../utils/echoHelper.js";
import {imageCache, preloadImages} from "../pages/calculator.jsx";
import NotificationToast from "./NotificationToast.jsx";
import GuidesModal from "./GuideModal.jsx";
import ConfirmationModal from "./ConfirmationModal.jsx";
import {deepCompareEchoArrays, getEchoPresetById} from "../state/echoPresetStore.js";
import {
    findBestFullEchoSetMonteCarlo,
} from "../utils/echoGenerator.js";
import {findBestEchoSetFromArray, getTopEchoesByStatWeight} from "../utils/optimizer.js";
import {EchoGenerator} from "./EchoGenerator.jsx";

export default function EchoesPane({
                                       charId,
                                        setCharacterRuntimeStates,
                                        characterRuntimeStates,
                                       characters,
                                       activeCharacter,
                                       skillTabs,
                                       baseCharacterState,
                                       mergedBuffs,
                                       getAllSkillLevels,
                                       allSkillLevels,
                                       skillResults,
                                   }) {
    const getImageSrc = (icon) => imageCache[icon]?.src || icon;

    const runtime = characterRuntimeStates[charId];
    const [showToast, setShowToast] = useState(false);
    const [popupMessage, setPopupMessage] = useState({
        icon: null,
        message: null,
        color: null,
    });

    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmMessage, setConfirmMessage] = useState({
        title: null,
        message: null,
        confirmLabel: null,
        cancelLabel: null,
        onConfirm: () => {},
        onCancel: () => {}
    });

    const [showGuide, setShowGuide] = useState(false);
    const [onGuideClose, setGuideClose] = useState(null);

    const [guideCategory, setGuideCategory] = useState(null);

    const openGuide = React.useCallback((category) => {
        setGuideCategory(category);
        setShowGuide(true);
    }, []);

    const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);

    const echoSlots = [0, 1, 2, 3, 4];
    const [menuOpen, setMenuOpen] = useState(false);
    const [activeSlot, setActiveSlot] = useState(null);
    const [substatModalSlot, setSubstatModalSlot] = useState(null);
    const menuRef = useRef(null);
    const echoData = runtime?.equippedEchoes ?? [null, null, null, null, null];
    const [showEffect, setShowEffect] = useState(false);
    const [bagOpen, setBagOpen] = useState(false);
    const [editingEcho, setEditingEcho] = useState(null);

    const handleRemoveEcho = (slotIndex) => {
        const currentEchoes = runtime?.equippedEchoes ?? [null, null, null, null, null];
        const updated = [...currentEchoes];
        updated[slotIndex] = null;

        setCharacterRuntimeStates(prev => ({
            ...prev,
            [charId]: {
                ...(prev[charId] ?? {}),
                equippedEchoes: updated
            }
        }));
    };
    const [selectedSet, setSelectedSet] = useState(null);
    const [selectedCost, setSelectedCost] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [echoBag, setEchoBag] = useState(getEchoBag());

    useEffect(() => {
        const unsubscribe = subscribeEchoBag(setEchoBag);
        return unsubscribe;
    }, []);

    const handleEchoIconClick = (slotIndex) => {
        setActiveSlot(slotIndex);
        setMenuOpen(true);
    };

    const handleSubstatSave = (updatedEcho) => {
        setCharacterRuntimeStates(prev => {
            const prevEchoes = prev?.[charId]?.equippedEchoes ?? [null, null, null, null, null];

            const newEchoes = prevEchoes.map((echo, i) =>
                i === substatModalSlot ? updatedEcho : echo
            );

            return {
                ...prev,
                [charId]: {
                    ...(prev[charId] ?? {}),
                    equippedEchoes: newEchoes
                }
            };
        });

        setSubstatModalSlot(null);
    };

    const activeStates = characterRuntimeStates?.[charId]?.activeStates ?? {};
    const toggleState = (key) => {
        setCharacterRuntimeStates(prev => ({
            ...prev,
            [charId]: {
                ...(prev[charId] ?? {}),
                activeStates: {
                    ...(prev[charId]?.activeStates ?? {}),
                    [key]: !(prev[charId]?.activeStates?.[key] ?? false)
                }
            }
        }));
    };

    const handleEchoSelect = (selectedEcho) => {
        const currentEchoes = characterRuntimeStates?.[charId]?.equippedEchoes ?? [null, null, null, null, null];

        const totalCost = currentEchoes.reduce((sum, echo, index) => {
            if (index === activeSlot || !echo) return sum;
            return sum + (echo.cost ?? 0);
        }, 0);

        const newCost = selectedEcho.cost ?? 0;
        if (totalCost + newCost > 12) {
            const badEchoCost = totalCost + newCost;
            setPopupMessage({
                message: 'Nice Try! But... cost (' + badEchoCost + ') > 12 (￣￢￣ヾ)',
                icon: '✘',
                color: 'red'
            });
            setShowToast(true);
            return;
        }

        const oldEcho = currentEchoes[activeSlot];
        const oldCost = oldEcho?.cost;

        let mainStats;
        if (oldCost === newCost && oldEcho?.mainStats) {
            mainStats = { ...oldEcho.mainStats };
        } else {
            const validMainStatKeys = Object.keys(getValidMainStats(newCost));
            const firstValid = validMainStatKeys[0];
            mainStats = applyFixedSecondMainStat({
                [firstValid]: getValidMainStats(newCost)?.[firstValid]
            }, newCost);
        }

        const subStats = { ...(oldEcho?.subStats ?? {}) };

        const validSets = selectedEcho.sets ?? [];
        const inheritedSet = oldEcho?.selectedSet;
        const selectedSet = validSets.includes(inheritedSet) ? inheritedSet : validSets[0] ?? null;

        const newEcho = {
            ...selectedEcho,
            mainStats,
            subStats,
            selectedSet,
            originalSets: validSets,
            uid: crypto.randomUUID?.() ?? Date.now().toString(),
        };

        setCharacterRuntimeStates(prev => ({
            ...prev,
            [charId]: {
                ...(prev[charId] ?? {}),
                equippedEchoes: currentEchoes.map((e, i) =>
                    i === activeSlot ? newEcho : e
                )
            }
        }));

        setMenuOpen(false);
    };

    useEffect(() => {
        const echoIconPaths = echoes.map(e => e?.icon).filter(Boolean);
        const setIconPaths = Object.values(setIconMap).filter(Boolean);
        const allPaths = [...new Set([...echoIconPaths, ...setIconPaths])];

        preloadImages(allPaths);
    }, []);

    const setCounts = getSetCounts(echoData);
    const setRequirements = new Map(
        echoSets.map(set => {
            const requiredCount = set.threePiece ? 3 : 2;
            return [set.id, requiredCount];
        })
    );

    const hasSetEffects = Object.entries(setCounts).some(([setId, count]) => {
        const numericId = Number(setId);
        const requiredCount = setRequirements.get(numericId) ?? 2; // fallback to 2 if unknown
        return count >= requiredCount;
    });
    const echoStatTotals = getEchoStatsFromEquippedEchoes(echoData);

    const critRate = echoStatTotals.critRate ?? 0;
    const critDmg = echoStatTotals.critDmg ?? 0;
    let critValue = critRate * 2 + critDmg;
    const maxScore = getTop5SubstatScoreDetails(charId).total;
    const buildScore = getEquippedEchoesScoreDetails(charId, characterRuntimeStates);
    const maxBuildScore = maxScore * 5;
    const percentScore = (buildScore.total / maxBuildScore) * 100
    const extendedTotals = {
        ...echoStatTotals,
        ...(critValue && { critValue }),
        ...(percentScore && { percentScore })
    };

    const echoesPaneRef = useRef(null);

    const [isNarrow, setIsNarrow] = useState(false);

    useEffect(() => {
        const observer = new ResizeObserver(entries => {
            for (let entry of entries) {
                const width = entry.contentRect.width;
                setIsNarrow(width < 500);
            }
        });

        if (echoesPaneRef.current) {
            observer.observe(echoesPaneRef.current);
        }

        return () => observer.disconnect();
    }, []);

    function saveAllEchoesToBag(equippedEchoes) {

        if (!Array.isArray(equippedEchoes) || equippedEchoes.length === 0) {
            setPopupMessage({
                message: 'You have no echoes equipped~! (゜。゜)',
                icon: '❤',
                color: { light: 'greed', dark: 'limegreen' },
            });
            setShowToast(true);
            return;
        }

        const validEchoes = equippedEchoes.filter(e => e);

        if (validEchoes.length === 0) {
            setPopupMessage({
                message: 'Those slots are emptier than your bag before~! ◑ . ◑',
                icon: '❤',
                color: { light: 'greed', dark: 'limegreen' },
            });
            setShowToast(true);
            return;
        }

        let addedCount = 0;
        let duplicateCount = 0;

        for (const echo of validEchoes) {
            const added = addEchoToBag(echo);
            if (added) duplicateCount++;
            else addedCount++;
        }

        if (duplicateCount === validEchoes.length) {
            setPopupMessage({
                message: 'They’re all in already~! ◑ . ◑',
                icon: '✔',
                color: { light: 'green', dark: 'limegreen' },
            });
        } else if (addedCount > 0 && duplicateCount > 0) {
            setPopupMessage({
                message: `Saved ${addedCount} new echo${addedCount > 1 ? 'es' : ''}, ${duplicateCount} duplicate${duplicateCount > 1 ? 's' : ''} ignored~! (〜^∇^)〜`,
                icon: '✔',
                color: { light: 'green', dark: 'limegreen' },
            });
        } else {
            setPopupMessage({
                message: `Added all ${addedCount} echoes to your bag~! (〜^∇^)〜`,
                icon: '✔',
                color: { light: 'green', dark: 'limegreen' },
            });
        }

        setShowToast(true);
    }

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

    function onEquipGenerated(echoes) {
        if (!echoes || !Array.isArray(echoes) || echoes.every(item => item === null)) return;
        if (deepCompareEchoArrays(characterRuntimeStates[charId].equippedEchoes, echoes)) {
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
                    equippedEchoes: echoes.map(e => (e ? { ...e } : null)),
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

    /*const tab = skillTabs[2];
    const level = allSkillLevels[tab][0];

    const entry= {
        label: level?.Name,
        detail: level?.Type ?? tab,
        tab
    };

    const skill = skillResults
        ?.find(skill => skill.name === level?.label) ?? {};

    useEffect(() => {
        (async () => {
            console.time("BestEchoSearch");
            const result = await findBestEchoSetFromArray(
                { characterRuntimeStates, charId, activeCharacter, entry, levelData: level },
                echoBag,
                100_000,
                0,
                baseCharacterState,
                mergedBuffs,
                echoData,
                skill.statWeight,
                Date.now(),
                true,
                null, 6000104
            );
            console.timeEnd("BestEchoSearch");
            console.log("Best Echo Set:", result);
            setCharacterRuntimeStates(prev => {
                const prevChar = prev[charId] ?? {};
                return {
                    ...prev,
                    [charId]: {
                        ...prevChar,
                        equippedEchoes: result?.best?.echoes?.map(e => (e ? { ...e } : null)) ?? [],
                    },
                };
            });
        })();
    }, []);

    console.log(
        getTopEchoesByStatWeight(
            echoBag,
            skill.statWeight,
        )
    )*/

    return (
        <div className="echoes-pane" ref={echoesPaneRef}>
            <EchoGenerator
                open={isGeneratorOpen}
                onClose={() => setIsGeneratorOpen(false)}
                echoData={echoData}
                charId={charId}
                getImageSrc={getImageSrc}
                characterRuntimeStates={characterRuntimeStates}
                allSkillLevels={allSkillLevels}
                skillResults={skillResults}
                activeCharacter={activeCharacter}
                baseCharacterState={baseCharacterState}
                mergedBuffs={mergedBuffs}
                onEquipGenerated={onEquipGenerated}
                setCharacterRuntimeStates={setCharacterRuntimeStates}
                setGuideClose={setGuideClose}
                setIsGeneratorOpen={setIsGeneratorOpen}
                openGuide={openGuide}
            />
            {bagOpen && (
                <EchoBagMenu
                    runtime={runtime}
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
                    onEquip={(echo, slotIndex) => {
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
                    }}
                />
            )}
            <EchoParser
                charId={charId}
                characterRuntimeStates={characterRuntimeStates}
                setCharacterRuntimeStates={setCharacterRuntimeStates}
                onEchoesParsed={(parsedList) => {
                    applyParsedEchoesToEquipped(parsedList, charId, setCharacterRuntimeStates);
                }}
                setConfirmMessage={setConfirmMessage}
                setShowConfirm={setShowConfirm}
                setShowToast={setShowToast}
                setPopupMessage={setPopupMessage}
                openGuide={openGuide}
                saveAllEchoesToBag={saveAllEchoesToBag}
                setGuideClose={setGuideClose}
                setIsGeneratorOpen={setIsGeneratorOpen}
            />
            <div className="echoes-header">
                <button
                    className="open-bag-button"
                    onClick={() => setBagOpen(true)}
                    style={{ position: 'absolute', top: '0.35rem', right: '0rem' }}
                >
                    <Backpack size={26} />
                </button>
            </div>
            {echoSlots.map((slotIndex) => {
                const echo = echoData[slotIndex];
                const isMain = slotIndex === 0;
                const cv = (echo?.subStats?.critRate ?? 0) * 2 + (echo?.subStats?.critDmg ?? 0);
                const score = (getEchoScores(charId, echo).totalScore / maxScore) * 100;
                return (
                    <React.Fragment key={slotIndex}>
                        <div key={slotIndex} className="inherent-skills-box echo">
                            <div className="damage-tooltip-wrapper echo-info"
                                 data-tooltip={`Hover over substat values to see their individual roll value`}>
                                <Info size={20} />
                            </div>
                            <div
                                className="echo-slot-content"
                                style={{ gridTemplateColumns: isNarrow ? 'unset' : '1fr 1fr' }}
                            >

                                <div className="echo-slot-left">
                                    <div className="echo-slot-icon-wrapper">
                                        {echo ? (
                                            <>
                                                <img
                                                    src={echo.icon}
                                                    alt={echo.name}
                                                    className="header-icon"
                                                    loading="lazy"
                                                    onClick={() => handleEchoIconClick(slotIndex)}
                                                    onLoad={(e) => {
                                                        if (e.currentTarget.classList.contains('fallback-icon')) {
                                                            e.currentTarget.classList.remove('fallback-icon');
                                                        }
                                                    }}
                                                    onError={(e) => {
                                                        e.currentTarget.onerror = null;
                                                        e.currentTarget.src = '/assets/echoes/default.webp';
                                                        e.currentTarget.classList.add('fallback-icon');
                                                    }}
                                                />
                                                <button
                                                    className="remove-teammate-button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemoveEcho(slotIndex);
                                                    }}
                                                    title="Remove Echo"
                                                >
                                                    <X size={14} strokeWidth={2.5} />
                                                </button>
                                            </>
                                        ) : (
                                            <div
                                                className="echo-slot-icon empty-slot"
                                                 onClick={() => handleEchoIconClick(slotIndex)}
                                            />
                                        )}
                                    </div>
                                    <div className="echo-slot-details">
                                        {echo ? (
                                            <>
                                                <div className="echo-slot-title">{echo.name}</div>
                                                <div className="echo-slot-cost-group">
                                                    <div className="echo-slot-cost-badge">Cost {echo.cost}</div>
                                                    {echo.selectedSet && (
                                                        <img
                                                            src={setIconMap[echo.selectedSet]}
                                                            alt={`Set ${echo.selectedSet}`}
                                                            className="echo-set-icon"
                                                            loading="lazy"
                                                        />
                                                    )}
                                                    {echo && (
                                                        <button
                                                            className="save-to-bag-button inline"
                                                            onClick={() => {
                                                                const freshEcho = characterRuntimeStates?.[charId]?.equippedEchoes?.[slotIndex];
                                                                if (freshEcho) {
                                                                    const added = addEchoToBag(freshEcho);

                                                                    if (added) {
                                                                        setPopupMessage({
                                                                            message: 'It\'s in already~! ◑ . ◑',
                                                                            icon: '✔',
                                                                            color: { light: 'green', dark: 'limegreen' },
                                                                        });
                                                                    } else {
                                                                        setPopupMessage({
                                                                            message: 'Added to your bag~! (〜^∇^)〜',
                                                                            icon: '✔',
                                                                            color: { light: 'green', dark: 'limegreen' },
                                                                        });
                                                                    }
                                                                    setShowToast(true);
                                                                }
                                                            }}
                                                            title="Save Echo to Bag"
                                                        >
                                                            <Save />
                                                        </button>
                                                    )}
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="echo-slot-title">
                                                    {isMain ? 'Main Echo Slot' : `Echo Slot ${slotIndex + 1}`}
                                                </div>
                                                <div className="echo-slot-desc">No Echo equipped</div>
                                            </>
                                        )}
                                        {isMain && echo?.rawDesc && echo?.rawParams?.[4] && (
                                            <button
                                                className="toggle-effect-button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowEffect(prev => !prev);
                                                }}
                                            >
                                                {showEffect ? "Hide Effect" : "Show Effect"}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="echo-details" onClick={() => echo && setSubstatModalSlot(slotIndex)}>
                                    {echo ? (
                                        <div className="echo-card">
                                            <div className="echo-card-section main">
                                                {Object.entries(echo.mainStats ?? {}).map(([key, val]) => {
                                                    const label = formatStatKey(key);
                                                    const iconUrl = statIconMap[label];

                                                    return (
                                                        <div key={key} className="stat-row">
                                                        <span className="echo-stat-label">
                                                            {iconUrl && (
                                                                <div
                                                                    className="stat-icon grid-stat-icon"
                                                                    style={{
                                                                        width: 18,
                                                                        height: 18,
                                                                        WebkitMaskImage: `url(${iconUrl})`,
                                                                        maskImage: `url(${iconUrl})`,
                                                                        display: 'inline-block',
                                                                        marginRight: '0.25rem',
                                                                        verticalAlign: 'middle',
                                                                        paddingRight: '0.25rem',
                                                                    }}
                                                                />
                                                            )}
                                                            {label}
                                                        </span>
                                                            <span className="echo-stat-value">
                                                            {key.endsWith('Flat') ? val : `${val.toFixed(1)}%`}
                                                        </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <div className="echo-card-section">
                                                {Object.entries(echo.subStats ?? {}).map(([key, val]) => {
                                                    const label = formatStatKey(key);
                                                    const iconUrl = statIconMap[label];
                                                    const rv = computeRollForStat(key, val);

                                                    return (
                                                        <div key={key} className="stat-row">
                                                            <span className="echo-stat-label">
                                                                {iconUrl && (
                                                                    <div
                                                                        className="stat-icon grid-stat-icon"
                                                                        style={{
                                                                            width: 18,
                                                                            height: 18,
                                                                            WebkitMaskImage: `url(${iconUrl})`,
                                                                            maskImage: `url(${iconUrl})`,
                                                                            display: 'inline-block',
                                                                            marginRight: '0.25rem',
                                                                            verticalAlign: 'middle',
                                                                            paddingRight: '0.25rem',
                                                                        }}
                                                                    />
                                                                )}
                                                                {label}
                                                            </span>
                                                            <span className="damage-tooltip-wrapper echo-stat-value" data-tooltip={`${rv.toFixed(1)}%`}>
                                                                {key.endsWith('Flat') ? val : `${val.toFixed(1)}%`}
                                                            </span>

                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-muted"></span>
                                    )}
                                </div>
                            </div>
                            <div className="cv-container-container">
                                <div className="cv-container overview-weapon-details echo-buff overview">
                                    Score — {score > 0 ? score.toFixed(1) : '??'}%
                                </div>
                                {cv > 0 && (
                                    <div className="cv-container overview-weapon-details echo-buff">
                                        CV — {cv.toFixed(1)}%
                                    </div>
                                )}
                                {/*{Object.entries(rv).map(([key, value]) => {
                                    const label = statLabelMap[key];
                                    const iconUrl = label && statIconMap[label];
                                    const isFlat = key.toLowerCase().includes('flat');
                                    return (
                                        <div key={key} className="rv-container overview-weapon-details echo-buff rv"
                                             style={{ gap: '0.3rem'}}
                                        >
                                            <span style={{display: 'flex', alignItems: 'center', flexDirection: 'row'}}>
                                                {iconUrl && (
                                                    <div className="cv-container-icon"
                                                         style={{
                                                             width: 18,
                                                             height: 18,
                                                             WebkitMaskImage: `url(${iconUrl})`,
                                                             maskImage: `url(${iconUrl})`,
                                                             WebkitMaskRepeat: 'no-repeat',
                                                             maskRepeat: 'no-repeat',
                                                             WebkitMaskSize: 'contain',
                                                             maskSize: 'contain'
                                                         }}
                                                    />
                                                )}{isFlat ? '' : '%'}
                                            </span>
                                            —
                                            <span>{value}%</span>
                                        </div>
                                    );
                                })}*/}
                            </div>
                        </div>

                        {isMain && echo?.rawDesc && echo?.rawParams?.[4] && (
                            <div
                                className={`main-echo-description-wrapper ${showEffect ? 'expanded' : 'collapsed'}`}
                            >
                                <div className="main-echo-description" >
                                    {highlightKeywordsInText(
                                        formatDescription(echo.rawDesc, echo.rawParams[4]),
                                        [echo.name]
                                    )}
                                    {isMain && echo?.id && mainEchoBuffs?.[echo.id] && (
                                        <div className="main-echo-toggle-controls">
                                            {mainEchoBuffs[echo.id].toggleable && (
                                                <label className="modern-checkbox echo">
                                                    <input
                                                        type="checkbox"
                                                        checked={!!activeStates.mainEchoToggle}
                                                        onChange={() => toggleState('mainEchoToggle')}
                                                    />
                                                    {mainEchoBuffs[echo.id].toggleable.label ?? 'Enable'}
                                                </label>
                                            )}

                                            {isMain && echo?.id && mainEchoBuffs?.[echo.id]?.stackable && (() => {
                                                const stackKey = mainEchoBuffs[echo.id]?.stackable?.key ?? 'mainEchoStack';
                                                const currentStackValue = activeStates?.[stackKey] ?? 0;

                                                const handleChange = (newValue) => {
                                                    setCharacterRuntimeStates(prev => ({
                                                        ...prev,
                                                        [charId]: {
                                                            ...(prev[charId] ?? {}),
                                                            activeStates: {
                                                                ...(prev[charId]?.activeStates ?? {}),
                                                                [stackKey]: newValue
                                                            }
                                                        }
                                                    }));
                                                };

                                                return (
                                                    <DropdownSelect
                                                        label=""
                                                        options={Array.from(
                                                            { length: (mainEchoBuffs[echo.id].stackable?.max ?? 3) + 1 },
                                                            (_, i) => (i)
                                                        )}
                                                        value={currentStackValue}
                                                        onChange={handleChange}
                                                        width="80px"
                                                    />
                                                );
                                            })()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </React.Fragment>
                );
            })}

            {hasSetEffects && (
                <div className="inherent-skills-box set">
                    <div className="echo-buffs set">
                        {Object.entries(setCounts).map(([setId, count]) => {
                            const numericId = Number(setId);
                            const setInfo = echoSets.find(set => set.id === numericId);
                            if (!setInfo || count < 2) return null;

                            const {
                                twoPiece: TwoPieceUI,
                                threePiece: ThreePieceUI,
                                fivePiece: FivePieceUI
                            } = getEchoSetUIOverrides(numericId);

                            return (
                                <div key={setId} className="echo-set-content">
                                    {count >= 2 && setInfo.twoPiece && (
                                        TwoPieceUI ? (
                                            <TwoPieceUI setInfo={setInfo} />
                                        ) : (
                                            <div className="echo-buff">
                                                <div className="echo-buff-header">
                                                    <img className="echo-buff-icon" src={setIconMap[setInfo.id]} alt={setInfo.name} loading="lazy" />
                                                    <div className="echo-buff-name">{setInfo.name} (2-piece)</div>
                                                </div>
                                                <div className="echo-buff-effect">
                                                    {highlightKeywordsInText(setInfo.twoPiece)}
                                                </div>
                                            </div>
                                        )
                                    )}

                                    {count >= 3 && setInfo.threePiece && (
                                        ThreePieceUI ? (
                                            <ThreePieceUI
                                                setInfo={setInfo}
                                                activeStates={activeStates}
                                                toggleState={toggleState}
                                                charId={charId}
                                                setCharacterRuntimeStates={setCharacterRuntimeStates}
                                            />
                                        ) : (
                                            <div className="echo-buff">
                                                <div className="echo-buff-header">
                                                    <img className="echo-buff-icon" src={setIconMap[setInfo.id]} alt={setInfo.name} loading="lazy" />
                                                    <div className="echo-buff-name">{setInfo.name} (3-piece)</div>
                                                </div>
                                                <div className="echo-buff-effect">
                                                    {highlightKeywordsInText(setInfo.threePiece)}
                                                </div>
                                            </div>
                                        )
                                    )}

                                    {count >= 5 && setInfo.fivePiece && (
                                        FivePieceUI ? (
                                            <FivePieceUI
                                                setInfo={setInfo}
                                                activeStates={activeStates}
                                                toggleState={toggleState}
                                                charId={charId}
                                                setCharacterRuntimeStates={setCharacterRuntimeStates}
                                            />
                                        ) : (
                                            <div className="echo-buff">
                                                <div className="echo-buff-header">
                                                    <img className="echo-buff-icon" src={setIconMap[setInfo.id]} alt={setInfo.name} loading="lazy" />
                                                    <div className="echo-buff-name">{setInfo.name} (5-piece)</div>
                                                </div>
                                                <div className="echo-buff-effect">
                                                    {highlightKeywordsInText(setInfo.fivePiece)}
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {Object.keys(extendedTotals).length > 0 && (
                <ExpandableSection title="Totals">
                    <div className="stats-grid">
                        {Object.entries(extendedTotals)
                            .sort(([a], [b]) => {
                                const indexA = statDisplayOrder.indexOf(a);
                                const indexB = statDisplayOrder.indexOf(b);
                                return (indexA === -1 ? Infinity : indexA) - (indexB === -1 ? Infinity : indexB);
                            })
                            .map(([key, val]) => {
                                const label = formatStatKey(key);
                                const iconUrl = statIconMap[label];

                                return (
                                    <div
                                        key={key}
                                        className="stat-row"
                                        style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between' }}
                                    >
                                          <span className="echo-stat-label">
                                              {iconUrl && (
                                                  <div
                                                      className="stat-icon"
                                                      style={{
                                                          width: 18,
                                                          height: 18,
                                                          backgroundColor: '#999',
                                                          WebkitMaskImage: `url(${iconUrl})`,
                                                          maskImage: `url(${iconUrl})`,
                                                          WebkitMaskRepeat: 'no-repeat',
                                                          maskRepeat: 'no-repeat',
                                                          WebkitMaskSize: 'contain',
                                                          maskSize: 'contain',
                                                          display: 'inline-block',
                                                          marginRight: '0.25rem',
                                                          verticalAlign: 'middle',
                                                          paddingRight: '0.25rem',
                                                      }}
                                                  />
                                              )}
                                              {key === 'critValue' || key === 'percentScore' ? (
                                                  <span className="highlight">{label}</span>
                                              ) : (
                                                  `${label}`
                                              )}
                                          </span>
                                        <div className="stat-total">
                                            {key === 'critValue' || key === 'percentScore' ? (
                                                <span className="highlight">{val.toFixed(1)}%</span>
                                            ) : key.endsWith('Flat') ? (
                                                val
                                            ) : (
                                                `${val.toFixed(1)}%`
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </ExpandableSection>
            )}

            <EchoMenu
                echoes={echoes}
                handleEchoSelect={handleEchoSelect}
                menuRef={menuRef}
                menuOpen={menuOpen}
                setMenuOpen={setMenuOpen}
            />

            {substatModalSlot !== null && echoData[substatModalSlot] && (
                <EditSubstatsModal
                    isOpen={true}
                    echo={echoData[substatModalSlot]}
                    mainStats={getValidMainStats(echoData[substatModalSlot]?.cost ?? 1)}
                    substats={echoData[substatModalSlot]?.subStats ?? {}}
                    sets={echoData[substatModalSlot]?.originalSets ?? []}
                    selectedSet={echoData[substatModalSlot]?.selectedSet ?? null}
                    slotIndex={substatModalSlot}
                    onClose={() => setSubstatModalSlot(null)}
                    onSave={(updatedEcho) => handleSubstatSave(updatedEcho)}
                    getValidMainStats={getValidMainStats}
                    applyFixedSecondMainStat={applyFixedSecondMainStat}
                />
            )}

            {showToast && popupMessage.message && (
                <NotificationToast
                    message={popupMessage.message}
                    icon={popupMessage.icon}
                    color={popupMessage.color}
                    onClose={() => setShowToast(false)}
                    position={'top'}
                    bold={true}
                    duration={3000}
                />
            )}

            <GuidesModal
                open={showGuide}
                category={guideCategory}
                onClose={() => {
                    setShowGuide(false);
                    onGuideClose?.();
                }}
            />

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

        </div>
    );
}

export function highlightKeywordsInText(text, extraKeywords = []) {
    if (typeof text !== 'string') return text;

    const elementKeywords = Object.keys(attributeColors);
    const staticKeywords = [...skillKeywords, ...statKeywords, ...elementKeywords];
    const allKeywords = [...staticKeywords, ...extraKeywords];

    const escapedKeywords = allKeywords.map(k =>
        k.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
    );

    const percentPattern = '\\d+(\\.\\d+)?%';
    const keywordPattern = escapedKeywords.length > 0 ? `\\b(${escapedKeywords.join('|')})\\b` : '';
    const allPattern = [percentPattern, keywordPattern].filter(Boolean).join('|');
    const regex = new RegExp(allPattern, 'gi');

    return (
        <span dangerouslySetInnerHTML={{
            __html: text.replace(regex, (match) => {
                const lower = match.toLowerCase();

                if (/^\d+(\.\d+)?%$/.test(match)) {
                    return `<strong class="highlight">${match}</strong>`;
                }

                if (skillKeywords.includes(match)) {
                    return `<strong class="highlight">${match}</strong>`;
                }

                if (statKeywords.includes(match)) {
                    return `<strong class="highlight">${match}</strong>`;
                }

                if (elementKeywords.includes(lower)) {
                    const color = attributeColors[lower];
                    return `<strong style="color: ${color}; font-weight: bold;">${match}</strong>`;
                }

                if (extraKeywords.includes(match)) {
                    return `<strong class="highlight echo-name">${match}</strong>`;
                }

                return match;
            })
        }} />
    );
}

export function getEquippedEchoesScoreDetails(charId, characterRuntimeStates) {
    const echoes = characterRuntimeStates?.[charId]?.equippedEchoes ?? [];
    const items = echoes.map((echo, idx) => {
        const result = getEchoScores(charId, echo);
        return {
            index: idx,
            echo,
            totalScore: result?.totalScore ?? 0
        };
    });
    const total = items.reduce((acc, it) => acc + it.totalScore, 0);
    return { total, items };
}

export function buildMultipleRandomEchoes(recipes = [], setId = null, mainEchoId = null) {
    if (!Array.isArray(echoes) || echoes.length === 0) {
        console.warn("⚠️ No echo templates available to build from.");
        return [];
    }

    const results = [];
    const usedIds = new Set();
    let mainEchoBuilt = null;

    const isMultiSet = Array.isArray(setId);
    const remaining = new Map();
    if (isMultiSet) {
        let total = 0;
        for (const s of setId) {
            const c = Math.max(0, Number(s.count ?? 0));
            if (c > 0) {
                remaining.set(s.setId, c);
                total += c;
            }
        }
        if (total <= 0 || total > 5) {
            console.warn("⚠️ Invalid multi-set configuration. Using random sets instead.");
            remaining.clear();
        }
    }

    function chooseBestSetForEcho(echo) {
        const sets = echo.sets ?? [];
        const candidates = sets.filter(sid => remaining.get(sid) > 0);

        if (candidates.length === 0) {
            return sets[0] ?? null;
        }

        candidates.sort((a, b) => (remaining.get(b) ?? 0) - (remaining.get(a) ?? 0));
        return candidates[0];
    }

    function pickEcho(candidates, cost) {
        if (candidates.length === 1) return structuredClone(candidates[0]);

        const scored = candidates.map(e => {
            const sets = e.sets ?? [];
            const coverage = sets.reduce((acc, sid) => acc + (remaining.get(sid) > 0 ? 1 : 0), 0);
            const quality = Number(e._score ?? 0.1);
            return { e, score: coverage * 10 + quality }; // coverage dominates
        });

        // Weighted random by score (favor higher coverage)
        const total = scored.reduce((a, b) => a + b.score, 0);
        let roll = Math.random() * total;
        for (const item of scored) {
            roll -= item.score;
            if (roll <= 0) return structuredClone(item.e);
        }
        return structuredClone(scored[scored.length - 1].e);
    }

    for (const recipe of recipes) {
        const { cost, mainStats = {}, subStats = {} } = recipe;

        let candidates = [];

        if (mainEchoId != null) {
            candidates = echoes.filter(
                e => e.cost === cost && e.id === String(mainEchoId) && !usedIds.has(e.id)
            );
        }

        if (candidates.length === 0 && remaining.size > 0) {
            const needSetIds = new Set([...remaining.keys()].filter(sid => remaining.get(sid) > 0));
            candidates = echoes.filter(
                e => e.cost === cost
                    && !usedIds.has(e.id)
                    && (e.sets ?? []).some(sid => needSetIds.has(sid))
            );
        }

        if (candidates.length === 0) {
            candidates = echoes.filter(
                e => e.cost === cost && !usedIds.has(e.id)
            );
        }

        if (candidates.length === 0) {
            console.warn(`⚠️ No unused echoes found for cost ${cost}.`);
            continue;
        }

        const base = pickEcho(candidates, cost);

        base.originalSets = base.sets ? [...base.sets] : [];
        let chosenSet = chooseBestSetForEcho(base);

        if (chosenSet != null && remaining.get(chosenSet) > 0) {
            remaining.set(chosenSet, remaining.get(chosenSet) - 1);
        }

        base.selectedSet = chosenSet;

        base.mainStats = structuredClone(mainStats);
        base.subStats  = structuredClone(subStats);

        base.uid = crypto.randomUUID?.() ?? Date.now().toString();
        base.generated = true;

        usedIds.add(base.id);
        results.push(base);

        if (mainEchoId && base.id === String(mainEchoId)) {
            mainEchoBuilt = base;
        }
    }

    if (mainEchoBuilt) {
        const idx = results.findIndex(e => e.id === String(mainEchoId));
        if (idx > 0) {
            const [main] = results.splice(idx, 1);
            results.unshift(main);
        }
    }

    return results;
}