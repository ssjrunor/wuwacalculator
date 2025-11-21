import React, {useEffect} from "react";
import {formatDescription} from "../../utils/formatDescription.js";
import DropdownSelect from "../../components/utils-ui/DropdownSelect.jsx";
import {highlightKeywordsInText} from "../../constants/echoSetData.jsx";
import {attributeColors} from "../../utils/attributeHelpers.js";

export default function IunoUI({ setCharacterRuntimeStates, charId, activeStates }) {
    return (
        <div className="status-toggle-box">
            <div
                className="status-toggle-box-inner"
            >
                <h4 className={'highlight'} style={{ fontSize: '16px', fontWeight: 'bold' }}>Blessing of the Wan Light</h4>
                <div>
                    <p> The receiving Resonator gains <span className='highlight'>4%</span> DMG Amplification for 10s, stacking up to 10 times.</p>
                </div>
                Stacks
                <input
                    type="number"
                    className="character-level-input"
                    min="0"
                    max="10"
                    value={activeStates.wanLight ?? 0}
                    onChange={(e) => {
                        const val = Math.max(0, Math.min(10, Number(e.target.value) || 0));
                        setCharacterRuntimeStates(prev => ({
                            ...prev,
                            [charId]: {
                                ...(prev[charId] ?? {}),
                                activeStates: {
                                    ...(prev[charId]?.activeStates ?? {}),
                                    wanLight: val
                                }
                            }
                        }));
                    }}
                />
            </div>
        </div>
    );
}

export function IunoSequenceToggles({ nodeKey, sequenceToggles, toggleSequence, currentSequenceLevel }) {
    const validKeys = ['1', '3'];
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

export function buffUI({ activeStates, toggleState, charId, setCharacterRuntimeStates }) {
    return (
        <div className="echo-buffs">
            <div className="echo-buff">
                <div className="echo-buff-header">
                    <div className="echo-buff-name">Outro Skill: From Gloom to Gleam</div>
                </div>
                <div className="echo-buff-effect">
                    The incoming Resonator gains <span className='highlight'>50% Heavy Attack DMG</span> Amplification for 14s. This effect ends early if they are switched off the field.
                </div>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.gloomtoGleam || false}
                        onChange={() => toggleState('gloomtoGleam')}
                    />
                    Enable
                </label>
            </div>
            <div className="echo-buff">
                <div className="echo-buff-header">
                    <div className="echo-buff-name">Full Moon Domain</div>
                </div>
                <div className="echo-buff-effect">
                    <p>
                        Resonators inside the domain periodically regain HP and STA.
                        Gaining a Shield inside the domain grants 1 additional stack of <span className='highlight'>Blessing of the Wan Light</span>.
                    </p>
                </div>
                <div className="echo-buff-header">
                    <div className="echo-buff-name">Blessing of the Wan Light</div>
                </div>
                <div className="echo-buff-effect">
                    <p> The receiving Resonator gains <span className='highlight'>4%</span> DMG Amplification for 10s, stacking up to 10 times.</p>
                </div>
                Stacks
                <input
                    type="number"
                    className="character-level-input"
                    min="0"
                    max="10"
                    value={activeStates.wanLight ?? 0}
                    onChange={(e) => {
                        const val = Math.max(0, Math.min(10, Number(e.target.value) || 0));
                        setCharacterRuntimeStates(prev => ({
                            ...prev,
                            [charId]: {
                                ...(prev[charId] ?? {}),
                                activeStates: {
                                    ...(prev[charId]?.activeStates ?? {}),
                                    wanLight: val
                                }
                            }
                        }));
                    }}
                />
            </div>
            <div className="echo-buff">
                <div className="echo-buff-header">
                    <div className="echo-buff-name">S2: Day or Night, Let This Be Eternal</div>
                </div>
                <div className="echo-buff-effect">
                    Resonators in the team with 10 stacks of Blessing of the Wan Light gain an additional <span className='highlight'>40%</span> all DMG Amplification.
                </div>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.iunoS2 || false}
                        onChange={() => toggleState('iunoS2')}
                    />
                    Enable
                </label>
            </div>
        </div>
    );
}