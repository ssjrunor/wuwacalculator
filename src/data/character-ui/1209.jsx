import {formatDescription} from "../../utils/formatDescription.js";
import React, {useEffect} from 'react';
import DropdownSelect from '../../components/utils-ui/DropdownSelect.jsx';
import {attributeColors} from "../../utils/attributeHelpers.js";
import {highlightKeywordsInText} from "../../constants/echoSetData.jsx";

export default function MornyeUI({ activeStates, toggleState }) {
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
                    队伍中所有角色全伤害加深25%，持续30秒。
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
                    Resonators to targets with <span className="highlight">Interfered Marker</span> gains increased <span className="highlight">Crit. Rate</span>. For every <span className="highlight">1%</span> of <span className="highlight">Mornye</span>’s Energy Regen exceeding <span className="highlight">100%</span>, she gains <span className="highlight">0.1875% Crit. Rate</span>, up to <span className="highlight">30%</span>.
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