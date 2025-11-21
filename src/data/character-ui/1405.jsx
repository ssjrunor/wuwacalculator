import {formatDescription} from "../../utils/formatDescription.js";
import React from "react";
import DropdownSelect from "../../components/utils-ui/DropdownSelect.jsx";

export default function JianxinUI() {
    const hasToggles = false;
    if (!hasToggles) return null;
}

export function jianxinSequenceToggles({
                                         nodeKey,
                                         sequenceToggles,
                                         toggleSequence,
                                         currentSequenceLevel,
                                     }) {
    const validKeys = ['4'];
    if (!validKeys.includes(String(nodeKey))) return null;

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
                    <div className="echo-buff-name">Outro Skill: Transcendence</div>
                </div>
                <div className="echo-buff-effect">
                    The incoming Resonator has their <span className="highlight">Resonance Liberation DMG</span> Amplified by <span className="highlight">38%</span> for 14s or until they are switched out.

                </div>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.transcendence || false}
                        onChange={() => toggleState('transcendence')}
                    />
                    Enable
                </label>
            </div>
        </div>
    );
}