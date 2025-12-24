import React from 'react';
import { formatDescription } from "@/utils/formatDescription.js";
import DropdownSelect from '@/components/common/DropdownSelect.jsx';
import {highlightKeywordsInText} from "@/constants/echoSetData.jsx";


export default function SanhuaUI() {
    const hasToggles = false;
    if (!hasToggles) return null;
}

export function CustomInherentSkills({
                                         character,
                                         currentSliderColor,
                                         characterRuntimeStates,
                                         setCharacterRuntimeStates,
                                         unlockLevels = [],
                                         charLevel = 1,
                                         keywords = [],
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
                const isCondensation = lowerName.includes("condensation");
                const isAvalanche = lowerName.includes("avalanche");

                const unlockLevel = unlockLevels[index] ?? 1;
                const locked = charLevel < unlockLevel;

                if (locked) {
                    if (isCondensation && activeStates.inherent1) {
                        toggleState('inherent1');
                    }
                    if (isAvalanche && activeStates.inherent2) {
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

                        {isCondensation && (
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

                        {isAvalanche && (
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

export function SanhuaSequenceToggles({
                                          nodeKey,
                                          sequenceToggles,
                                          toggleSequence,
                                          currentSequenceLevel,
                                          setCharacterRuntimeStates,
                                          charId
                                      }) {
    const validKeys = ['1', '3', '4', '5', '6'];
    if (!validKeys.includes(String(nodeKey))) return null;

    const requiredLevel = Number(nodeKey);
    const isDisabled = currentSequenceLevel < requiredLevel;

    if (String(nodeKey) === '6') {
        const value = sequenceToggles['6_value'] ?? 0;

        const handleChange = (newValue) => {
            setCharacterRuntimeStates(prev => ({
                ...prev,
                [charId]: {
                    ...(prev[charId] ?? {}),
                    sequenceToggles: {
                        ...(prev[charId]?.sequenceToggles ?? {}),
                        ['6_value']: newValue
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

export function buffUI({ activeStates, toggleState, charId, setCharacterRuntimeStates }) {
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
                    <div className="echo-buff-name">Outro Skill: Silversnow</div>
                </div>
                <div className="echo-buff-effect">
                    The incoming Resonator has their <span className="highlight">Basic Attack DMG</span> Amplified by <span className="highlight">38%</span> for <span className="highlight">14s</span> or until they are switched out.

                </div>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.silversnow || false}
                        onChange={() => toggleState('silversnow')}
                    />
                    Enable
                </label>
            </div>

            <div className="echo-buff">
                <div className="echo-buff-header">
                    <div className="echo-buff-name">S6: Daybreak Radiance</div>
                </div>
                <div className="echo-buff-effect">
                    After an <span className="highlight">Ice Prism</span> or a <span className="highlight">Glacier</span> is detonated, all team members' ATK is increased by <span className="highlight">10%</span> for <span className="highlight">20s</span>, stacking up to <span className="highlight">2</span> times.
                </div>
                <DropdownSelect
                    label="Stacks"
                    options={[0, 1, 2]}
                    value={activeStates.daybreak ?? 0}
                    onChange={(value) => updateState('daybreak', value)}
                    width="80px"
                />
            </div>
        </div>
    );
}