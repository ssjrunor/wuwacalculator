import React, {useEffect, useLayoutEffect, useRef, useState} from "react";
import {ctxObj, EchoOptimizer} from "../../optimizer/EchoOptimizer.js";
import {getEchoBag} from "../../state/echoBagStore.js";
import {getSetPlanFromEchoes} from "../../data/buffs/setEffect.js";
import echoSetData, {setIconMap} from "../../constants/echoSetData.jsx";
import {getEchoScores, getTop5SubstatScoreDetails} from "../../utils/echoHelper.js";
import {EchoGridPreview} from "../overview-ui/OverviewDetailPane.jsx";
import {attributeColors, elementToAttribute} from "../../utils/attributeHelpers.js";
import {EchoFilters} from "../../optimizer/EchoFilters.js";
import {countEchoCombos} from "../../optimizer/generateEchoCombos.js";
import ExpandableSection from "../utils-ui/Expandable.jsx";
import CharacterMenu from "../character-ui/CharacterMenu.jsx";
import SkillMenu, {tabDisplayOrder} from "../utils-ui/SkillMenu.jsx";
import {CharacterOptionsPanel} from "./CharacterOptionsPanel.jsx";
import {EchoOptimizerControlBox} from "./EchoOptimizerControlBox.jsx";
import {groupEchoSetsByPiece} from "../../optimizer/setSolver.js";
import EchoOptimizerRow from "./EchoOptimizerRow.jsx";
import {
    computeEchoStatsFromIds,
    getDefaultMainStatFilter,
    resolveEchoesFromIds
} from "../../optimizer/optimizerUtils.js";
import {echoes as allEchoes} from "../../json-data-scripts/getEchoes.js";
import EchoMenu from "../echoes-pane-ui/EchoMenu.jsx";
import {useComboCounter} from "./useComboCounter.js";
import GuidesModal from "../utils-ui/GuideModal.jsx";
import PlainModal from "../utils-ui/PlainModal.jsx";
import {modalContent} from "./modalContent.jsx";
import {getGroupedSkillOptions} from "../../utils/prepareDamageData.js";
import {
    buildMainStatPoolForSuggestor,
    generateMainStatsContext
} from "../../suggestions/mainStat-suggestion/ctx-builder.js";
import {runMainStatSuggestor} from "../../suggestions/mainStat-suggestion/suggestMainStat.js";
import {runSetSuggestor} from "../../suggestions/setPlain-suggestion/suggestSetPlan.js";

const HEADER_TITLES = [
    "Set",
    "Main",
    "∑ Cost",
    "∑ ATK",
    "∑ HP",
    "∑ DEF",
    "∑ ER%",
    "∑ CR%",
    "∑ CD%",
    "∑ BNS%",
    "∑ AMP%",
    "DMG",
    "EFF"
];

export default function Optimizer({
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
                                      optimizerResults,
                                      setOptimizerResults,
                                      rarityMap,
                                      triggerRef,
                                      menuOpen,
                                      setMenuOpen,
                                      handleCharacterSelect,
                                      menuRef,
                                      generalOptimizerSettings,
                                      setGeneralOptimizerSettings,
                                      switchLeftPane,
                                      keywords,
                                      finalStats
                                  }) {
    const resultLength = optimizerResults?.length ?? 0;
    const runtime = characterRuntimeStates[charId] ?? {};
    const optimizer = runtime?.optimizerSettings ?? {};
    const updateOptimizerSettings = (patch) => {
        const charId = activeCharacter.Id ?? activeCharacter.id ?? activeCharacter.link;
        setCharacterRuntimeStates((prev) => {
            const prevChar = prev[charId] ?? {};
            return {
                ...prev,
                [charId]: {
                    ...prevChar,
                    optimizerSettings: {
                        ...(prevChar.optimizerSettings ?? {}),
                        ...patch,
                    },
                },
            };
        });
    };
    const updateGeneralOptimizerSettings = (patch) => {
        setGeneralOptimizerSettings((prev) => ({
            ...prev,
            ...patch,
        }));
    };

    const setOptions = optimizer.setOptions ?? groupEchoSetsByPiece();
    const statLimits = optimizer.statLimits ?? {};

    const level = optimizer?.level ?? null;
    const tab = optimizer?.tab ?? "";
    const useSplash = generalOptimizerSettings?.useSplash ?? false;
    const entry = {
        label: level?.Name,
        detail: level?.Type ?? tab,
        tab
    };
    const skill = skillResults
        ?.find(skill => skill.name === level?.label || skill.name === level?.Name) ?? {};
    const statWeight = skill.statWeight ?? skill.custSkillMeta?.statWeight ?? {};

    const mainStatFilter = optimizer.mainStatFilter ?? getDefaultMainStatFilter(statWeight, charId);

    const mainEcho = optimizer?.mainEcho ?? null;
    const mainEchoId = mainEcho?.id ?? null;

    const maxScore = getTop5SubstatScoreDetails(charId).total;
    const echoData = runtime?.equippedEchoes ?? [];
    const [resEchoes, setResEchoes] = useState(echoData);

    const [showSkillOptions, setShowSkillOptions] = useState(false);
    const [echoMenuOpen, setEchoMenuOpen] = useState(false);
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
        updateOptimizerSettings({ tab: newTab });

        const match = allSkillLevels?.[newTab]?.find(
            (l) => l?.label?.includes(skill?.name) || l?.Name?.includes(skill?.name)
        );
        if (match) updateOptimizerSettings({ level: match });
        setShowSkillOptions(false);
    };

    const closeMenu = () => {
        setIsClosingSkillMenu(true);
        setTimeout(() => {
            setShowSkillOptions(false);
            setIsClosingSkillMenu(false);
        }, 200);
    };

    const echoBag = getEchoBag();
    const [isLoading, setIsLoading] = useState(false);
    const resultsLimit = generalOptimizerSettings.resultsLimit ?? 32;
    const [progress, setProgress] = useState({
        progress: 0,
        elapsedMs: 0,
        remainingMs: Infinity,
        processed: 0,
        speed: 0
    });
    const [success, setSuccess] = useState(false);
    const [cancelled, setCancelled] = useState(false);
    const [form, setForm] = useState(null);
    const [combinations, setCombinations] = useState(0);
    const keepPercent = generalOptimizerSettings.keepPercent ?? 0;
    const [filtered, setFiltered] = useState(EchoFilters.getFilteredEchoes({
        statWeight,
        echoBag,
        keepPercent,
        setOptions,
        mainStatFilter
    }));
    const [currentBag, setCurrentBag] = useState([...filtered]);
    const [currentContext, setCurrentContext] = useState({...ctxObj});

    useEffect(() => {
        setForm({
            charId,
            activeCharacter,
            characterRuntimeStates,
            baseCharacterState,
            mergedBuffs,
            entry,
            levelData: level,
            echoBag,
            keepPercent,
            equippedEchoes: echoData,
            statWeight,
            resultsLimit,
            baseDmg: skill?.avg ?? 1,
            skillType: skill.skillType,
            lockedEchoId: mainEchoId
        });
        const filtered = EchoFilters.getFilteredEchoes({
            statWeight,
            echoBag,
            keepPercent,
            setOptions,
            mainStatFilter
        });
        setFiltered(filtered);
        setPendingCombinations(true);
        (async () => {
            const total = await countEchoCombos({
                echoes: filtered,
                maxCost: 12,
                maxSize: 5,
                lockedEchoId: mainEchoId
            });
            setCombinations(total);
            setPendingCombinations(false);
        })();
    }, [activeCharacter, level]);

    useEffect(() => {
        setOptimizerResults([]);
    }, [activeCharacter]);

    const [pendingCombinations, setPendingCombinations] = useState(false);
    const [batchSize, setBatchSize] = useState(null);
    const comboTimer = useRef(null);

    const ComboCounter = useComboCounter({
        countEchoCombos,
        comboTimerRef: comboTimer,
        statWeight,
        echoBag,
        keepPercent,
        setOptions,
        mainStatFilter,
        mainEcho,
        filtered,
        setFiltered,
        setPendingCombinations,
        setCombinations,
        updateGeneralOptimizerSettings,
        updateOptimizerSettings,
    });

    function handleStatLimitChange(statKey, field, valueStr) {
        const value =
            valueStr === "" ? undefined : Number(valueStr);

        const currentLimits = statLimits ?? {};
        const currentForKey = currentLimits[statKey] ?? {};

        updateOptimizerSettings({
            statLimits: {
                ...currentLimits,
                [statKey]: {
                    ...currentForKey,
                    [field]: value,
                },
            },
        });
    }

    function handleReset() {
        updateGeneralOptimizerSettings({ keepPercent: 0, resultsLimit: 32 });
        setProgress({
            progress: 0,
            elapsedMs: 0,
            remainingMs: Infinity,
            processed: 0,
            speed: 0
        });
        setSuccess(false)
        setResEchoes(echoData);
        setOptimizerResults([]);
        setBatchSize(null);
        setCancelled(false);
        if (keepPercent === 0) return;
        Promise.resolve().then(() => {
            ComboCounter.handleFilteredChange(0);
        });
    }

    async function runOptimizer () {
        if (echoBag.length === 0) {
            setUiModalContent(modalContent.emptyEchoBag);
            setModalOpen(true);
            return;
        }
        if (combinations === 0) {
            setUiModalContent(modalContent.noValidCombos);
            setModalOpen(true);
            return;
        }
        if (!form) return;
        setIsLoading(true);
        setProgress({
            progress: 0,
            elapsedMs: 0,
            remainingMs: Infinity,
            processed: 0,
            speed: 0
        });
        setSuccess(false);
        setCurrentBag([...filtered]);
        const results = await EchoOptimizer.optimize({
            ...form,
            filtered,
            combinations,
            resultsLimit,
            lockedEchoId: mainEchoId,
            constraints: statLimits,
            sequence: runtime?.SkillLevels.sequence,
            onProgress: ({ progress, elapsedMs, remainingMs, processed, speed }) =>
                setProgress(prev => ({
                    ...prev,
                    progress,
                    elapsedMs,
                    remainingMs,
                    processed,
                    speed
                })),
            onBatchSize: size => setBatchSize(size),
            onContext: ctx => setCurrentContext(ctx),
        });
        setCancelled(results.cancelled)
        if (!results || results.cancelled) {
            setIsLoading(false);
            setSuccess(false);
            return;
        }
        if (results.length === 0) {
            setIsLoading(false);
            setUiModalContent(modalContent.rangeLimitsTooStrict);
            setModalOpen(true);
            return;
        }
        setOptimizerResults(results);
        setIsLoading(false);
        setSuccess(true);
    }

    function onEquipOptimizerResult() {
        if (!resEchoes || !Array.isArray(resEchoes) || resEchoes.every(item => item === null)) return;
        setCharacterRuntimeStates(prev => {
            const prevChar = prev[charId] ?? {};
            return {
                ...prev,
                [charId]: {
                    ...prevChar,
                    equippedEchoes: resEchoes.map(e => (e ? { ...e } : null)),
                },
            };
        });
    }

    const [showGuide, setShowGuide] = useState(false);
    const [onGuideClose, setGuideClose] = useState(null);
    const [guideCategory, setGuideCategory] = useState(null);
    const openGuide = React.useCallback((category) => {
        setGuideCategory(category);
        setShowGuide(true);
    }, []);

    useEffect(() => {
        if (echoBag.length === 0) {
            setUiModalContent(modalContent.emptyEchoBag);
            setModalOpen(true);
        }
    }, [])

    const [modalOpen, setModalOpen] = useState(false);
    const [uiModalContent, setUiModalContent] = useState(null);

    const [isWide, setIsWide] = useState(() => {
        if (typeof window === "undefined") return true;
        return window.innerWidth >= 1600;
    });

    useLayoutEffect(() => {
        function handleResize() {
            setIsWide(window.innerWidth >= 1600);
        }

        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);


    if (!activeCharacter || !form) return null;

    return (
        <div className={`optimizer-pane ${isWide ? '' : 'compact'}`}>

            <PlainModal modalOpen={modalOpen} setModalOpen={setModalOpen} width="800px">
                {uiModalContent}
            </PlainModal>

            <GuidesModal
                open={showGuide}
                category={guideCategory}
                onClose={() => {
                    setShowGuide(false);
                    onGuideClose?.();
                }}
            />

            <CharacterMenu
                characters={characters}
                handleCharacterSelect={handleCharacterSelect}
                menuRef={menuRef}
                menuOpen={menuOpen}
                setMenuOpen={setMenuOpen}
                rarityMap={rarityMap}
            />

            <EchoMenu
                echoes={allEchoes}
                handleEchoSelect={(sel) => {
                    ComboCounter.handleMainEchoChange(sel);
                    setEchoMenuOpen(false);
                }}
                menuRef={menuRef}
                menuOpen={echoMenuOpen}
                setMenuOpen={setEchoMenuOpen}
            />

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

            {isWide && (
                <EchoOptimizerControlBox
                    runOptimizer={runOptimizer}
                    resultsLimit={resultsLimit}
                    searchLength={filtered.length}
                    combinations={combinations}
                    keepPercent={keepPercent}
                    handleFilteredChange={ComboCounter.handleFilteredChange}
                    progress={progress}
                    updateGeneralOptimizerSettings={updateGeneralOptimizerSettings}
                    pendingCombinations={pendingCombinations}
                    batchSize={batchSize}
                    handleReset={handleReset}
                    isLoading={isLoading}
                    resultLength={resultLength}
                    onEquipOptimizerResult={onEquipOptimizerResult}
                    setOptimizerResults={setOptimizerResults}
                    success={success}
                    cancelled={cancelled}
                    openGuide={openGuide}
                />
            )}
                <div className="optimizer-details">
                    <ExpandableSection title="Character Settings" defaultOpen={true} className="optimizer-character-settings">
                        <div className="echo-buff character-options-container">
                            <CharacterOptionsPanel
                                statLimits={statLimits}
                                handleStatLimitChange={handleStatLimitChange}
                                activeCharacter={activeCharacter}
                                rarityMap={rarityMap}
                                charId={charId}
                                triggerRef={triggerRef}
                                menuOpen={menuOpen}
                                setMenuOpen={setMenuOpen}
                                runtime={runtime}
                                skill={skill}
                                setShowSkillOptions={setShowSkillOptions}
                                useSplash={useSplash}
                                updateGeneralOptimizerSettings={updateGeneralOptimizerSettings}
                                handleSetOptionChange={ComboCounter.handleSetOptionChange}
                                switchLeftPane={switchLeftPane}
                                setOptions={setOptions}
                                mainEcho={mainEcho}
                                setEchoMenuOpen={setEchoMenuOpen}
                                handleMainEchoChange={ComboCounter.handleMainEchoChange}
                                mainStatFilter={mainStatFilter}
                                handleMainStatFilterChange={ComboCounter.handleMainStatFilterChange}
                                resEchoes={resEchoes}
                                currentContext={currentContext}
                                charIdForm={form.charId}
                                mergedBuffs={mergedBuffs}
                                finalStats={runtime?.finalStats ?? finalStats}
                                skillMeta={skill?.custSkillMeta ?? {}}
                                echoBag={echoBag}
                            />
                        </div>
                    </ExpandableSection>
                    <ExpandableSection title="Results" defaultOpen={true} className="optimizer-search-results">
                        <div className="echo-buff results-container">
                            <div className="fixed-header rotation-item">
                                <div className="optimizer-result-item header">
                                    {HEADER_TITLES.map(title => (
                                        <div key={title} className="col">
                                            {title}
                                        </div>
                                    ))}
                                </div>
                                <EchoOptimizerRow
                                    echoData={echoData}
                                    setPlan={getSetPlanFromEchoes(echoData) || []}
                                    mergedBuffs={mergedBuffs}
                                    runtime={runtime}
                                    finalStats={runtime?.finalStats ?? finalStats}
                                    skill={skill}
                                    onClick={() => setResEchoes(echoData)}
                                    damage={skill.avg}
                                    base={true}
                                    skillMeta={skill?.custSkillMeta ?? {}}
                                    charId={charId}
                                    keywords={keywords}
                                />
                            </div>

                            <div className="optimizer-results">
                                {!isLoading ? (
                                    <>
                                        {optimizerResults.map((res, i) => {
                                            const echoObjs = resolveEchoesFromIds(res.uids, echoBag);
                                            const { setPlan, statTotals } = computeEchoStatsFromIds(res.uids, echoBag, currentContext, form.charId);

                                            return (
                                                <EchoOptimizerRow
                                                    key={i}
                                                    echoData={echoObjs}
                                                    setPlan={setPlan}
                                                    statTotals={statTotals}
                                                    mergedBuffs={mergedBuffs}
                                                    skill={skill}
                                                    damage={res.damage}
                                                    onClick={() => setResEchoes(echoObjs)}
                                                    charId={form.charId}
                                                    keywords={keywords}
                                                    sequence={runtime?.SkillLevels.sequence}
                                                />
                                            );
                                        })}
                                    </>
                                ) : (
                                    <div className="fancy-loader-container">
                                        <div
                                            className="fancy-loader"
                                            style={{
                                                borderTopColor:
                                                    attributeColors[elementToAttribute[activeCharacter?.attribute]] ??
                                                    "#66ccff",
                                            }}
                                        ></div>
                                        <span className="loader-text">
                                            hold on
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="echo-preview-view">
                            <div
                                className="echo-grid guides"
                                style={{marginBottom: "1rem"}}
                            >
                                {[...Array(5)].map((_, i) => {
                                    const echo = resEchoes[i];
                                    const score = echo
                                        ? (getEchoScores(charId, echo).totalScore / maxScore) * 100
                                        : 0;

                                    return (
                                        <div
                                            key={i}
                                            className="echo-tile overview inherent-skills-box echo-parser-preview"
                                            style={{margin: "unset"}}
                                        >
                                            <EchoGridPreview
                                                echo={echo}
                                                getImageSrc={getImageSrc}
                                                score={score}
                                                setIconMap={setIconMap}
                                                className="echo-parser-preview preset-preview"
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </ExpandableSection>
                    {/*<ExpandableSection
                        title="Analytics"
                        defaultOpen={false}
                        className="optimizer-analytics-section"
                    >
                        <OptimizerAnalyticsPanel />
                    </ExpandableSection>*/}
                </div>

            {!isWide && (
                <EchoOptimizerControlBox
                    runOptimizer={runOptimizer}
                    resultsLimit={resultsLimit}
                    searchLength={filtered.length}
                    combinations={combinations}
                    keepPercent={keepPercent}
                    handleFilteredChange={ComboCounter.handleFilteredChange}
                    progress={progress}
                    updateGeneralOptimizerSettings={updateGeneralOptimizerSettings}
                    pendingCombinations={pendingCombinations}
                    batchSize={batchSize}
                    handleReset={handleReset}
                    isLoading={isLoading}
                    resultLength={resultLength}
                    onEquipOptimizerResult={onEquipOptimizerResult}
                    setOptimizerResults={setOptimizerResults}
                    success={success}
                    setSuccess={setSuccess}
                    cancelled={cancelled}
                    openGuide={openGuide}
                    isWide={isWide}
                />
            )}
            </div>
    )
}