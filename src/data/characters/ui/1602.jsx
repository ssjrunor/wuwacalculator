import React from "react";
import DropdownSelect from "@/components/common/DropdownSelect.jsx";
import {formatDescription} from "@/utils/formatDescription.js";
import {highlightKeywordsInText} from "@/constants/echoSetData.jsx";

export default function DanjinUI({ activeStates, toggleState }) {
    return (
        <div className="status-toggles">
            <div className="status-toggle-box">
                <div className="status-toggle-box-inner">
                    <h4 className={'highlight'} style={{ fontSize: '16px', fontWeight: 'bold' }}>Incinerating Will</h4>
                    <ul style={{ paddingLeft: '20px' }}>
                        <p><span className='highlight'>Danjin</span>'s damage dealt to targets marked with <span className='highlight'>Incinerating Will</span> is increased by <span className='highlight'>20%</span>.</p>
                    </ul>
                    <label className="modern-checkbox">
                        <input
                            type="checkbox"
                            checked={activeStates.incinerating || false}
                            onChange={() => toggleState('incinerating')}
                        />
                        Enable
                    </label>
                </div>
            </div>
        </div>
    );
}

export function CustomInherentSkills({
                                         character,
                                         currentSliderColor,
                                         characterRuntimeStates,
                                         setCharacterRuntimeStates,
                                         unlockLevels = [],
                                         charLevel = 1,
    keywords
                                     }) {
    const charId = character?.Id ?? character?.id ?? character?.link;
    const activeStates = characterRuntimeStates?.[charId]?.activeStates ?? {};

    const toggleState = (key) => {
        setCharacterRuntimeStates(prev => ({
            ...prev,
            [charId]: {
                ...(prev[charId] ?? {}),
                activeStates: {
                    ...(prev[charId]?.activeStates ?? {}),
                    [key]: !(prev[charId]?.activeStates?.[key] ?? false)
                }
            }
        }));
    };

    const skills = Object.values(character?.raw?.SkillTrees ?? {}).filter(
        node => node.Skill?.Type === "Inherent Skill"
    );

    return (
        <div className="inherent-skills">
            <h4 style={{ fontSize: '20px', marginBottom: '8px' }}>Inherent Skills</h4>

            {skills.map((node, index) => {
                const name = node.Skill?.Name ?? '';
                const lowerName = name.toLowerCase();
                const crimson = lowerName.includes("crimson light");
                const overflow = lowerName.includes("overflow");

                const unlockLevel = unlockLevels[index] ?? 1;
                const locked = charLevel < unlockLevel;

                if (locked) {
                    if (crimson && activeStates.inherent1) {
                        toggleState('inherent1');
                    }
                    if (overflow && activeStates.inherent2) {
                        toggleState('inherent2');
                    }
                }

                return (
                    <div key={index} className="inherent-skill">
                        <h4 className={'highlight'} style={{ fontSize: '16px', fontWeight: 'bold' }}>{name}</h4>
                        <p>
                            {highlightKeywordsInText(formatDescription(
                                node.Skill.Desc,
                                node.Skill.Param,
                                currentSliderColor
                            ), keywords)}
                        </p>

                        {crimson && (
                            <label className="modern-checkbox"
                                   style={{
                                       opacity: locked ? 0.5 : 1,
                                       cursor: !locked ? 'pointer' : 'not-allowed'
                                   }}>
                                <input
                                    type="checkbox"
                                    checked={activeStates.inherent1 ?? false}
                                    onChange={() => !locked && toggleState('inherent1')}
                                    disabled={locked}
                                />
                                Enable
                                {locked && (
                                    <span style={{ marginLeft: '8px', fontSize: '12px', color: 'gray' }}>
                            (Unlocks at Lv. {unlockLevel})
                        </span>
                                )}
                            </label>
                        )}

                        {overflow && (
                            <label className="modern-checkbox"
                                   style={{
                                       opacity: locked ? 0.5 : 1,
                                       cursor: !locked ? 'pointer' : 'not-allowed'
                                   }}>
                                <input
                                    type="checkbox"
                                    checked={activeStates.inherent2 ?? false}
                                    onChange={() => !locked && toggleState('inherent2')}
                                    disabled={locked}
                                />
                                Enable
                                {locked && (
                                    <span style={{ marginLeft: '8px', fontSize: '12px', color: 'gray' }}>
                            (Unlocks at Lv. {unlockLevel})
                        </span>
                                )}
                            </label>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export function danjinSequenceToggles({
                                        nodeKey,
                                        sequenceToggles,
                                        toggleSequence,
                                        currentSequenceLevel,
                                        setCharacterRuntimeStates,
                                        charId
                                    }) {
    const validKeys = ['1', '2', '4', '5', '6'];
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
                options={[0, 1, 2, 3, 4, 5, 6]}
                value={value}
                onChange={handleChange}
                disabled={isDisabled}
                className="sequence-dropdown"
                width="80px"
            />
        );
    } else if (String(nodeKey) === '5') {
        return (
            <label className="modern-checkbox" style={{ opacity: isDisabled ? 0.5 : 1 }}>
                <input
                    type="checkbox"
                    checked={sequenceToggles[nodeKey] || false}
                    onChange={() => toggleSequence(nodeKey)}
                    disabled={isDisabled}
                />
                HP lower than 60%?
            </label>
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
                    <div className="echo-buff-name">Outro Skill: Duality</div>
                </div>
                <div className="echo-buff-effect">
                    The incoming Resonator has their <span style={{ color: attributeColors['havoc'], fontWeight: 'bold' }}>Havoc DMG</span> Amplified by <span className="highlight">23%</span> for 14s or until they are switched out.
                </div>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.dDuality || false}
                        onChange={() => toggleState('dDuality')}
                    />
                    Enable
                </label>
            </div>

            <div className="echo-buff">
                <div className="echo-buff-header">
                    <div className="echo-buff-name">S6: Bloodied Jade</div>
                </div>
                <div className="echo-buff-effect">
                    Heavy Attack <span className="highlight">Chaoscleave</span> increases the ATK of all team members by <span className="highlight">20%</span> for 20s.
                </div>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.bloodied || false}
                        onChange={() => toggleState('bloodied')}
                    />
                    Enable
                </label>
            </div>
        </div>
    );
}