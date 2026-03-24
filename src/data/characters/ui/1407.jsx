import React from "react";
import {attributeColors} from "@shared/utils/attributeHelpers.js";

export default function CiacconaUI({ activeStates, toggleState }) {
    return (
        <div className="status-toggles">
            <div className="status-toggle-box">
                <h4 style={{ fontSize: '18px', fontWeight: 'bold' }}>Solo Concert</h4>
                <p>When <span className='highlight'>Ciaccona</span> or <span className='highlight'>Ensemble Sylph</span> performs <span className='highlight'>Solo Concert</span>, they give <span className='highlight'>24%</span> <span style={{ color: attributeColors['aero'], fontWeight: 'bold' }}>Aero DMG Bonus</span> to all nearby Resonators in the team.</p>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.concert || false}
                        onChange={() => {
                            toggleState('concert');
                        }}
                    />
                    Enable
                </label>
            </div>
            <div className="status-toggle-box">
                <h4 className={'highlight'} style={{ fontSize: '18px', fontWeight: 'bold' }}>Outro Skill: Windcalling Tune</h4>
                <p><span style={{ color: attributeColors['aero'], fontWeight: 'bold' }}>Aero Erosion</span> DMG dealt to targets near the active Resonator is Amplified by <span className='highlight'>100%</span> for 30s.</p>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.windcalling || false}
                        onChange={() => {
                            toggleState('windcalling');
                        }}
                    />
                    Enable
                </label>
            </div>
        </div>
    );
}

export function ciacconaSequenceToggles({
                                         nodeKey,
                                         sequenceToggles,
                                         toggleSequence,
                                         currentSequenceLevel,
                                     }) {
    const validKeys = ['1', '2'];
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

export function buffUI({ activeStates, toggleState, attributeColors }) {
    return (
        <div className="echo-buffs">
            <div className="echo-buff">
                <div className="echo-buff-header">
                    <div className="echo-buff-name">Outro Skill: Windcalling Tune</div>
                </div>
                <div className="echo-buff-effect">
                    <span style={{ color: attributeColors['aero'], fontWeight: 'bold' }}>Aero Erosion DMG</span> dealt to targets near the active Resonator is Amplified by <span className="highlight">100%</span> for <span className="highlight">30s</span>.
                </div>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.windcalling || false}
                        onChange={() => toggleState('windcalling')}
                    />
                    Enable
                </label>
                {/*
                <DropdownSelect
                    label="Stacks"
                    options={[0, 1, 2, 3]}
                    value={activeStates.adrenalineStacks ?? 0}
                    onChange={(value) => updateState('adrenalineStacks', value)}
                    width="80px"
                />
                */}
            </div>

            <div className="echo-buff">
                <div className="echo-buff-header">
                    <div className="echo-buff-name">Solo Concert</div>
                </div>
                <div className="echo-buff-effect">
                    When <span className="highlight">Ciaccona</span> or <span className="highlight">Ensemble Sylph</span> performs <span className="highlight">Solo Concert</span>, they give <span className="highlight">24%</span> <span style={{ color: attributeColors['aero'], fontWeight: 'bold' }}>Aero DMG Bonus</span> to all nearby Resonators in the team. This effect is not stackable.
                </div>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.concert || false}
                        onChange={() => toggleState('concert')}
                    />
                    Enable
                </label>
            </div>

            <div className="echo-buff">
                <div className="echo-buff-header">
                    <div className="echo-buff-name">S2: Song of the Four Seasons</div>
                </div>
                <div className="echo-buff-effect">
                    During Resonance Liberation <span className="highlight">Singer's Triple Cadenza</span>, Resonators in the team gain <span className="highlight">40%</span> <span style={{ color: attributeColors['aero'], fontWeight: 'bold' }}>Aero DMG Bonus</span>.
                </div>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.s2 || false}
                        onChange={() => toggleState('s2')}
                    />
                    Enable
                </label>
            </div>
        </div>
    );
}