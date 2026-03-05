import React, {useEffect, useLayoutEffect, useRef, useState} from "react";
import {
    computeEchoStatsFromIds,
    countEchoCombos,
    ctxObj,
    EchoFilters,
    EchoOptimizer,
    getDefaultMainStatFilter,
    groupEchoSetsByPiece,
    resolveEchoesFromIds,
} from "@/features/optimizer/core/misc/index.js";
import {getEchoBag} from "@shared/state/echoBagStore.js";
import {getSetPlanFromEchoes} from "@/data/buffs/setEffect.js";
import { setIconMap } from "@shared/constants/echoSetData2.js";
import {getEchoScores, getTop5SubstatScoreDetails} from "@shared/utils/echoHelper.js";
import {EchoGridPreview} from "@/features/overview/ui/OverviewDetailPane.jsx";
import ExpandableSection from "@/shared/ui/common/Expandable.jsx";
import CharacterMenu from "@/features/characters/ui/CharacterMenu.jsx";
import SkillMenu, {tabDisplayOrder} from "@/features/rotations/ui/SkillMenu.jsx";
import {CharacterOptionsPanel} from "./CharacterOptionsPanel.jsx";
import {EchoOptimizerControlBox} from "./EchoOptimizerControlBox.jsx";
import EchoOptimizerRow from "./EchoOptimizerRow.jsx";
import {echoes as allEchoes} from "@/data/runtime/getEchoes.js";
import EchoMenu from "@/features/echoes/ui/EchoMenu.jsx";
import {useComboCounter} from "./useComboCounter.js";
import GuidesModal from "@/shared/ui/common/GuideModal.jsx";
import PlainModal from "@/shared/ui/common/PlainModal.jsx";
import {modalContent} from "./modalContent.jsx";
import {getGroupedSkillOptions} from "@shared/utils/prepareDamageData.js";
import {detectWebGPUSupport} from "@/features/optimizer/core/gpu/getDevice.js";
import OptimizerRules from "./OptimizerRules.jsx";
import SetPartsModal from "@features/suggestions/ui/SetPartsModal.jsx";
import AppLoaderOverlay from "@/shared/ui/common/AppLoaderOverlay.jsx";

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
                                      rotationEntries,
                                      characters,
                                      activeCharacter,
                                      baseCharacterState,
                                      mergedBuffs,
                                      allSkillLevels,
                                      skillResults,
                                      getImageSrc,
                                      optimizerResults,
                                      setOptimizerResults,
                                      groupedSkillOptions: groupedSkillOptionsProp,
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
                                      finalStats,
                                      enemyProfile
                                  }) {
    useEffect(() => {
        (async () => {
            const ok = await detectWebGPUSupport();
            if (!ok) {
                setUiModalContent(modalContent.gpuNotAvailable);
                setModalOpen(true);
            }
        })();
    }, []);

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
    const useSplash = generalOptimizerSettings?.useSplash ?? true;
    const enableGpu = generalOptimizerSettings?.enableGpu ?? false;
    const entry = {
        label: level?.Name,
        detail: level?.Type ?? tab,
        tab
    };
    const skill = skillResults
        ?.find(skill => (skill.name === level?.label || skill.name === level?.Name) && skill.tab === tab) ?? {};

    const statWeight = skill.statWeight ?? skill.custSkillMeta?.statWeight ?? {};
    const rotationTotals = runtime?.rotationSummary?.totals ?? {};
    const hasRotationEntries = rotationEntries.length > 0;
    const rotationMode = optimizer?.rotationMode && hasRotationEntries;
    const displaySkill = rotationMode
        ? {
            ...skill,
            name: "Total Rotation DMG",
            label: "Total Rotation DMG",
            avg: rotationTotals.avg ?? 0,
            normal: rotationTotals.normal ?? 0,
            crit: rotationTotals.crit ?? 0
        }
        : skill;
    const displaySkillAvg = displaySkill?.avg ?? 1;
    const displaySkillType = displaySkill?.skillType;

    const mainStatFilter = optimizer.mainStatFilter ?? getDefaultMainStatFilter(statWeight, charId);

    const mainEcho = optimizer?.mainEcho ?? null;
    const mainEchoId = mainEcho?.id ?? null;

    const maxScore = getTop5SubstatScoreDetails(charId).total;
    const echoData = runtime?.equippedEchoes ?? [];
    const [resEchoes, setResEchoes] = useState(echoData);
    const RESULTS_PER_PAGE = 32;
    const [pageIndex, setPageIndex] = useState(0);

    const [showSkillOptions, setShowSkillOptions] = useState(false);
    const [echoMenuOpen, setEchoMenuOpen] = useState(false);
    const [isClosingSkillMenu, setIsClosingSkillMenu] = useState(false);
    const [expandedTabs, setExpandedTabs] = useState(() =>
        Object.fromEntries(tabDisplayOrder.map((key) => [key, true]))
    );
    const toggleTab = (key) =>
        setExpandedTabs((prev) => ({...prev, [key]: !prev[key]}));

    const groupedSkillOptions = React.useMemo(() => {
        if (groupedSkillOptionsProp) return groupedSkillOptionsProp;
        const groups = getGroupedSkillOptions({ skillResults });
        if (hasRotationEntries) {
            if (!groups.combo) groups.combo = [];
            groups.combo.unshift({
                name: "Total Rotation DMG",
                type: "combo",
                tab: "combo",
                visible: true,
                element: null,
            });
        }
        return groups;
    }, [groupedSkillOptionsProp, skillResults, hasRotationEntries]);

    const handleAddSkill = (skill) => {
        if (skill?.tab === "combo") {
            updateOptimizerSettings({ rotationMode: true });
            setShowSkillOptions(false);
            return;
        }
        const newTab = skill?.tab;
        updateOptimizerSettings({ tab: newTab, rotationMode: false });

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
    const resultsLimit = generalOptimizerSettings.resultsLimit ?? 64;
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
        mainStatFilter,
        rotationMode
    }));
    const [currentContext, setCurrentContext] = useState({...ctxObj});

    useEffect(() => {
        if (!hasRotationEntries && activeCharacter) {
            updateOptimizerSettings({ rotationMode: false });
        }
    }, [hasRotationEntries, activeCharacter]);

    useEffect(() => {
        if (!generalOptimizerSettings.shownRules) {
            setRulesOpen(true);
            generalOptimizerSettings.shownRules = true;
        }
    }, []);

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
            baseDmg: displaySkillAvg,
            skillType: displaySkillType,
            lockedEchoId: mainEchoId,
            sequence: runtime?.SkillLevels.sequence
        });
        const filtered = EchoFilters.getFilteredEchoes({
            statWeight,
            echoBag,
            keepPercent,
            setOptions,
            mainStatFilter,
            rotationMode
        });
        setFiltered(filtered);
        setPendingCombinations(true);
        (async () => {
            const total = await countEchoCombos({
                echoes: filtered,
                maxCost: 12,
                maxSize: 5,
                lockedEchoId: mainEchoId,
                countMode: enableGpu ? "combinadic" : "rows"
            });
            setCombinations(total);
            setPendingCombinations(false);
        })();
    }, [activeCharacter, level, enableGpu]);

    useEffect(() => {
        setOptimizerResults([]);
    }, [activeCharacter]);

    useEffect(() => {
        setPageIndex(0);
    }, [optimizerResults]);

    const totalPages = Math.max(1, Math.ceil(resultLength / RESULTS_PER_PAGE));
    const pageStart = pageIndex * RESULTS_PER_PAGE;
    const pageEnd = pageStart + RESULTS_PER_PAGE;
    const visibleResults = optimizerResults.slice(pageStart, pageEnd);

    const pageItems = React.useMemo(() => {
        const items = [];
        if (totalPages <= 10) {
            for (let i = 0; i < totalPages; i++) items.push(i);
            return items;
        }
        if (pageIndex < 7) {
            for (let i = 0; i < 7; i++) items.push(i);
            items.push("...");
            items.push(totalPages - 1);
            return items;
        }
        if (pageIndex > totalPages - 8) {
            items.push(0);
            items.push("...");
            for (let i = totalPages - 7; i < totalPages; i++) items.push(i);
            return items;
        }
        items.push(0);
        items.push("...");
        for (let i = pageIndex - 2; i <= pageIndex + 2; i++) items.push(i);
        items.push("...");
        items.push(totalPages - 1);
        return items;
    }, [pageIndex, totalPages]);

    const [pendingCombinations, setPendingCombinations] = useState(false);
    const [batchSize, setBatchSize] = useState(null);
    const comboTimer = useRef(null);
    const comboRunRef = useRef(0);
    const [rulesOpen, setRulesOpen] = useState(false);

    const ComboCounter = useComboCounter({
        countEchoCombos,
        comboTimerRef: comboTimer,
        comboRunRef,
        statWeight,
        echoBag,
        keepPercent,
        setOptions,
        mainStatFilter,
        mainEcho,
        filtered,
        enableGpu,
        setFiltered,
        setPendingCombinations,
        setCombinations,
        updateGeneralOptimizerSettings,
        updateOptimizerSettings,
        rotationMode
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
        updateGeneralOptimizerSettings({ keepPercent: 0, resultsLimit: 64 });
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
        if (!enableGpu && !generalOptimizerSettings.gpuAsked) {
            setUiModalContent(modalContent.firstTimeOptimizer);
            setModalOpen(true);
            updateGeneralOptimizerSettings({gpuAsked: true});
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
        const results = await EchoOptimizer.optimize({
            ...form,
            charId,
            characterRuntimeStates,
            filtered,
            combinations,
            resultsLimit,
            lockedEchoId: mainEchoId,
            constraints: statLimits,
            sequence: runtime?.SkillLevels.sequence,
            enableGpu,
            rotationMode,
            rotationEntries,
            skillResults,
            allSkillLevels,
            enemyProfile,
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
        const wasCancelled = Boolean(results?.cancelled);
        setCancelled(wasCancelled);
        if (!results || wasCancelled) {
            setIsLoading(false);
            setSuccess(false);
            if (results?.error) {
                setUiModalContent(
                    <div>
                        <h2>Optimizer error</h2>
                        <p>The optimizer was cancelled due to an internal error.</p>
                        <pre style={{ whiteSpace: "pre-wrap" }}>
                            {String(results.error)}
                        </pre>
                    </div>
                );
                setModalOpen(true);
            }
            return;
        }
        const resultList = Array.isArray(results) ? results : results.results;
        if (!resultList || resultList.length === 0) {
            setIsLoading(false);
            setUiModalContent(modalContent.rangeLimitsTooStrict);
            setModalOpen(true);
            return;
        }
        setOptimizerResults(resultList);
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

    const rotationExclude = rotationMode ? ["∑ BNS%", "∑ AMP%"] : [];

    const [openPartsModal, setOpenPartsModal] = useState(false);

    if (!activeCharacter || !form) return null;

    return (
        <div className={`optimizer-pane ${isWide ? '' : 'compact'}`}>

            <PlainModal modalOpen={modalOpen} setModalOpen={setModalOpen} width="800px">
                {uiModalContent}
            </PlainModal>

            <PlainModal modalOpen={rulesOpen} setModalOpen={setRulesOpen} width="900px">
                <OptimizerRules />
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

            <SetPartsModal
                open={openPartsModal}
                onClose={() => setOpenPartsModal(false)}
                title={'Sonata Set Config'}
                charId={charId}
                setCharacterRuntimeStates={setCharacterRuntimeStates}
                characterRuntimeStates={characterRuntimeStates}
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
                    openRules={() => setRulesOpen(true)}
                />
            )}
                <div className="optimizer-details">
                    <ExpandableSection title="Character Settings" defaultOpen={true} className="optimizer-character-settings">
                        <div className="echo-buff character-options-container">
                            <CharacterOptionsPanel
                                setOpenPartsModal={setOpenPartsModal}
                                statLimits={statLimits}
                                handleStatLimitChange={handleStatLimitChange}
                                activeCharacter={activeCharacter}
                                rarityMap={rarityMap}
                                charId={charId}
                                triggerRef={triggerRef}
                                menuOpen={menuOpen}
                                setMenuOpen={setMenuOpen}
                                runtime={runtime}
                                skill={displaySkill}
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
                                skillMeta={displaySkill?.custSkillMeta ?? {}}
                                echoBag={echoBag}
                                enableGpu={enableGpu}
                                rotationMode={rotationMode}
                            />
                        </div>
                    </ExpandableSection>
                    <ExpandableSection title="Results" defaultOpen={true} className="optimizer-search-results">
                        <div className="echo-buff results-container">
                            <div className="fixed-header rotation-item">
                                <div className="optimizer-result-item header">
                                    {HEADER_TITLES
                                        .filter(title => !(new Set(rotationExclude)).has(title))
                                        .map(title => (
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
                                    skill={displaySkill}
                                    onClick={() => setResEchoes(echoData)}
                                    damage={displaySkill.avg}
                                    base={true}
                                    skillMeta={displaySkill?.custSkillMeta ?? {}}
                                    charId={charId}
                                    keywords={keywords}
                                    rotationMode={rotationMode}
                                />
                            </div>

                            <div className={`optimizer-results app-loader-host ${isLoading ? "running" : ""}`}>
                                {!isLoading ? (
                                    <>
                                        {visibleResults.map((res, i) => {
                                            const echoObjs = resolveEchoesFromIds(res.uids, echoBag);
                                            const { setPlan, statTotals } = computeEchoStatsFromIds(res.uids, echoBag, currentContext, form.charId);

                                            return (
                                                <EchoOptimizerRow
                                                    key={pageStart + i}
                                                    finalStats={runtime?.finalStats ?? finalStats}
                                                    echoData={echoObjs}
                                                    setPlan={setPlan}
                                                    statTotals={statTotals}
                                                    mergedBuffs={mergedBuffs}
                                                    skill={displaySkill}
                                                    damage={res.damage}
                                                    onClick={() => setResEchoes(echoObjs)}
                                                    charId={form.charId}
                                                    keywords={keywords}
                                                    sequence={runtime?.SkillLevels.sequence}
                                                    rotationMode={rotationMode}
                                                />
                                            );
                                        })}
                                        {totalPages > 1 && (
                                            <div className="optimizer-pagination rotation-item sticky-footer">
                                                <button
                                                    className="pager-btn subtle"
                                                    disabled={pageIndex === 0}
                                                    onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                                                >
                                                    ‹
                                                </button>
                                                {pageItems.map((p, idx) =>
                                                    p === "..." ? (
                                                        <span key={`ellipsis-${idx}`} className="pager-ellipsis">…</span>
                                                    ) : (
                                                        <button
                                                            key={p}
                                                            className={`pager-btn ${p === pageIndex ? "active" : ""}`}
                                                            onClick={() => setPageIndex(p)}
                                                        >
                                                            {p + 1}
                                                        </button>
                                                    )
                                                )}
                                                <button
                                                    className="pager-btn subtle"
                                                    disabled={pageIndex >= totalPages - 1}
                                                    onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))}
                                                >
                                                    ›
                                                </button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <AppLoaderOverlay text="Optimizing..." />
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
                    openRules={() => setRulesOpen(true)}
                    isWide={isWide}
                />
            )}
            </div>
    )
}
