import React from "react";

export default function CarlottaUI({ activeStates, toggleState }) {
    return (
        <div className="status-toggle-box">
            <div
                className="status-toggle-box-inner"
            >
                <h4 className={'highlight'} style={{ fontSize: '16px', fontWeight: 'bold' }}>Deconstruction</h4>
                <ul style={{ paddingLeft: '20px' }}>
                    <li>Dealing DMG to targets inflicted with <span className='highlight'>Deconstruction</span> ignores <span className='highlight'>18%</span> of their DEF.</li>
                </ul>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.deconstruction || false}
                        onChange={() => toggleState('deconstruction')}
                    />
                    Enable
                </label>
            </div>

            <div
                className="status-toggle-box-inner"
            >
                <h4 className={'highlight'} style={{ fontSize: '16px', fontWeight: 'bold' }}>Final Blow</h4>
                <ul style={{ paddingLeft: '20px' }}>
                    <li>
                        Increase the DMG Multiplier of Resonance Liberation <span className='highlight'>Era of New Wave</span>,
                        Resonance Liberation <span className='highlight'>Death Knell</span>, and Resonance Liberation <span className='highlight'>Fatal Finale</span> by <span className='highlight'>80%</span>.
                    </li>
                </ul>
                <label className="modern-checkbox" onClick={(e) => e.stopPropagation()}>
                    <input
                        type="checkbox"
                        checked={activeStates.finalBlow || false}
                        onChange={() => toggleState('finalBlow')}
                    />
                    Enable
                </label>
            </div>
        </div>
    );
}


export function CarolottaSequenceToggles({ nodeKey, sequenceToggles, toggleSequence, currentSequenceLevel }) {
    const validKeys = ['1', '4'];
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

export function buffUI({ activeStates, toggleState}) {
    return (
        <div className="echo-buffs">
            <div className="echo-buff">
                <div className="echo-buff-header">
                    <div className="echo-buff-name">S4: Yesterday's Raindrops Make Finest Wine</div>
                </div>
                <div className="echo-buff-effect">
                    Casting <span className="highlight">Heavy Attack</span>, Heavy Attack <span className="highlight">Containment Tactics</span>, and Heavy Attack <span className="highlight">Imminent Oblivion</span> grants all Resonators in the team <span className="highlight">25% Resonance Skill DMG Bonus</span> for 30s.
                </div>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.raindrops || false}
                        onChange={() => toggleState('raindrops')}
                    />
                    Enable
                </label>
            </div>
        </div>
    );
}