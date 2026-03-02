import React, {useEffect, useRef, useState} from 'react';
import EchoMenu from './EchoMenu.jsx';
import EditSubstatsModal from './EchoEditModal.jsx';
import {skillKeywords, statKeywords} from "@shared/constants/echoSetData.jsx";
import {echoSetById, echoSetList, setIconMap} from "@shared/constants/echoSetData2.js";
import {getEchoSetUIOverrides} from "@/data/echoes/sets/ui/index.js";
import {echoes} from '@/data/runtime/getEchoes.js';
import {attributeColors} from "@shared/utils/attributeHelpers.js";
import {Info, Save, X} from "lucide-react";
import {mainEchoBuffs} from "@/data/buffs/setEffect.js";
import DropdownSelect from "@/shared/ui/common/DropdownSelect.jsx";
import {addEchoToBag, getEchoBag, subscribeEchoBag,} from '@shared/state/echoBagStore.js';
import ExpandableSection from "@/shared/ui/common/Expandable.jsx";
import EchoParser from "./EchoParser.jsx";
import {applyParsedEchoesToEquipped} from "@shared/utils/buildEchoObjectsFromParsedResults.js";
import {
    applyFixedSecondMainStat,
    computeRollForStat,
    formatDescription,
    formatStatKey,
    getEchoScores,
    getEchoStatsFromEquippedEchoes,
    getSetCounts,
    getTop5SubstatScoreDetails,
    getValidMainStats,
    statDisplayOrder,
    statIconMap
} from "@shared/utils/echoHelper.js";
import {preloadImages} from "@/features/calculator/runtime/visualResourceStore.js";
import NotificationToast from "@/shared/ui/common/NotificationToast.jsx";
import GuidesModal from "@/shared/ui/common/GuideModal.jsx";
import ConfirmationModal from "@/shared/ui/common/ConfirmationModal.jsx";

export default function EchoesPane({
                                       charId,
                                       setCharacterRuntimeStates,
                                       characterRuntimeStates,
                                       echoMeta
                                   }) {
    const runtime = characterRuntimeStates[charId];
    const [showToast, setShowToast] = useState(false);
    const [popupMessage, setPopupMessage] = useState({
        icon: null,
        message: null,
        color: {},
        duration: null,
        prompt: {}
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

    const echoSlots = [0, 1, 2, 3, 4];
    const [menuOpen, setMenuOpen] = useState(false);
    const [activeSlot, setActiveSlot] = useState(null);
    const [substatModalSlot, setSubstatModalSlot] = useState(null);
    const menuRef = useRef(null);
    const echoData = runtime?.equippedEchoes ?? [null, null, null, null, null];
    const [showEffect, setShowEffect] = useState(false);

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
    const [echoBag, setEchoBag] = useState(getEchoBag());

    useEffect(() => {
        return subscribeEchoBag(setEchoBag);
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

    const setCounts = echoMeta?.setCounts ?? getSetCounts(echoData);
    const setRequirements = echoMeta?.setRequirements ?? new Map(
        echoSetList.map(set => {
            const requiredCount = set.threePiece ? 3 : 2;
            return [set.id, requiredCount];
        })
    );

    const hasSetEffects = typeof echoMeta?.hasSetEffects === 'boolean'
        ? echoMeta.hasSetEffects
        : Object.entries(setCounts).some(([setId, count]) => {
            const numericId = Number(setId);
            const requiredCount = setRequirements.get(numericId) ?? 2;
            return count >= requiredCount;
        });

    const echoStatTotals = echoMeta?.echoStatTotals ?? getEchoStatsFromEquippedEchoes(echoData);
    const maxScore = echoMeta?.maxScore ?? getTop5SubstatScoreDetails(charId).total;
    const perEchoScores = echoMeta?.perEchoScores ?? [];

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

    return (
        <div className="echoes-pane" ref={echoesPaneRef}>
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
            />
            {echoSlots.map((slotIndex) => {
                const echo = echoData[slotIndex];
                const isMain = slotIndex === 0;
                const cv = (echo?.subStats?.critRate ?? 0) * 2 + (echo?.subStats?.critDmg ?? 0);
                const echoScore = perEchoScores?.[slotIndex]?.score ?? getEchoScores(charId, echo).totalScore ?? 0;
                const score = maxScore ? (echoScore / maxScore) * 100 : 0;
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
                                                    const rvLabel = rv != null ? `${rv.toFixed(1)}%` : 'N/A';

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
                                                            <span className="damage-tooltip-wrapper echo-stat-value" data-tooltip={rvLabel}>
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

                                                const msg = (
                                                    <>
                                                        <span style={{ marginTop: '8px', fontSize: '1.25rem', color: 'gray' }}>
                                                            (It needs it's twin bro)
                                                        </span>
                                                    </>
                                                )

                                                if (echo.id === '6000179' && !activeStates?.nebulousCannon) return msg;
                                                if (echo.id === '6000180' && !activeStates?.collapsarBlade) return msg;

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
                            const setInfo = echoSetById?.[numericId];
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

            <EchoTotals
                echoStats={echoStatTotals}
                charId={charId}
                characterRuntimeStates={characterRuntimeStates}
            />

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
                    prompt={popupMessage.prompt}

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

function EchoTotals({ echoStats, charId, characterRuntimeStates }) {
    if (!echoStats) return null;

    // ---- flatten unified echo stats for display ----
    const displayTotals = {};

    // main stats
    displayTotals.atkFlat    = echoStats.atk?.flat ?? 0;
    displayTotals.atkPercent = echoStats.atk?.percent ?? 0;

    displayTotals.hpFlat     = echoStats.hp?.flat ?? 0;
    displayTotals.hpPercent  = echoStats.hp?.percent ?? 0;

    displayTotals.defFlat    = echoStats.def?.flat ?? 0;
    displayTotals.defPercent = echoStats.def?.percent ?? 0;

    // scalar stats
    displayTotals.energyRegen  = echoStats.energyRegen ?? 0;
    displayTotals.critRate     = echoStats.critRate ?? 0;
    displayTotals.critDmg      = echoStats.critDmg ?? 0;
    displayTotals.healingBonus = echoStats.healingBonus ?? 0;
    displayTotals.shieldBonus  = echoStats.shieldBonus ?? 0;

    // element dmg bonuses from attribute buckets
    const attr = echoStats.attribute ?? {};
    const elementKeys = ['aero', 'glacio', 'spectro', 'fusion', 'electro', 'havoc', 'physical'];

    for (const el of elementKeys) {
        const bucket = attr[el];
        if (!bucket) continue;
        const val = bucket.dmgBonus ?? 0;
        if (val) {
            displayTotals[el] = (displayTotals[el] ?? 0) + val;
        }
    }

    // skill-type dmg bonuses from skillType buckets
    const st = echoStats.skillType ?? {};
    const skillTypeToDisplayKey = {
        basicAtk: 'basicAtk',
        heavyAtk: 'heavyAtk',
        resonanceSkill: 'resonanceSkill',
        resonanceLiberation: 'resonanceLiberation',
    };

    for (const [typeKey, bucket] of Object.entries(st)) {
        const dk = skillTypeToDisplayKey[typeKey];
        if (!dk || !bucket) continue;
        const val = bucket.dmgBonus ?? 0;
        if (!val) continue;
        displayTotals[dk] = (displayTotals[dk] ?? 0) + val;
    }

    // strip pure-zero entries so UI isn't spammy
    const cleanedTotals = Object.fromEntries(
        Object.entries(displayTotals).filter(([, v]) => v !== 0)
    );

    // ---- crit value & build score ----
    const critRate = cleanedTotals.critRate ?? 0;
    const critDmg  = cleanedTotals.critDmg ?? 0;
    const critValue = (critRate || critDmg) ? critRate * 2 + critDmg : 0;

    const maxScore = getTop5SubstatScoreDetails(charId).total;
    const buildScore = getEquippedEchoesScoreDetails(charId, characterRuntimeStates);
    const maxBuildScore = maxScore * 5 || 0;
    const percentScore =
        maxBuildScore > 0 ? (buildScore.total / maxBuildScore) * 100 : 0;

    const extendedTotals = {
        ...cleanedTotals,
        ...(critValue ? { critValue } : {}),
        ...(percentScore ? { percentScore } : {})
    };

    if (Object.keys(extendedTotals).length === 0) return null;

    return (
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

                        const isHighlight = key === 'critValue' || key === 'percentScore';
                        const isFlat = key.endsWith('Flat');

                        let displayValue;
                        if (isHighlight) {
                            displayValue = `${val.toFixed(1)}%`;
                        } else if (isFlat) {
                            displayValue = Math.round(val);
                        } else {
                            displayValue = `${val.toFixed(1)}%`;
                        }

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
                                    {isHighlight ? (
                                        <span className="highlight">{label}</span>
                                    ) : (
                                        label
                                    )}
                                </span>
                                <div className="stat-total">
                                    {isHighlight ? (
                                        <span className="highlight">{displayValue}</span>
                                    ) : (
                                        displayValue
                                    )}
                                </div>
                            </div>
                        );
                    })}
            </div>
        </ExpandableSection>
    );
}
