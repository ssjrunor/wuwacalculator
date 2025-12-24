import React from "react";

export default function YuanwuUI() {
    const hasToggles = false;
    if (!hasToggles) return null;
}

export function yuanwuSequenceToggles({ nodeKey, sequenceToggles, toggleSequence, currentSequenceLevel }) {
    if (!['3', '5', '6'].includes(String(nodeKey))) return null;

    const requiredLevel = Number(nodeKey);
    const isDisabled = currentSequenceLevel < requiredLevel;

    return (
        <label className="modern-checkbox" style={{ opacity: isDisabled ? 0.5 : 1 }}>
            <input
                type="checkbox"
                checked={sequenceToggles[nodeKey] || false}
                onChange={() => toggleSequence(nodeKey)}
                disabled={isDisabled}
            />
            Enable
        </label>
    );
}

export function buffUI({ activeStates, toggleState }) {
    return (
        <div className="echo-buffs">
            <div className="echo-buff">
                <div className="echo-buff-header">
                    <div className="echo-buff-name">S6: Defender of All Realms</div>
                </div>
                <div className="echo-buff-effect">
                    All team members nearby within the range of Resonance Skill <span className="highlight">Thunder Wedge</span> will gain a <span className="highlight">32%</span> DEF increase, lasting 3s.
                </div>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.defender || false}
                        onChange={() => toggleState('defender')}
                    />
                    Enable
                </label>
            </div>
        </div>
    );
}