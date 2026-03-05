import React from 'react';
import {Tooltip} from "antd";
import {highlightKeywordsInText} from "@shared/constants/echoSetData.jsx";
import {echoSetById, setIconMap} from "@shared/constants/echoSetData2.js";
import {withOpacity} from "@shared/utils/attributeHelpers.js";
import {formatNumber} from "./suggestionsViewUtils.js";
import AppLoaderOverlay from "@/shared/ui/common/AppLoaderOverlay.jsx";

const pieces = {
    2: 'twoPiece',
    3: 'threePiece',
    5: 'fivePiece'
};

function setsEqual(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    if (a.length !== b.length) return false;

    const map = new Map();
    for (const s of a) {
        map.set(s.setId, s.count);
    }

    for (const t of b) {
        if (!map.has(t.setId)) return false;
        if (map.get(t.setId) !== t.pieces) return false;
    }

    return true;
}

export default function SetPlansView({
                                         currentSliderColor,
                                         isRunning,
                                         noEchoes,
                                         skillName,
                                         baseDamage,
                                         setSuggestions,
                                         selectedPlanIndex,
                                         onSelectPlan,
                                         onOpenSkillMenu,
                                         onInspect,
                                         onResetSelection,
                                         keywords,
                                         setData,
                                         setOpenPartsModal
}) {
    const getSetMeta = (setId) => echoSetById?.[setId] ?? null;

    return (
        <>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                <h2 className="panel-title">Suggested Sonata Sets</h2>
            </div>

            <div className={`set-plan suggestions-list app-loader-host ${isRunning ? 'running' : ''}`}>
                <div className="set-plan suggestions-controls buffs-box">
                    <div className="toggle custom-select small" onClick={onOpenSkillMenu}>
                        {skillName ? skillName : "Target Skill"}
                    </div>
                    <button className="rotation-button" onClick={() => setOpenPartsModal(true)}>
                        Config
                    </button>
                    <button className="rotation-button" onClick={onInspect}>
                        Inspect
                    </button>
                    <button className="rotation-button clear" onClick={onResetSelection}>
                        Reset Selection
                    </button>
                </div>
                {isRunning && (
                    <AppLoaderOverlay text="Generating set plans..." />
                )}

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
                        const current = setsEqual(setData, plan?.setPlan);

                        return (
                            <button
                                key={index}
                                type="button"
                                className={`set-plan-card rotation-item ${isSelected ? 'selected' : ''}`}
                                onClick={() => onSelectPlan(index)}
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
                                                        (diffPercent !== 0
                                                            ? diffPercent > 0
                                                                ? 'positive'
                                                                : 'negative'
                                                            : 'zero')
                                                    }
                                                >
                                                    {!current ? `${(Math.abs(diffPercent).toFixed(2))}%` : 'Current'}
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
    );
}
