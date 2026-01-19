import {formatDescription} from "@/utils/formatDescription.js";
import React, {useEffect} from 'react';
import DropdownSelect from '@/components/common/DropdownSelect.jsx';
import {attributeColors} from "@/utils/attributeHelpers.js";
import {highlightKeywordsInText} from "@/constants/echoSetData.jsx";

export default function MornyeUI({ activeStates, toggleState, setCharacterRuntimeStates, charId }) {
    return (
        <div className="status-toggles">
            <div className="status-toggle-box">
                <h4 className={'highlight'} style={{ fontSize: '18px'}}>Interfered Marker</h4>
                <div>
                    <p>
                        Targets with <span className="highlight">Interfered Marker</span> take increased damage from all nearby Resonators in the team. For every <span className="highlight">1%</span> of <span className="highlight">Mornye</span>’s Energy Regen exceeding <span className="highlight">100%</span>, her damage increases by <span className="highlight">0.25%</span>, up to <span className="highlight">40%</span>.
                    </p>
                    <label className="modern-checkbox">
                        <input
                            type="checkbox"
                            checked={activeStates.interferedMarker || false}
                            onChange={() => toggleState('interferedMarker')}
                        />
                        Enable
                    </label>
                </div>
            </div>

            <div className="status-toggle-box">
                <h4 className={'highlight'} style={{ fontSize: '18px'}}>Outro Skill: Recursion</h4>
                <div>
                    <p>
                        All Resonators in the team gain <span className="highlight">25%</span> All DMG Amplification for 30s.
                    </p>
                    <label className="modern-checkbox">
                        <input
                            type="checkbox"
                            checked={activeStates.recursion || false}
                            onChange={() => toggleState('recursion')}
                        />
                        Enable
                    </label>
                </div>
            </div>

            <div className="status-toggle-box">
                <h4 className={'highlight'} style={{ fontSize: '18px'}}>Decoupling</h4>
                <div>
                    <p>
                        Responding to Tune Strain - Interfered: Each stack of Tune Strain - Interfered on the target increases <span className="highlight">Mornye</span>'s total DMG against them. Every point of <span className="highlight">Mornye</span>'s Tune Break Boost increases the total DMG by <span className="highlight">0.12%</span>.
                    </p>
                    <label className="modern-checkbox">
                        <input
                            type="checkbox"
                            checked={activeStates.decoupling || false}
                            onChange={() => toggleState('decoupling')}
                        />
                        Enable
                    </label>
                </div>
            </div>
        </div>
    );
}

export function MornyeSequenceToggles({ nodeKey, sequenceToggles, toggleSequence, currentSequenceLevel }) {
    const validKeys = ['2'];
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

export function buffUI({ activeStates, toggleState, setCharacterRuntimeStates, charId }) {
    const updateState = (key, value) => {
        setCharacterRuntimeStates(prev => ({
            ...prev,
            [charId]: {
                ...(prev[charId] ?? {}),
                activeStates: {
                    ...(prev[charId]?.activeStates ?? {}),
                    [key]: value
                }
            }
        }));
    };

    return (
        <div className="echo-buffs">
            <label className="slider-label-with-input">
                Energy Regen:
                <input
                    type="number"
                    value={activeStates.mornyeER ?? 100}
                    min={1}
                    max={260}
                    step={1}
                    onChange={(e) => {
                        const value = Math.min(Math.max(parseFloat(e.target.value) || 100, 100), 260);
                        console.log(value)
                        updateState('mornyeER', value);
                    }}
                    className="character-level-input"
                /> %
            </label>
            <div className="echo-buff">
                <div className="echo-buff-header">
                    <div className="echo-buff-name">Interfered Marker</div>
                </div>
                <div className="echo-buff-effect">
                    Targets with <span className="highlight">Interfered Marker</span> take increased damage from all nearby Resonators in the team. For every <span className="highlight">1%</span> of <span className="highlight">Mornye</span>’s Energy Regen exceeding <span className="highlight">100%</span>, her damage increases by <span className="highlight">0.25%</span>, up to <span className="highlight">40%</span>.
                </div>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.interferedMarker || false}
                        onChange={() => {
                            toggleState('interferedMarker');
                        }}
                    />
                    Enable

                </label>
            </div>
            <div className="echo-buff">
                <div className="echo-buff-header">
                    <div className="echo-buff-name">Outro Skill: Recursion</div>
                </div>
                <div className="echo-buff-effect">
                    All Resonators in the team gain <span className="highlight">25%</span> All DMG Amplification for 30s.
                </div>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.recursion || false}
                        onChange={() => toggleState('recursion')}
                    />
                    Enable
                </label>
            </div>

            <div className="echo-buff">
                <div className="echo-buff-header">
                    <div className="echo-buff-name">S2: The Entropic Morning Star</div>
                </div>
                <div className="echo-buff-effect">
                    All nearby Resonators in the team gain <span className="highlight">Crit. DMG</span> increase against targets with <span className="highlight">Interfered Marker</span>: Every <span className="highlight">1%</span> of <span className="highlight">Mornye</span>'s Energy Regen over <span className="highlight">100%</span> grants <span className="highlight">0.2% Crit. DMG</span> increase, up to <span className="highlight">32%</span>.
                </div>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.entropicMorning || false}
                        onChange={() => toggleState('entropicMorning')}
                    />
                    Enable
                </label>
            </div>
        </div>
    );
}