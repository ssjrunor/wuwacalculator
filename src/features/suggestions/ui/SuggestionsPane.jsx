import React, {useEffect, useState} from 'react';
import NotificationToast from "@/components/common/NotificationToast.jsx";
import GuidesModal from "@/components/common/GuideModal.jsx";
import ConfirmationModal from "@/components/common/ConfirmationModal.jsx";
import {getEchoScores, getTop5SubstatScoreDetails} from "@/utils/echoHelper.js";
import SkillMenu, {tabDisplayOrder} from "@/features/rotations/ui/SkillMenu.jsx";
import {getGroupedSkillOptions} from "@/utils/prepareDamageData.js";
import {applyMainStatRecipesToEchoes} from "@/features/suggestions/core/mainStat-suggestion/utils.js";
import {EchoGridPreview} from "@/features/overview/ui/OverviewDetailPane.jsx";
import {applySetPlanToEchoes} from "@/features/suggestions/core/setPlan-suggestion/utils.js";
import {runMainStatSuggestor} from "@/features/suggestions/core/mainStat-suggestion/suggestMainStat.js";
import {runSetSuggestor} from "@/features/suggestions/core/setPlan-suggestion/suggestSetPlan.js";
import {getSetPlanFromEchoes} from "@/data/buffs/setEffect.js";
import {setIconMap} from "@/constants/echoSetData2.js";
import MainStatsView from "./MainStatsView.jsx";
import SetPlansView from "./SetPlansView.jsx";
import RandomView from "./RandomView.jsx";
import {runEchoGenerator} from "@/features/suggestions/core/randomEchoes/compute.js";

export default function SuggestionsPane({
                                            currentSliderColor,
                                            charId,
                                            setCharacterRuntimeStates,
                                            characterRuntimeStates,
                                            activeCharacter,
                                            baseCharacterState,
                                            mergedBuffs,
                                            allSkillLevels,
                                            skillResults,
                                            getImageSrc,
                                            suggestionsPaneSettings,
                                            setSuggestionsPaneSettings,
                                            keywords,
                                        }) {
    const runtime = characterRuntimeStates[charId] ?? {};
    const echoData = runtime?.equippedEchoes ?? [];
    const noEchoes =
        !echoData ||
        echoData.length === 0 ||
        echoData.every(e => e == null);

    const suggestionSettings = runtime?.suggestionSettings ?? {};
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
    const updateRandGenSettings = (patch) => {
        if (!activeCharacter) return;
        const activeId = activeCharacter.Id ?? activeCharacter.id ?? activeCharacter.link;
        setCharacterRuntimeStates((prev) => {
            const prevChar = prev[activeId] ?? {};
            return {
                ...prev,
                [activeId]: {
                    ...prevChar,
                    randGenSettings: {
                        ...(prevChar.randGenSettings ?? {}),
                        ...patch,
                    },
                },
            };
        });
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

    const guides = ['Suggestions', 'Random Echoes'];

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
        ?.find(skill => (skill.name === level?.label || skill.name === level?.Name) && skill.tab === tab) ?? {};
    const statWeight = skill.statWeight ?? skill.custSkillMeta?.statWeight ?? {};

    const [isRunning, setIsRunning] = useState(false);

    const [setSuggestions, setSetSuggestions] = useState(null);
    const [selectedPlanIndex, setSelectedPlanIndex] = useState(0);
    const [randomResults, setRandomResults] = useState([]);
    const [randomResultsIndex, setRandomResultsIndex] = useState(0);
    const [mainStatResults, setMainStatResults] = useState([]);
    const [selectedMainStatIndex, setSelectedMainStatIndex] = useState(0);
    const baseDamage = skill?.avg ?? 1;

    const [newEquipped, setNewEquipped] = useState(null)
    const bestMainStatsPlan = mainStatResults[selectedMainStatIndex];
    const bestSetPlan = setSuggestions?.results?.[selectedPlanIndex];


    function run(type = 'mainStats') {
        if (noEchoes) return;
        if (!skill) return;

        // Same payload you were sending to the worker
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
            sequence: runtime?.SkillLevels.sequence
        };

        const nonNullCount = echoData.reduce(
            (count, e) => (e != null ? count + 1 : count),
            0
        );

        const optionsMain = { minSlots: nonNullCount, maxSlots: nonNullCount };
        const optionsSet  = {};

        setIsRunning(true);
        try {
            if (type === 'mainStats') {
                const suggestions = runMainStatSuggestor(payload, optionsMain) || [];
                setMainStatResults(suggestions);
                setSelectedMainStatIndex(0);
            } else if (type === 'setPlans') {
                const suggestions = runSetSuggestor(payload, optionsSet) || null;
                setSetSuggestions(suggestions);
                setSelectedPlanIndex(0);
            }
        } catch (err) {
            console.error('[SuggestionsPane] non-worker suggestor error:', err);
        } finally {
            setIsRunning(false);
        }
    }

    const randGen = characterRuntimeStates?.[charId]?.randGenSettings;

    async function runRandomizer() {
        const form = {
            charId,
            activeCharacter,
            characterRuntimeStates,
            baseCharacterState,
            mergedBuffs,
            entry,
            levelData: level,
            equippedEchoes: echoData,
            statWeight,
            resultsLimit: 8,
            baseDmg: skill?.avg ?? 1,
            skillType: skill.skillType,
            lockedEchoId: null
        }

        const result = await runEchoGenerator({
            form,
            bias: randGen.bias,
            mainEcho: randGen.mainEcho ?? null,
            rollQuality: randGen.rollQuality,
            targetEnergyRegen: randGen.targetEnergyRegen,
            setId: randGen.setId ?? null,
        })

        setRandomResults(result?.results ?? []);
    }

    useEffect(() => {
        if (!activeCharacter || !level) return;
        run('mainStats');
        run('setPlans');
    }, [activeCharacter, level, echoData]);

    useEffect(() => {
        if (!activeCharacter || !level) return;
        runRandomizer();
    }, [activeCharacter, level]);


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

    const setData = getSetPlanFromEchoes(echoData);
    const handleInspectMainStats = () => {
        setNewEquipped(applyMainStatRecipesToEchoes(
            bestMainStatsPlan?.echoes,
            echoData,
        ));
        setIsMainStatsModalOpen(true);
    };
    const handleInspectSetPlans = () => {
        setNewEquipped(applySetPlanToEchoes(
            bestSetPlan?.setPlan,
            echoData,
        ));
        setIsMainStatsModalOpen(true);
    };

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
                <button className={`view-toggle-button ${viewMode === 'random' ? 'active' : ''}`}
                        onClick={() => updateSuggestionsPaneSettings({viewMode:'random'})}>
                    Random Echoes
                </button>
                <div className="rotation-control-buttons"
                     style={{ marginLeft: 'auto', display: 'flex', gap: '1rem'}}>
                    <button onClick={() => openGuide(guides)} className="btn-primary echoes">
                        See Guide
                    </button>
                </div>
            </div>

            {viewMode === 'mainStats' && (
                <MainStatsView
                    currentSliderColor={currentSliderColor}
                    isRunning={isRunning}
                    noEchoes={noEchoes}
                    skillName={skill?.name}
                    baseDamage={baseDamage}
                    mainStatResults={mainStatResults}
                    selectedMainStatIndex={selectedMainStatIndex}
                    onSelectMainStat={setSelectedMainStatIndex}
                    onOpenSkillMenu={() => setShowSkillOptions(true)}
                    onInspect={handleInspectMainStats}
                    onResetSelection={() => setSelectedMainStatIndex(0)}
                    echoData={echoData}
                />
            )}

            {viewMode === 'setPlans' && (
                <SetPlansView
                    currentSliderColor={currentSliderColor}
                    isRunning={isRunning}
                    noEchoes={noEchoes}
                    skillName={skill?.name}
                    baseDamage={baseDamage}
                    setSuggestions={setSuggestions}
                    selectedPlanIndex={selectedPlanIndex}
                    onSelectPlan={setSelectedPlanIndex}
                    onOpenSkillMenu={() => setShowSkillOptions(true)}
                    onInspect={handleInspectSetPlans}
                    onResetSelection={() => setSelectedPlanIndex(0)}
                    keywords={keywords}
                    setData={setData}
                />
            )}
            {viewMode === 'random' && (
                <RandomView
                    currentSliderColor={currentSliderColor}
                    randomResults={randomResults}
                    isRunning={isRunning}
                    skillName={skill?.name}
                    baseDamage={baseDamage}
                    randomResultsIndex={randomResultsIndex}
                    onSelectRandBuild={setRandomResultsIndex}
                    onOpenSkillMenu={() => setShowSkillOptions(true)}
                    onResetSelection={() => setRandomResultsIndex(0)}
                    echoData={echoData}
                    randGen={randGen}
                    updateRandGenSettings={updateRandGenSettings}
                    charId={charId}
                    getImageSrc={getImageSrc}
                    setCharacterRuntimeStates={setCharacterRuntimeStates}
                    characterRuntimeStates={characterRuntimeStates}
                    runRandomizer={runRandomizer}
                />
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
                setCharacterRuntimeStates={setCharacterRuntimeStates}
                rerun={() => run(viewMode === 'mainStats' ? 'setPlans' : 'mainStats')}
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
                                  setCharacterRuntimeStates,
                                  rerun,
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
