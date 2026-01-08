import React from 'react';
import {formatStatKey} from "@/utils/echoHelper.js";
import {withOpacity} from "@/utils/attributeHelpers.js";
import {formatNumber} from "./suggestionsViewUtils.js";

function normalizeMainStats(echo) {
    if (!echo || !echo.mainStats) return '__NO_MAIN_STATS__';
    const entries = Object.entries(echo.mainStats)
        .sort(([aKey], [bKey]) => aKey.localeCompare(bKey));
    return JSON.stringify(entries);
}

function haveSameMainStats(echoesA, echoesB) {
    const listA = (echoesA || [])
        .filter(e => e && e.mainStats)
        .map(normalizeMainStats)
        .sort();
    const listB = (echoesB || [])
        .filter(e => e && e.mainStats)
        .map(normalizeMainStats)
        .sort();

    if (listA.length !== listB.length) return false;

    for (let i = 0; i < listA.length; i++) {
        if (listA[i] !== listB[i]) return false;
    }
    return true;
}

export default function MainStatsView({
    currentSliderColor,
    isRunning,
    noEchoes,
    skillName,
    baseDamage,
    mainStatResults,
    selectedMainStatIndex,
    onSelectMainStat,
    onOpenSkillMenu,
    onInspect,
    onResetSelection,
    echoData,
}) {
    return (
        <>
            <div style={{ display: 'flex', flexDirection: 'row' }}>
                <h2 className="panel-title">Suggested Main Stats</h2>
            </div>

            <div className={`main-stats suggestions-list ${isRunning ? 'running' : ''}`}>
                <div className="main-stats suggestions-controls buffs-box">
                    <div className="toggle custom-select small" onClick={onOpenSkillMenu}>
                        {skillName ? skillName : "Target Skill"}
                    </div>
                    <button className="rotation-button" onClick={onInspect}>
                        Inspect
                    </button>
                    <button className="rotation-button clear" onClick={onResetSelection}>
                        Reset Selection
                    </button>
                </div>
                {noEchoes ? (
                    <span className="empty-state">
                        No main stat suggestions yet. Make sure you have echoes equipped!
                    </span>
                ) : (
                    <>
                        {mainStatResults.map((plan, index) => {
                            const isSelected = index === selectedMainStatIndex;
                            const onSelect = onSelectMainStat;
                            const current = haveSameMainStats(echoData, plan?.echoes || []);
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
                                </div>
                            );
                        })}
                    </>
                )}
            </div>
        </>
    );
}
