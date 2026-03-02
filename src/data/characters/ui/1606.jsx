import React from "react";
import {formatDescription} from "@shared/utils/formatDescription.js";
import DropdownSelect from "@/shared/ui/common/DropdownSelect.jsx";
import {highlightKeywordsInText} from "@shared/constants/echoSetData.jsx";

export default function RocciaUI({ activeStates, toggleState }) {
    return (
        <div className="status-toggles">
            <div className="status-toggle-box">
                <h4 className={'highlight'} style={{ fontSize: '18px', fontWeight: 'bold' }}>Commedia Improvviso!</h4>
                <p>For every <span className='highlight'>0.1%</span> of <span className='highlight'>Roccia</span>'s Crit. Rate over <span className='highlight'>50%</span>, this skill increases the ATK of all Resonators in the team by <span className='highlight'>1</span> point for 30s, up to <span className='highlight'>200</span> points.</p>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.commedia || false}
                        onChange={() => {
                            toggleState('commedia');
                        }}
                    />
                    Enable
                </label>
            </div>
        </div>
    );
}

export function CustomInherentSkills({
                                         character,
                                         currentSliderColor,
                                         characterRuntimeStates,
                                         setCharacterRuntimeStates,
    keywords
                                     }) {
    const charId = character?.Id ?? character?.id ?? character?.link;
    const activeStates = characterRuntimeStates?.[charId]?.activeStates ?? {};
    const charLevel = characterRuntimeStates?.[charId]?.CharacterLevel ?? 1;

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

    const skills = Object.values(character?.raw?.SkillTrees ?? {}).filter(
        node => node.Skill?.Type === "Inherent Skill"
    );

    return (
        <div className="inherent-skills">
            <h4 style={{ fontSize: '20px', marginBottom: '8px' }}>Inherent Skills</h4>

            {skills.map((node, index) => {
                const name = node.Skill?.Name ?? '';
                const lowerName = name.toLowerCase();

                const immersive = lowerName.includes("immersive performance");
                const unlockLevel = immersive ? 50 : 70;
                const locked = charLevel < unlockLevel;

                if (locked) {
                    if (immersive && activeStates.inherent2) updateState('inherent1', false);
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

                        {immersive && (
                            <label className="modern-checkbox">
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
                        {!immersive && locked && (
                            <span style={{ fontSize: '12px', color: 'gray' }}>
                                (Unlocks at Lv. {unlockLevel})
                            </span>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export function rocciaSequenceToggles({
                                        nodeKey,
                                        sequenceToggles,
                                        toggleSequence,
                                        currentSequenceLevel,
                                        setCharacterRuntimeStates,
                                        charId
                                    }) {
    const validKeys = ['2', '3', '4', '6'];
    if (!validKeys.includes(String(nodeKey))) return null;

    const requiredLevel = Number(nodeKey);
    const isDisabled = currentSequenceLevel < requiredLevel;

    if (String(nodeKey) === '2') {
        const value = sequenceToggles['2_value'] ?? 0;

        const handleChange = (newValue) => {
            setCharacterRuntimeStates(prev => ({
                ...prev,
                [charId]: {
                    ...(prev[charId] ?? {}),
                    sequenceToggles: {
                        ...(prev[charId]?.sequenceToggles ?? {}),
                        ['2_value']: newValue
                    }
                }
            }));
        };

        return (
            <DropdownSelect
                label=""
                options={[0, 1, 2, 3]}
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
            <label className="slider-label-with-input">
                Crit. Rate:
                <input
                    type="number"
                    value={activeStates.commediaCr ?? 5}
                    min={5}
                    max={999}
                    step={1}
                    onChange={(e) => {
                        const value = parseFloat(e.target.value) || 5;
                        updateState('commediaCr', value);
                    }}
                    className="character-level-input"
                /> %
            </label>
            <div className="echo-buff">
                <div className="echo-buff-header">
                    <div className="echo-buff-name">Commedia Improvviso!</div>
                </div>
                <div className="echo-buff-effect">
                    For every <span className="highlight">0.1%</span> of <span className="highlight">Roccia's Crit. Rate</span> over <span className="highlight">50%</span>, <span className="highlight">Commedia Improvviso!</span> increases the ATK of all Resonators in the team by <span className="highlight">1</span> for 30s, up to <span className="highlight">200</span> points.
                </div>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.commedia || false}
                        onChange={() => toggleState('commedia')}
                    />
                    Enable
                </label>
            </div>
            <div className="echo-buff">
                <div className="echo-buff-header">
                    <div className="echo-buff-name">Outro Skill: Applause, Please! T-T</div>
                </div>
                <div className="echo-buff-effect">
                    The incoming Resonator has their <span style={{ color: attributeColors['havoc'], fontWeight: 'bold' }}>Havoc DMG</span> Amplified by <span className="highlight">20%</span> and <span className="highlight">Basic Attack DMG</span> Amplified by <span className="highlight">25%</span> for 14s or until the Resonator is switched out.
                </div>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.applause || false}
                        onChange={() => toggleState('applause')}
                    />
                    Enable
                </label>
            </div>

            <div className="echo-buff">
                <div className="echo-buff-header">
                    <div className="echo-buff-name">S2: When the Luceanite Gleams</div>
                </div>
                <div className="echo-buff-effect">
                    Casting Basic Attack <span className="highlight">Real Fantasy</span> grants all Resonators in the team <span className="highlight">10%</span> <span style={{ color: attributeColors['havoc'], fontWeight: 'bold' }}>Havoc DMG Bonus</span> for 30s, stacking up to 3 times. Upon reaching the max stacks, it grants all Resonators in the team <span className="highlight">10%</span> additional <span style={{ color: attributeColors['havoc'], fontWeight: 'bold' }}>Havoc DMG Bonus</span> for 30s.
                </div>
                <DropdownSelect
                    label="Stacks"
                    options={[0, 1, 2, 3]}
                    value={activeStates.luceanite ?? 0}
                    onChange={(value) => updateState('luceanite', value)}
                    width="80px"
                />
            </div>
        </div>
    );
}