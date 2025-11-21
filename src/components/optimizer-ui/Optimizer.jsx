import React, {useEffect, useRef, useState} from "react";
import {ctxObj, EchoOptimizer} from "../../optimizer/EchoOptimizer.js";
import {getEchoBag} from "../../state/echoBagStore.js";
import {getSetPlanFromEchoes} from "../../data/buffs/setEffect.js";
import {setIconMap} from "../../constants/echoSetData.jsx";
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
import {computeEchoStatsFromIds, resolveEchoesFromIds} from "../../optimizer/optimizerUtils.js";
import {echoes as allEchoes} from "../../json-data-scripts/getEchoes.js";
import EchoMenu from "../echoes-pane-ui/EchoMenu.jsx";

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
    "DIFF"
];

export default function Optimizer({
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
                                      weapons,
                                      finalStats
                                  }) {
    const resultLength = optimizerResults?.length ?? 0;
    const optimizer = characterRuntimeStates?.[charId]?.optimizerSettings;
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

    const mainEcho = optimizer?.mainEcho ?? null;
    const mainEchoId = mainEcho?.id ?? null;

    const maxScore = getTop5SubstatScoreDetails(charId).total;
    const runtime = characterRuntimeStates[charId] ?? {};
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
        const allSkills = skillResults.filter(
            (s) => s.visible !== false && s.tab !== "negativeEffect" && s.tab !== "echoAttacks"
        );
        const groups = {};
        for (const skill of allSkills) {
            const tab = skill.tab ?? "unknown";
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
    const keepPercent = generalOptimizerSettings.keepPercent ?? 0.6;
    const [filtered, setFiltered] = useState(EchoFilters.getFilteredEchoes({
        statWeight: skill.statWeight ?? skill.custSkillMeta?.statWeight,
        echoBag,
        keepPercent,
        setOptions
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
            statWeight: skill.statWeight ?? skill.custSkillMeta?.statWeight,
            resultsLimit,
            baseDmg: skill?.avg ?? 1,
            skillType: skill.skillType,
            lockedEchoId: mainEchoId
        });
        const filtered = EchoFilters.getFilteredEchoes({
            statWeight: skill.statWeight ?? skill.custSkillMeta?.statWeight,
            echoBag,
            keepPercent,
            setOptions
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

    const [pendingCombinations, setPendingCombinations] = useState(false);
    const comboTimer = useRef(null);
    const [batchSize, setBatchSize] = useState(null);

    async function handleFilteredChange(newPercent) {
        updateGeneralOptimizerSettings({ keepPercent: newPercent });
        setPendingCombinations(true);
        const freshForm = {
            statWeight: skill.statWeight ?? skill.custSkillMeta?.statWeight,
            echoBag,
            keepPercent: newPercent,
            setOptions
        };
        const updatedFiltered = EchoFilters.getFilteredEchoes(freshForm);
        setFiltered(updatedFiltered);
        if (comboTimer.current) clearTimeout(comboTimer.current);
        const runId = Date.now();
        handleFilteredChange.currentRun = runId;

        comboTimer.current = setTimeout(async () => {
            if (handleFilteredChange.currentRun !== runId) return;
            const total = await countEchoCombos({
                echoes: updatedFiltered,
                maxCost: 12,
                maxSize: 5,
            });
            if (handleFilteredChange.currentRun !== runId) return;

            setCombinations(total);
            setPendingCombinations(false);
        }, 300);
    }

    function handleSetOptionChange(newSetOptions) {
        updateOptimizerSettings({ setOptions: newSetOptions });
        setPendingCombinations(true);
        const freshForm = {
            statWeight: skill.statWeight ?? skill.custSkillMeta?.statWeight,
            echoBag,
            keepPercent,
            setOptions: newSetOptions
        };
        const updatedFiltered = EchoFilters.getFilteredEchoes(freshForm);
        setFiltered(updatedFiltered);
        if (comboTimer.current) clearTimeout(comboTimer.current);
        const runId = Date.now();
        handleSetOptionChange.currentRun = runId;

        comboTimer.current = setTimeout(async () => {
            if (handleSetOptionChange.currentRun !== runId) return;
            const total = await countEchoCombos({
                echoes: updatedFiltered,
                maxCost: 12,
                maxSize: 5,
            });
            if (handleSetOptionChange.currentRun !== runId) return;

            setCombinations(total);
            setPendingCombinations(false);
        }, 300)
    }

    function handleMainEchoChange(mainEcho) {
        updateOptimizerSettings({ mainEcho });
        setPendingCombinations(true);
        if (comboTimer.current) clearTimeout(comboTimer.current);
        const runId = Date.now();
        handleMainEchoChange.currentRun = runId;
        comboTimer.current = setTimeout(async () => {
            if (handleMainEchoChange.currentRun !== runId) return;
            const total = await countEchoCombos({
                echoes: filtered,
                maxCost: 12,
                maxSize: 5,
                lockedEchoId: mainEcho?.id ?? null
            });
            if (handleMainEchoChange.currentRun !== runId) return;
            setCombinations(total);
            setPendingCombinations(false);
        }, 300)
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
            handleFilteredChange(0.6);
        });
    }

    async function runOptimizer () {
        if (!form || combinations === 0) return;
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
            lockedEchoId: mainEchoId,
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

    if (!activeCharacter || !form) return null;

    return (
        <div className="optimizer-pane">
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
                    handleMainEchoChange(sel);
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

            <div className="sticky-wrapper">
                <EchoOptimizerControlBox
                    runOptimizer={runOptimizer}
                    resultsLimit={resultsLimit}
                    searchLength={filtered.length}
                    combinations={combinations}
                    keepPercent={keepPercent}
                    handleFilteredChange={handleFilteredChange}
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
                />
            </div>
                <div className="optimizer-details">
                    <ExpandableSection title="Character Settings" defaultOpen={true} className="optimizer-character-settings">
                        <div className="echo-buff character-options-container">
                            <CharacterOptionsPanel
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
                                characters={characters}
                                handleSetOptionChange={handleSetOptionChange}
                                weapons={weapons}
                                switchLeftPane={switchLeftPane}
                                setOptions={setOptions}
                                getImageSrc={getImageSrc}
                                mainEcho={mainEcho}
                                setEchoMenuOpen={setEchoMenuOpen}
                                handleMainEchoChange={handleMainEchoChange}
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
                                />
                            </div>

                            <div className="optimizer-results">
                                {!isLoading ? (
                                    <>
                                        {optimizerResults.map((res, i) => {
                                            const echoObjs = resolveEchoesFromIds(res.ids, currentBag);
                                            const { setPlan, statTotals } = computeEchoStatsFromIds(res.ids, currentBag, currentContext, form.charId);

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
                </div>
            </div>
    )
}