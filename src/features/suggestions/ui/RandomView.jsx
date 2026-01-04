import React, { useRef, useState } from 'react';
import {formatStatKey, getEchoScores, getTop5SubstatScoreDetails} from "@/utils/echoHelper.js";
import {withOpacity} from "@/utils/attributeHelpers.js";
import {formatNumber} from "./suggestionsViewUtils.js";
import {EchoGridPreview} from "@/features/overview/ui/OverviewDetailPane.jsx";
import {setIconMap} from "@/constants/echoSetData2.js";
import EchoMenu from "@/features/echoes/ui/EchoMenu.jsx";
import {echoes as allEchoes} from "@/data/ingest/getEchoes.js";
import {getEquippedEchoesScoreDetails} from "@/features/echoes/ui/EchoesPane.jsx";
import {defaultRandGen} from "@/features/suggestions/core/randomEchoes/lib/constants.js";
import {SonataSetPlanner} from "@/features/suggestions/ui/SonataSetPlanner.jsx";

function normalizeStatBlock(stats, emptyToken) {
    if (!stats) return emptyToken;
    const entries = Object.entries(stats)
        .sort(([aKey], [bKey]) => aKey.localeCompare(bKey));
    return JSON.stringify(entries);
}

function buildSubstatTotals(echoes) {
    const totals = Object.create(null);

    for (const echo of echoes) {
        const subStats = echo?.subStats ?? {};
        for (const [key, value] of Object.entries(subStats)) {
            if (!totals[key]) {
                totals[key] = { label: formatStatKey(key, true), value: 0 };
            }
            totals[key].value += value;
        }
    }

    return totals;
}

function formatSubstatValue(key, value) {
    if (key.endsWith('Flat')) return String(value);
    return `${Number(value).toFixed(1)}%`;
}

function groupSubstatTotalsByLabel(totals) {
    const grouped = new Map();
    for (const [key, entry] of Object.entries(totals ?? {})) {
        const label = entry?.label ?? formatStatKey(key);
        const formatted = formatSubstatValue(key, entry?.value ?? 0);
        if (!grouped.has(label)) grouped.set(label, []);
        grouped.get(label).push(formatted);
    }

    return Array.from(grouped.entries())
        .map(([label, values]) => ({ label, values }));
}

function normalizeEchoSignature(echo) {
    if (!echo) return '__NO_ECHO__';
    const main = normalizeStatBlock(echo.mainStats, '__NO_MAIN_STATS__');
    const sub = normalizeStatBlock(echo.subStats, '__NO_SUB_STATS__');
    return `${main}|${sub}`;
}

function haveSameMainStats(echoesA, echoesB) {
    const listA = (echoesA || [])
        .filter(e => e && (e.mainStats || e.subStats))
        .map(normalizeEchoSignature)
        .sort();
    const listB = (echoesB || [])
        .filter(e => e && (e.mainStats || e.subStats))
        .map(normalizeEchoSignature)
        .sort();

    if (listA.length !== listB.length) return false;

    for (let i = 0; i < listA.length; i++) {
        if (listA[i] !== listB[i]) return false;
    }
    return true;
}

export default function RandomView({
                                       currentSliderColor,
                                       isRunning,
                                       skillName,
                                       baseDamage,
                                       randomResults,
                                       randomResultsIndex,
                                       onOpenSkillMenu,
                                       onResetSelection,
                                       echoData,
                                       randGen,
                                       updateRandGenSettings,
                                       charId,
                                       getImageSrc,
                                       characterRuntimeStates,
                                       onSelectRandBuild,
                                       setCharacterRuntimeStates,
                                       runRandomizer,
                                       setShowToast
                                      }) {
    const [showInspectModal, setShowInspectModal] = useState(false);
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const selectedPlan = randomResults?.[randomResultsIndex] ?? null;
    const selectedEchoes = selectedPlan?.echoes ?? [];

    return (
        <>
            <div style={{ display: 'flex', flexDirection: 'row' }}>
                <h2 className="panel-title">Random Echo Builds</h2>
            </div>

            <div className={`main-stats random-view suggestions-list ${isRunning ? 'running' : ''}`}>
                <div className="main-stats suggestions-controls buffs-box">
                    <button className="rotation-button" onClick={() => setShowConfigModal(true)}>
                        Config
                    </button>

                    {/*
                    <div className="toggle custom-select small" onClick={onOpenSkillMenu}>
                        {skillName ? skillName : "Target Skill"}
                    </div>
*/}
                    <button className="rotation-button"
                            onClick={() => {
                                setCharacterRuntimeStates(prev => ({
                                    ...prev,
                                    [charId]: {
                                        ...(prev[charId] ?? {}),
                                        equippedEchoes: selectedEchoes,
                                    },
                                }));
                                setShowToast(true);
                            }}
                    >
                        Apply
                    </button>
                    <button className="rotation-button" onClick={() => setShowInspectModal(true)}>
                        Inspect
                    </button>
                    <button className="clear-button clear" onClick={runRandomizer}
                    style={{ margin: 'unset' }}>
                        Regenerate
                    </button>
                    <button className="rotation-button clear" onClick={onResetSelection}>
                        Reset
                    </button>
                </div>
                {randomResults.map((plan, index) => {
                    const current = haveSameMainStats(echoData, plan?.echoes || []);
                    const substatTotals = buildSubstatTotals(plan?.echoes ?? []);
                    const groupedSubstats = groupSubstatTotalsByLabel(substatTotals);
                    const visibleSubstats = groupedSubstats.slice(0, 6);
                    const hiddenSubstatCount = Math.max(
                        0,
                        groupedSubstats.length - visibleSubstats.length,
                    );
                    const isSelected = index === randomResultsIndex;
                    const onSelect = onSelectRandBuild;
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
                            onClick={() => onSelect(index)}
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
                                                                (diffPercent !== 0
                                                                    ? diffPercent >= 0
                                                                        ? 'positive'
                                                                        : 'negative'
                                                                    : 'zero')
                                                            }
                                                        >
                                                            {!current
                                                                ? `${(Math.abs(diffPercent).toFixed(2))}%`
                                                                : 'Current'}
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
                                                            {formatStatKey(key)}
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
                            {groupedSubstats.length > 0 && (
                                <div className="sub-stat-row-pills">
                                    {visibleSubstats.map(({ label, values }) => (
                                        <span
                                            key={label}
                                            className="echo-buff main-stat-pill subs"
                                        >
                                            <span className="main-stat-pill-stat">
                                                ∑{label}
                                            </span>
                                            <span className="main-stat-pill-value highlight">
                                                {values.join(' | ')}
                                            </span>
                                        </span>
                                    ))}
                                    {hiddenSubstatCount > 0 && (
                                        <span className="echo-buff main-stat-pill subs">
                                            <span className="main-stat-pill-stat extra">
                                                +{hiddenSubstatCount}
                                            </span>
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            <RandomInspectModal
                open={showInspectModal}
                onClose={() => setShowInspectModal(false)}
                echoes={selectedEchoes}
                charId={charId}
                getImageSrc={getImageSrc}
                characterRuntimeStates={characterRuntimeStates}
                setCharacterRuntimeStates={setCharacterRuntimeStates}
                setShowToast={setShowToast}
            />
            <RandomConfigModal
                open={showConfigModal}
                onClose={() => setShowConfigModal(false)}
                randGen={randGen}
                updateRandGenSettings={updateRandGenSettings}
                skillName={skillName}
                onOpenSkillMenu={onOpenSkillMenu}
                onOpenEchoMenu={() => setMenuOpen(true)}
            />
            <EchoMenu
                echoes={allEchoes}
                handleEchoSelect={(sel) => {
                    updateRandGenSettings?.({ mainEcho: sel });
                    setMenuOpen(false);
                }}
                menuRef={menuRef}
                menuOpen={menuOpen}
                setMenuOpen={setMenuOpen}
            />
        </>
    );
}

function RandomInspectModal({
                                open,
                                onClose,
                                echoes,
                                charId,
                                getImageSrc,
                                characterRuntimeStates,
                                setCharacterRuntimeStates,
                                setShowToast
}) {
    const [isClosing, setIsClosing] = useState(false);
    const maxScore = getTop5SubstatScoreDetails(charId).total;
    const buildScore = getEquippedEchoesScoreDetails(charId, {
        [charId]: {
            ...(characterRuntimeStates?.[charId] ?? {}),
            equippedEchoes: echoes,
        },
    });
    const percentScoreCur = (buildScore.total / (maxScore * 5)) * 100 || 0;

    if (!open) return null;

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsClosing(false);
            onClose?.();
        }, 300);
    };

    return (
        <div
            className={`skills-modal-overlay ${isClosing ? "closing" : ""}`}
            onClick={(e) => {
                e.stopPropagation();
                handleClose();
            }}
        >
            <div
                className={`skills-modal-content preset-preview changelog-modal guides modal-main-content echo-preview-view ${
                    isClosing ? "closing" : ""
                }`}
                onClick={(e) => e.stopPropagation()}
                style={{gap: "unset"}}
            >
                <div style={{display: "flex", flexDirection: "row", alignItems: "center"}}>
                    <h2 style={{margin: 'unset'}}>Random Echo Build</h2>
                    <div style={{marginLeft: "auto", textAlign: "right"}}>
                        <h4 style={{margin: '4px'}} className="echo-buff">
                            Build Score: {percentScoreCur.toFixed(1)}%
                        </h4>
                    </div>
                </div>
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
                                        equippedEchoes: echoes,
                                    },
                                }));
                                setShowToast(true);
                                handleClose();
                            }}
                        >
                            Apply
                        </button>
                    </div>
                </div>
                <div className="echo-grid main-echo-description guides" style={{marginBottom: "1rem"}}>
                    {[...Array(5)].map((_, i) => {
                        const echo = echoes?.[i] ?? null;
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
        </div>
    );
}

function RandomConfigModal({
    open,
    onClose,
    randGen,
    updateRandGenSettings,
    skillName,
    onOpenSkillMenu,
    onOpenEchoMenu,
}) {
    const [isClosing, setIsClosing] = useState(false);

    if (!open || !randGen) return null;

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsClosing(false);
            onClose?.();
        }, 300);
    };

    return (
        <div
            className={`skills-modal-overlay ${isClosing ? "closing" : ""}`}
            onClick={(e) => {
                e.stopPropagation();
                handleClose();
            }}
        >
            <div
                className={`skills-modal-content preset-preview changelog-modal guides modal-main-content echo-preview-view ${
                    isClosing ? "closing" : ""
                }`}
                onClick={(e) => e.stopPropagation()}
                style={{gap: "unset"}}
            >
                <div style={{display: "flex", flexDirection: "row", alignItems: "center"}}>
                    <h2 style={{margin: 'unset'}}>Random Echo Configuration</h2>
                </div>
                <div style={{display: "flex", alignItems: "center"}}>
                    <h3>Configuration:</h3>
                </div>
                <div className="echo-grid main-echo-description guides" style={{marginBottom: "1rem"}}>
                    <div className="edit-config">
                        <div className="config-selector-group">
                            <h4>Main Echo:</h4>
                            <div
                                className="config-selector btn-primary echoes"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenEchoMenu?.();
                                }}
                            >
                                {randGen?.mainEcho?.name ?? "Select Echo"}
                            </div>

                            <h4>Target Skill:</h4>
                            <div
                                className="config-selector btn-primary echoes"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenSkillMenu?.();
                                }}
                            >
                                {skillName ?? "Target Skill"}
                            </div>

                            <div style={{display: "flex", gap: "1rem", alignItems: "center"}}>
                                <h4>Target Energy Regen:</h4>
                                <input
                                    type="number"
                                    style={{marginTop: "4px"}}
                                    min="0"
                                    max="200"
                                    step="100"
                                    value={randGen.targetEnergyRegen}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        const clamped = Math.max(0, Math.min(val, 200));
                                        updateRandGenSettings?.({targetEnergyRegen: clamped});
                                    }}
                                    className="character-level-input"
                                />
                            </div>

                            <SonataSetPlanner
                                selectedSets={randGen.setId ?? []}
                                updateRandGenSettings={updateRandGenSettings}
                            />
                        </div>

                        <div className="config-sliders">
                            <div className="slider-group">
                                <div className="slider-item">
                                    <label>Bias:</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        value={randGen.bias}
                                        onChange={(e) =>
                                            updateRandGenSettings?.({
                                                bias: Math.max(
                                                    0,
                                                    Math.min(Number(e.target.value), 1)
                                                ),
                                            })
                                        }
                                        className="character-level-input"
                                    />
                                </div>
                                <div className="slider-row">
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        value={randGen.bias}
                                        onChange={(e) =>
                                            updateRandGenSettings?.({
                                                bias: Number(e.target.value),
                                            })
                                        }
                                        className="slider bias"
                                    />
                                </div>
                            </div>

                            <div className="slider-group">
                                <div className="slider-item">
                                    <label>Roll Quality:</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        value={randGen.rollQuality}
                                        onChange={(e) =>
                                            updateRandGenSettings?.({
                                                rollQuality: Math.max(
                                                    0,
                                                    Math.min(Number(e.target.value), 1)
                                                ),
                                            })
                                        }
                                        className="character-level-input"
                                    />
                                </div>
                                <div className="slider-row">
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        value={randGen.rollQuality}
                                        onChange={(e) =>
                                            updateRandGenSettings?.({
                                                rollQuality: Number(e.target.value),
                                            })
                                        }
                                        className="slider quality"
                                    />
                                </div>
                            </div>

                            <button
                                className="rotation-button"
                                onClick={() => updateRandGenSettings?.({ ...defaultRandGen })}
                            >
                                Reset to Defaults
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
