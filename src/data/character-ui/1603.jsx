import React from "react";
import DropdownSelect from "../../components/utils-ui/DropdownSelect.jsx";

export default function CamellyaUI({ characterRuntimeStates, setCharacterRuntimeStates, charId, activeStates, toggleState }) {
    const crimsonBud = characterRuntimeStates?.[charId]?.activeStates?.crimsonBud ?? 0;

    const handleChange = (newValue) => {
        setCharacterRuntimeStates(prev => ({
            ...prev,
            [charId]: {
                ...(prev[charId] ?? {}),
                activeStates: {
                    ...(prev[charId]?.activeStates ?? {}),
                    crimsonBud: newValue
                }
            }
        }));
    };

    return (
        <div className="status-toggles">
            <div className="status-toggle-box">
                <div className="status-toggle-box-inner">
                    <h4 className={'highlight'} style={{ fontSize: '16px', fontWeight: 'bold' }}>Sweet Dream</h4>
                    <p>
                        Increase the DMG Multiplier of Normal Attack, Basic Attack <span className='highlight'>Vining Waltz</span>,
                        Basic Attack <span className='highlight'>Blazing Waltz</span>, Basic Attack <span className='highlight'>Vining Ronde</span>, Dodge Counter <span className='highlight'>Atonement</span>,
                        Resonance Skill <span className='highlight'>Crimson Blossom</span>, and Resonance Skill <span className='highlight'>Floral Ravage</span> by <span className='highlight'>50%</span>.
                    </p>
                    <label className="modern-checkbox">
                        <input
                            type="checkbox"
                            checked={activeStates.sweetDream ?? false}
                            onChange={() => {
                                const newValue = !(activeStates.sweetDream ?? false);
                                setCharacterRuntimeStates(prev => ({
                                    ...prev,
                                    [charId]: {
                                        ...(prev[charId] ?? {}),
                                        activeStates: {
                                            ...(prev[charId]?.activeStates ?? {}),
                                            sweetDream: newValue,
                                            crimsonBud: newValue ? (prev[charId]?.activeStates?.crimsonBud ?? 0) : 0
                                        }
                                    }
                                }));
                            }}
                        />
                        Enable
                    </label>
                </div>

                <div className="status-toggle-box-inner">
                    <p>
                        Casting <span className='highlight'>Ephemeral</span> consumes all <span className='highlight'>Crimson Buds</span>. Each <span className='highlight'>Crimson Bud</span> consumed
                        additionally increases the DMG Multiplier of <span className='highlight'>Sweet Dream</span> by <span className='highlight'>5%</span>, up to <span className='highlight'>50%</span>.
                    </p>
                    <DropdownSelect
                        label=""
                        options={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
                        value={crimsonBud}
                        onChange={handleChange}
                        width="80px"
                        disabled={!activeStates.sweetDream}
                    />
                </div>
            </div>
        </div>
    );
}

export function camellyaSequenceToggles({ nodeKey, sequenceToggles, toggleSequence, currentSequenceLevel }) {
    if (!['1', '3', '4'].includes(String(nodeKey))) return null;

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

export function buffUI({ activeStates, toggleState, charId, setCharacterRuntimeStates, attributeColors }) {
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
            <div className="echo-buff">
                <div className="echo-buff-header">
                    <div className="echo-buff-name">S4: Roots Set Deep In Eternity</div>
                </div>
                <div className="echo-buff-effect">
                    Casting <span className="highlight">Everblooming</span> gives all team members <span className="highlight">25% Basic Attack DMG Bonus</span> for 30s.
                </div>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.eternity || false}
                        onChange={() => toggleState('eternity')}
                    />
                    Enable
                </label>
            </div>
        </div>
    );
}