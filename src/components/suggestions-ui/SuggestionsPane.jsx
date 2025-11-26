import React, {useEffect, useRef, useState} from 'react';
import NotificationToast from "../utils-ui/NotificationToast.jsx";
import GuidesModal from "../utils-ui/GuideModal.jsx";
import ConfirmationModal from "../utils-ui/ConfirmationModal.jsx";
import {echoSetMap, highlightKeywordsInText, setIconMap} from "../../constants/echoSetData.jsx";
import {formatStatKey, getEchoScores, getTop5SubstatScoreDetails} from "../../utils/echoHelper.js";
import {Tooltip} from "antd";
import {attributeColors, elementToAttribute, withOpacity} from "../../utils/attributeHelpers.js";
import SkillMenu, {tabDisplayOrder} from "../utils-ui/SkillMenu.jsx";
import {getGroupedSkillOptions} from "../../utils/prepareDamageData.js";
import {applyMainStatRecipesToEchoes} from "../../suggestions/mainStat-suggestion/utils.js";
import {getEquippedEchoesScoreDetails} from "../echoes-pane-ui/EchoesPane.jsx";
import {Wrench} from "lucide-react";
import {EchoGridPreview} from "../overview-ui/OverviewDetailPane.jsx";
import EchoMenu from "../echoes-pane-ui/EchoMenu.jsx";
import {echoes as allEchoes} from "../../json-data-scripts/getEchoes.js";
import {SonataSetPlanner} from "../echo-generator-ui/EchoGenerator.jsx";
import {applySetPlanToEchoes} from "../../suggestions/setPlain-suggestion/utils.js";

const SuggestionsWorker = new URL('../../workers/suggestionsWorker.js', import.meta.url);


function formatNumber(num) {
    if (num == null) return '-';
    if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + 'B';
    if (num >= 10_000_000) return (num / 1_000_000).toFixed(1) + 'M';
    if (num >= 100_000) return Math.round(num).toLocaleString();
    return Math.round(num).toLocaleString();
}

const pieces = {
    2: 'twoPiece',
    3: 'threePiece',
    5: 'fivePiece'
}

export default function SuggestionsPane({
                                            currentSliderColor,
                                            charId,
                                            setCharacterRuntimeStates,
                                            characterRuntimeStates,
                                            characters,
                                            activeCharacter,
                                            baseCharacterState,
                                            mergedBuffs,
                                            allSkillLevels,
                                            skillResults,
                                            getImageSrc,
                                            rarityMap,
                                            triggerRef,
                                            menuOpen,
                                            setMenuOpen,
                                            menuRef,
                                            suggestionsPaneSettings,
                                            setSuggestionsPaneSettings,
                                            keywords,
                                            finalStats
                                        }) {
    const runtime = characterRuntimeStates[charId] ?? {};
    const echoData = runtime?.equippedEchoes ?? [];
    const noEchoes =
        !echoData ||
        echoData.length === 0 ||
        echoData.every(e => e == null);

    const suggestionSettings = runtime?.suggestionSettings ?? {};
/*
    const suggestionSettings = runtime?.optimizerSettings ?? {};
*/
    const updateSuggestionsPersonalSettings = (patch) => {
        const charId = activeCharacter.Id ?? activeCharacter.id ?? activeCharacter.link;
        setCharacterRuntimeStates((prev) => {
            const prevChar = prev[charId] ?? {};
            return {
                ...prev,
                [charId]: {
                    ...prevChar,
                    suggestionSettings: {
                        ...(prevChar.suggestionSettings ?? {}),
                        ...patch,
                    },
                },
            };
        });
    };
    const updateSuggestionsPaneSettings = (patch) => {
        setSuggestionsPaneSettings((prev) => ({
            ...prev,
            ...patch,
        }));
    };

    const [showToast, setShowToast] = useState(false);
    const [popupMessage, setPopupMessage] = useState({
        icon: null,
        message: null,
        color: null
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

    const viewMode = suggestionsPaneSettings.viewMode ?? 'mainStats';
    const [showGuide, setShowGuide] = useState(false);
    const [guideCategory, setGuideCategory] = useState(null);

    const openGuide = React.useCallback((category) => {
        setGuideCategory(category);
        setShowGuide(true);
    }, []);

    const tab = suggestionSettings?.tab ?? "";
    const level = suggestionSettings?.level ?? null;
    const entry = {
        label: level?.Name,
        detail: level?.Type ?? tab,
        tab
    };
    const skill = skillResults
        ?.find(skill => skill.name === level?.label || skill.name === level?.Name) ?? {};
    const statWeight = skill.statWeight ?? skill.custSkillMeta?.statWeight ?? {};

    const workerRef = useRef(null);
    const workerTimersRef = useRef({
        mainStats: null,
        setPlans: null,
    });
    const [isRunning, setIsRunning] = useState(false);

    const [setSuggestions, setSetSuggestions] = useState(null);
    const [selectedPlanIndex, setSelectedPlanIndex] = useState(0);
    const [mainStatResults, setMainStatResults] = useState([]);
    const [selectedMainStatIndex, setSelectedMainStatIndex] = useState(0);
    const baseDamage = skill?.avg ?? 1;

    const [bestMainStatsPlan, setBestMainStatsPlan] = useState(mainStatResults[selectedMainStatIndex]);
    const [bestSetPlan, setBestSetPlan] = useState(setSuggestions?.results[selectedPlanIndex]);
    const [newEquipped, setNewEquipped] = useState(null)

    useEffect(() => {
        setBestMainStatsPlan(mainStatResults[selectedMainStatIndex]);
    }, [mainStatResults.length, selectedMainStatIndex])

    useEffect(() => {
        setBestSetPlan(setSuggestions?.results[selectedPlanIndex]);
    }, [setSuggestions?.results?.length, selectedPlanIndex])

    useEffect(() => {
        const worker = new Worker(SuggestionsWorker, { type: 'module' });
        workerRef.current = worker;

        worker.onmessage = (event) => {
            const { type, suggestions, error } = event.data;
            setIsRunning(false);

            if (error) {
                console.error('Suggestions worker error:', error);
                return;
            }

            if (type === 'setPlans') {
                setSetSuggestions(suggestions || null);
                setSelectedPlanIndex(0);
            } else if (type === 'mainStats') {
                setMainStatResults(suggestions || []);
                setSelectedMainStatIndex(0);
            }
        };

        return () => {
            const timers = workerTimersRef.current;
            Object.values(timers).forEach((id) => id && clearTimeout(id));
            worker.terminate();
        };
    }, []);

    function run(type = 'mainStats') {
        if (noEchoes) return;
        const worker = workerRef.current;
        if (!worker) return;
        setIsRunning(true);
        const timers = workerTimersRef.current;
        if (timers[type]) {
            clearTimeout(timers[type]);
        }

        const payload = {
            charId,
            activeCharacter,
            characterRuntimeStates,
            baseCharacterState,
            mergedBuffs,
            entry,
            levelData: level,
            equippedEchoes: echoData,
            statWeight,
            skillType: skill.skillType,
        };

        const delay = 400;
        const nonNullCount = echoData.reduce(
            (count, e) => (e != null ? count + 1 : count),
            0
        );

        timers[type] = setTimeout(() => {
            if (!workerRef.current) return;
            if (type === 'mainStats') {
                workerRef.current.postMessage({
                    type: 'mainStats',
                    payload,
                    options: { minSlots: nonNullCount, maxSlots: nonNullCount },
                });
            } else {
                workerRef.current.postMessage({
                    type: 'setPlans',
                    payload,
                    options: {},
                });
            }
        }, delay);
    }

    useEffect(() => {
        if (!activeCharacter || !level) return;
        run('mainStats');
        run('setPlans');
    }, [activeCharacter, level]);

    const getSetMeta = (setId) => echoSetMap?.[setId] ?? null;

    const [showSkillOptions, setShowSkillOptions] = useState(false);
    const [isClosingSkillMenu, setIsClosingSkillMenu] = useState(false);
    const [expandedTabs, setExpandedTabs] = useState(() =>
        Object.fromEntries(tabDisplayOrder.map((key) => [key, true]))
    );
    const toggleTab = (key) =>
        setExpandedTabs((prev) => ({...prev, [key]: !prev[key]}));

    const groupedSkillOptions = React.useMemo(() => {
        return getGroupedSkillOptions({ skillResults });
    }, [skillResults]);

    const handleAddSkill = (skill) => {
        const newTab = skill?.tab;
        updateSuggestionsPersonalSettings({ tab: newTab });

        const match = allSkillLevels?.[newTab]?.find(
            (l) => l?.label?.includes(skill?.name) || l?.Name?.includes(skill?.name)
        );
        if (match) updateSuggestionsPersonalSettings({ level: match });
        setShowSkillOptions(false);
    };

    const closeMenu = () => {
        setIsClosingSkillMenu(true);
        setTimeout(() => {
            setShowSkillOptions(false);
            setIsClosingSkillMenu(false);
        }, 200);
    };

    const [isMainStatsModalOpen, setIsMainStatsModalOpen] = useState(false);

    return (
        <div className="suggestions-pane">
            <SkillMenu
                open={showSkillOptions}
                isClosing={isClosingSkillMenu}
                closeMenu={closeMenu}
                groupedSkillOptions={groupedSkillOptions}
                expandedTabs={expandedTabs}
                toggleTab={toggleTab}
                handleAddSkill={handleAddSkill}
                onClickOut={(e) => {
                    e.stopPropagation();
                    setIsClosingSkillMenu(true);
                    setTimeout(() => {
                        setShowSkillOptions(false);
                        setIsClosingSkillMenu(false);
                    }, 200);
                }}
            />

            <div className="rotation-view-toggle">
                <button className={`view-toggle-button ${viewMode === 'mainStats' ? 'active' : ''}`}
                        onClick={() => updateSuggestionsPaneSettings({viewMode:'mainStats'})}>
                    Main Stats
                </button>
                <button className={`view-toggle-button ${viewMode === 'setPlans' ? 'active' : ''}`}
                        onClick={() => updateSuggestionsPaneSettings({viewMode:'setPlans'})}>
                    Sonata Sets
                </button>
                <div className="rotation-control-buttons"
                     style={{ marginLeft: 'auto', display: 'flex', gap: '1rem'}}>
                    <button onClick={() => openGuide('Suggestions')} className="btn-primary echoes">
                        See Guide
                    </button>
                </div>
            </div>

            {viewMode === 'mainStats' && (
                <>
                    <div style={{ display: 'flex', flexDirection: 'row' }}>
                        <h2 className="panel-title">Suggested Main Stats</h2>
                    </div>

                    <div className={`main-stats suggestions-list ${isRunning ? 'running' : ''}`}>
                        <div className="main-stats suggestions-controls buffs-box">
                            <div className="toggle custom-select small"
                                 onClick={() => setShowSkillOptions(true)}
                            >{skill?.name ? skill?.name : "Target Skill"}</div>
                            <button
                                className="rotation-button"
                                onClick={() => {
                                    setNewEquipped(applyMainStatRecipesToEchoes(
                                        bestMainStatsPlan?.echoes,
                                        echoData,
                                    ));
                                    setIsMainStatsModalOpen(true);
                                }}
                            >
                                Inspect
                            </button>
                            <button
                                className="rotation-button clear"
                                onClick={() => setSelectedMainStatIndex(0)}
                            >
                                Reset Selection
                            </button>
                        </div>
                        {/*{isRunning && (
                            <div className="fancy-loader-container loader-wrapper">
                                <div
                                    className="fancy-loader"
                                    style={{ borderTopColor: currentSliderColor ?? "#66ccff" }}
                                ></div>
                            </div>
                        )}*/}
                        {noEchoes ? (
                            <span className="empty-state">
                                No main stat suggestions yet. Make sure you have echoes equipped!
                            </span>
                        ) : (
                            <>
                                {mainStatResults.map((plan, index) => {
                                    const isSelected = index === selectedMainStatIndex;
                                    const avg = plan.damage ?? null;
                                    let diffPercent = baseDamage
                                        ? ((avg / baseDamage) - 1) * 100
                                        : 0;

                                    diffPercent = Number((diffPercent).toFixed(2));

                                    const costSignature = (plan.echoes ?? [])
                                        .map(e => e.cost)
                                        .filter(c => c != null)
                                        .sort((a, b) => b - a)
                                        .join(' • ');

                                    const sortedEchoes = (plan.echoes ?? [])
                                        .slice()
                                        .sort((a, b) => (b.cost ?? 0) - (a.cost ?? 0));

                                    return (
                                        <div
                                            key={index}
                                            className={`main-stat-card rotation-item ${
                                                isSelected ? 'selected' : ''
                                            }`}
                                            style={{
                                                '--slider-color': currentSliderColor,
                                                '--lower-opac': withOpacity(currentSliderColor)
                                            }}
                                            onClick={() => setSelectedMainStatIndex(index)}
                                        >
                                            <div className="main-stat-rows">
                                                <div className="main-stat-header">
                                                    <div className="main-stat-title-row">
                                                        <span className="main-stat-rank">#{index + 1}</span>
                                                        <div className="main-stat-details-container">
                                                            <div className="cost-signature">
                                                                {costSignature}
                                                            </div>
                                                            <div className="main-stat-details">
                                                                <div
                                                                    className="set-plan-damage-container"
                                                                    style={{ marginLeft: 'unset' }}
                                                                >
                                                        <span className="set-plan-damage-main avg">
                                                            {formatNumber(avg)} dmg
                                                        </span>
                                                                </div>

                                                                {baseDamage && (
                                                                    <span className="main-stat-row-echo">
                                                                <span
                                                                    className={
                                                                        'echo-buff set-plan-damage-diff ' +
                                                                        (diffPercent !== 0 ? diffPercent >= 0 ? 'positive' : 'negative' : 'zero')
                                                                    }
                                                                >
                                                                    {diffPercent !== 0 ? `${(Math.abs(diffPercent).toFixed(2))}%` : 'Current'}
                                                                    {diffPercent !== 0 ? diffPercent > 0 ? '⬆' : '⬇' : ''}
                                                                </span>
                                                            </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                {sortedEchoes?.map((echo, slotIndex) => {
                                                    const mainStats = echo.mainStats || {};
                                                    const entries = Object.entries(mainStats);

                                                    return (
                                                        <div
                                                            key={slotIndex}
                                                            className="echo-buff main-stat-row"
                                                        >
                                                            <div className="main-stat-row-left">
                                                        <span className="main-stat-row-slot">
                                                            Cost {echo.cost}
                                                        </span>
                                                            </div>

                                                            <div className="main-stat-row-pills">
                                                                {entries.map(([key, value]) => (
                                                                    <span
                                                                        key={key}
                                                                        className="echo-buff main-stat-pill"
                                                                    >
                                                                <span className="main-stat-pill-stat">
                                                                    {formatStatKey(key)}:
                                                                </span>
                                                                <span className="main-stat-pill-value highlight">
                                                                    {value}
                                                                </span>
                                                            </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </>
                        )}

                    </div>
                </>
            )}

            {viewMode === 'setPlans' && (
                <>
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                        <h2 className="panel-title">Suggested Sonata Sets</h2>
                    </div>

                    <div className={`set-plan suggestions-list ${isRunning ? 'running' : ''}`}>
                        <div className="set-plan suggestions-controls buffs-box">
                            <div className="toggle custom-select small"
                                 onClick={() => setShowSkillOptions(true)}
                            >{skill?.name ? skill?.name : "Target Skill"}</div>
                            <button
                                className="rotation-button"
                                onClick={() => {
                                    setNewEquipped(applySetPlanToEchoes(
                                        bestSetPlan.setPlan,
                                        echoData,
                                    ));
                                    setIsMainStatsModalOpen(true);
                                }}
                            >
                                Inspect
                            </button>
                            <button
                                className="rotation-button clear"
                                onClick={() => setSelectedPlanIndex(0)}
                            >
                                Reset Selection
                            </button>
                        </div>

{/*
                        {isRunning && (
                            <div className="fancy-loader-container loader-wrapper">
                                <div
                                    className="fancy-loader"
                                    style={{ borderTopColor: currentSliderColor ?? "#66ccff" }}
                                ></div>
                            </div>
                        )}
*/}
                        {noEchoes || !setSuggestions?.results || setSuggestions?.results?.length === 0 ? (
                            <span className="empty-state">
                                No set plans yet. Make sure you have enough echoes equipped!
                            </span>
                        ) : (
                            setSuggestions?.results?.map((plan, index) => {
                                const avg = plan.avgDamage ?? null;
                                let diffPercent = baseDamage
                                    ? ((avg / baseDamage) - 1) * 100
                                    : 0;
                                diffPercent = Number((diffPercent).toFixed(2));
                                const isSelected = index === selectedPlanIndex;

                                return (
                                    <button
                                        key={index}
                                        type="button"
                                        className={`set-plan-card rotation-item ${isSelected ? 'selected' : ''}`}
                                        onClick={() => setSelectedPlanIndex(index)}
                                        style={{
                                            '--slider-color': currentSliderColor,
                                            '--lower-opac': withOpacity(currentSliderColor)
                                        }}
                                    >
                                        <div className="set-plan-header">
                                            <div className="set-plan-title-row">
                                                <span className="set-plan-rank">
                                                    #{index + 1}
                                                </span>

                                                <div className="set-plan-sets">
                                                    {plan.setPlan?.map((s, i) => {
                                                        const meta = getSetMeta(s.setId);
                                                        const iconSrc = setIconMap[s.setId];
                                                        const setName = meta?.name ?? `Set #${s.setId}`;
                                                        let effect = `${s.pieces}pc: ` + meta[pieces[s.pieces]];
                                                        if (s.pieces === 5) {
                                                            effect =
                                                                `2pc: ` + meta[pieces[2]] + '\n' +
                                                                `5pc: ` + meta[pieces[5]];
                                                        }
                                                        return (
                                                            <Tooltip
                                                                key={`${s.setId}-${s.pieces}-${i}`}
                                                                title={highlightKeywordsInText(effect, keywords)}
                                                                placement="top"
                                                                mouseEnterDelay={1}
                                                            >
                                                                <span className="echo-buff set-badge">
                                                                    {iconSrc && (
                                                                        <img
                                                                            src={iconSrc}
                                                                            alt={setName}
                                                                            className="set-icon"
                                                                        />
                                                                    )}
                                                                    {s.pieces}pc {setName}
                                                                </span>
                                                            </Tooltip>
                                                        );
                                                    })}
                                                </div>

                                                <div className="set-plan-damage-container">
                                                    <span className="set-plan-damage-main avg">
                                                        avg: {formatNumber(avg)}
                                                    </span>
                                                    {baseDamage && (
                                                        <span
                                                            className={
                                                                'echo-buff set-plan-damage-diff ' +
                                                                (diffPercent !== 0 ? diffPercent > 0 ? 'positive' : 'negative' : 'zero')
                                                            }
                                                        >
                                                            {diffPercent !== 0 ? `${(Math.abs(diffPercent).toFixed(2))}%` : 'Current'}
                                                            {diffPercent !== 0 ? diffPercent > 0 ? '⬆' : '⬇' : ''}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </>
            )}

            {showToast && popupMessage.message && (
                <NotificationToast
                    message={popupMessage.message}
                    icon={popupMessage.icon}
                    color={popupMessage.color}
                    duration={popupMessage.duration ?? 4000}
                    prompt={popupMessage.prompt ?? null}
                    onClose={
                        popupMessage.onClose
                            ? popupMessage.onClose
                            : () => setTimeout(() => setShowToast(false), 300)
                    }
                    position="top"
                    bold
                />
            )}

            <GuidesModal
                open={showGuide}
                category={guideCategory}
                onClose={() => setShowGuide(false)}
            />

            <SuggestionsModal
                open={isMainStatsModalOpen}
                onClose={() => setIsMainStatsModalOpen(false)}
                echoData={newEquipped}
                charId={charId}
                getImageSrc={getImageSrc}
                characterRuntimeStates={characterRuntimeStates}
                allSkillLevels={allSkillLevels}
                skillResults={skillResults}
                activeCharacter={activeCharacter}
                baseCharacterState={baseCharacterState}
                mergedBuffs={mergedBuffs}
                onEquipGenerated={() => {}}
                setCharacterRuntimeStates={setCharacterRuntimeStates}
                setIsGeneratorOpen={setIsMainStatsModalOpen}
                rerun={() => run(viewMode)}
                viewMode={viewMode}
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
                    currentSliderColor={currentSliderColor}
                />
            )}
        </div>
    );
}

export function SuggestionsModal({
                                  open,
                                  onClose,
                                  echoData,
                                  charId,
                                  getImageSrc,
                                  characterRuntimeStates,
                                  setCharacterRuntimeStates,
                                  rerun,
                                  onEquipGenerated,
                              }) {
    const [isClosing, setIsClosing] = useState(false);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsClosing(false);
            onClose?.();
        }, 300);
    };

    const maxScore = getTop5SubstatScoreDetails(charId).total;


    if (!open) return null;

    return (
        <div
            className={`skills-modal-overlay ${isClosing ? "closing" : ""}`}
            onClick={(e) => {
                e.stopPropagation();
                handleClose();
            }}
        >
            <div
                className={`skills-modal-content preset-preview changelog-modal guides modal-main-content echo-preview-view ${isClosing ? 'closing' : ''}`}
                onClick={(e) => e.stopPropagation()}
                style={{gap: "unset"}}
            >
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                    <h3 >Apply Selected</h3>
                    <div
                        style={{ marginLeft: 'auto', marginBottom: 'unset', display: 'flex', flexDirection: 'row', gap: '0.75rem' }}
                    >
                        <button
                            className="btn-primary echoes"
                            onClick={() => {
                                setCharacterRuntimeStates(prev => ({
                                    ...prev,
                                    [charId]: {
                                        ...(prev[charId] ?? {}),
                                        equippedEchoes: echoData,
                                    },
                                }));
                                handleClose();
                            }}
                        >
                            Apply
                        </button>
                    </div>
                </div>
                <div
                    className="echo-grid main-echo-description guides"
                >
                    {[...Array(5)].map((_, index) => {
                        const echo = echoData[index] ?? null;
                        const score = echo
                            ? (getEchoScores(charId, echo).totalScore / maxScore) * 100
                            : 0;

                        return (
                            <div
                                key={index}
                                className="echo-tile overview inherent-skills-box echo-parser-preview"
                                style={{ margin: 'unset' }}
                            >
                                <EchoGridPreview
                                    echo={echo}
                                    getImageSrc={getImageSrc}
                                    score={score}
                                    setIconMap={setIconMap}
                                    className={'echo-parser-preview preset-preview'}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}