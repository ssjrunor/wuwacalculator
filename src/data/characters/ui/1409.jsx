import {formatDescription} from "@shared/utils/formatDescription.js";
import React from "react";
import DropdownSelect from "@/shared/ui/common/DropdownSelect.jsx";
import {attributeColors} from "@shared/utils/attributeHelpers.js";

export default function CartethyiaUI({ activeStates, toggleState }) {
    return (
        <div className="status-toggles">
            <div className="status-toggle-box">
                <h4 className={'highlight'} style={{ fontSize: '16px', fontWeight: 'bold' }}>Mandate of Divinity</h4>
                <ul style={{ paddingLeft: '20px' }}>
                    <li>When <span className='highlight'>Fleurdelys</span> has <span className='highlight'>Mandate of Divinity</span>, <span style={{ color: attributeColors['aero'], fontWeight: 'bold' }}>Aero Erosion</span>'s DMG is Amplified by <span className='highlight'>50%</span></li>
                </ul>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.divinity || false}
                        onChange={() => toggleState('divinity')}
                    />
                    Enable
                </label>
            </div>
        </div>
    );
}

export function cartethyiaSequenceToggles({
                                        nodeKey,
                                        sequenceToggles,
                                        toggleSequence,
                                        currentSequenceLevel,
                                        setCharacterRuntimeStates,
                                        charId
                                    }) {
    const validKeys = ['1', '4'];
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
                options={[0, 30, 60, 90, 120]}
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

export function buffUI({ activeStates, toggleState, attributeColors }) {
    return (
        <div className="echo-buffs">
            <div className="echo-buff">
                <div className="echo-buff-header">
                    <div className="echo-buff-name">Outro Skill: Wind's Divine Blessing</div>
                </div>
                <div className="echo-buff-effect">
                    <span style={{ color: attributeColors['aero'], fontWeight: 'bold' }}>Aero DMG</span> dealt by the active Resonator in the team other than <span className="highlight">Cartethyia</span>/<span className="highlight">Fleurdelys</span> to targets with <span className="highlight">Negative Statuses</span> is Amplified by <span className="highlight">17.5%</span> for 20s.
                </div>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.blessing || false}
                        onChange={() => toggleState('blessing')}
                    />
                    Enable
                </label>
            </div>

            <div className="echo-buff">
                <div className="echo-buff-header">
                    <div className="echo-buff-name">Inherent Skill: A Heart's Truest Wishes</div>
                </div>
                <div className="echo-buff-effect">
                    When <span className="highlight">Cartethyia</span>'s <span className="highlight">Outro Skill</span> is triggered, the healing received by all Resonators other than <span className="highlight">Cartethyia</span>/<span className="highlight">Fleurdelys</span> in the team is increased by <span className="highlight">20%</span>. If <span className="highlight">Rover</span> is in the team, <span className="highlight">Rover</span>'s resistance to interruption is increased.
                </div>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.wishes || false}
                        onChange={() => toggleState('wishes')}
                    />
                    Enable
                </label>
            </div>

            <div className="echo-buff">
                <div className="echo-buff-header">
                    <div className="echo-buff-name">S4: Sacrifice Made for Salvation</div>
                </div>
                <div className="echo-buff-effect">
                    When <span className="highlight">Cartethyia</span>'s <span className="highlight">Outro Skill</span> is triggered, the healing received by all Resonators other than <span className="highlight">Cartethyia</span>/<span className="highlight">Fleurdelys</span> in the team is increased by <span className="highlight">20%</span>. If <span className="highlight">Rover</span> is in the team, <span className="highlight">Rover</span>'s resistance to interruption is increased.
                    When Resonators in the team inflict
                    <span style={{ color: attributeColors['havoc'], fontWeight: 'bold' }}>Havoc Bane</span>,
                    <span style={{ color: attributeColors['fusion'], fontWeight: 'bold' }}> Fusion Burst</span>,
                    <span style={{ color: attributeColors['spectro'], fontWeight: 'bold' }}>Spectro Frazzle</span>,
                    <span style={{ color: attributeColors['electro'], fontWeight: 'bold' }}>Electro Flare</span>,
                    <span style={{ color: attributeColors['glacio'], fontWeight: 'bold' }}>Glacio Chafe</span> and
                    <span style={{ color: attributeColors['aero'], fontWeight: 'bold' }}>Aero Erosion</span>, all Resonators in the team gain <span className="highlight">20%</span> DMG Bonus for all Attributes for 20s.

                </div>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.sacrifice || false}
                        onChange={() => toggleState('sacrifice')}
                    />
                    Enable
                </label>
            </div>
        </div>
    );
}