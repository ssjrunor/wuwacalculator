import DropdownSelect from "@/components/common/DropdownSelect.jsx";
import React from "react";

export default function JinhsiUI({ characterRuntimeStates, setCharacterRuntimeStates, charId }) {
    const activeStates = characterRuntimeStates?.[charId]?.activeStates ?? {};

    return (
        <div className="status-toggles">
            <div className="status-toggle-box">
                <h4 className={'highlight'} style={{ fontSize: '18px', fontWeight: 'bold' }}>Incandescence</h4>
                <div>
                    <p>Consume up to 50 <span className='highlight'>Incandescence</span>, with each point of <span className='highlight'>Incandescence</span> granting bonus DMG Multiplier percentage to <span className='highlight'>Stella Glamor</span></p>
                </div>
                <input
                    type="number"
                    className="character-level-input"
                    min="0"
                    max="50"
                    value={activeStates.incandescence ?? 0}
                    onChange={(e) => {
                        const val = Math.max(0, Math.min(50, Number(e.target.value) || 0));
                        setCharacterRuntimeStates(prev => ({
                            ...prev,
                            [charId]: {
                                ...(prev[charId] ?? {}),
                                activeStates: {
                                    ...(prev[charId]?.activeStates ?? {}),
                                    incandescence: val
                                }
                            }
                        }));
                    }}
                />
            </div>
        </div>
    );
}

export function jinhsiSequenceToggles({
                                        nodeKey,
                                        sequenceToggles,
                                        toggleSequence,
                                        currentSequenceLevel,
                                        setCharacterRuntimeStates,
                                        charId
                                    }) {
    const validKeys = ['1', '3', '4'];
    if (!validKeys.includes(String(nodeKey))) return null;

    const requiredLevel = Number(nodeKey);
    const isDisabled = currentSequenceLevel < requiredLevel;

    if (String(nodeKey) === '1') {
        const value = sequenceToggles['1_value'] ?? 0;

        const handleChange = (newValue) => {
            setCharacterRuntimeStates(prev => ({
                ...prev,
                [charId]: {
                    ...(prev[charId] ?? {}),
                    sequenceToggles: {
                        ...(prev[charId]?.sequenceToggles ?? {}),
                        ['1_value']: newValue
                    }
                }
            }));
        };

        return (
            <DropdownSelect
                label=""
                options={[0, 1, 2, 3, 4]}
                value={value}
                onChange={handleChange}
                disabled={isDisabled}
                className="sequence-dropdown"
                width="80px"
            />
        );
    } else if (String(nodeKey) === '3') {
        const value = sequenceToggles['3_value'] ?? 0;

        const handleChange = (newValue) => {
            setCharacterRuntimeStates(prev => ({
                ...prev,
                [charId]: {
                    ...(prev[charId] ?? {}),
                    sequenceToggles: {
                        ...(prev[charId]?.sequenceToggles ?? {}),
                        ['3_value']: newValue
                    }
                }
            }));
        };

        return (
            <DropdownSelect
                label=""
                options={[0, 1, 2]}
                value={value}
                onChange={handleChange}
                disabled={isDisabled}
                className="sequence-dropdown"
                width="80px"
            />
        );
    }

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
                    <div className="echo-buff-name">S4: Benevolent Grace</div>
                </div>
                <div className="echo-buff-effect">
                    When <span className="highlight">Jinhsi</span> casts Resonance Liberation <span className="highlight">Purge of Light</span> or Resonance Skill<span className="highlight"> Illuminous Epiphany</span>, all nearby Resonators on the team gain <span className="highlight">20% Attribute DMG Bonus</span> for 20s.
                </div>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.benevolent || false}
                        onChange={() => toggleState('benevolent')}
                    />
                    Enable
                </label>
            </div>
        </div>
    );
}