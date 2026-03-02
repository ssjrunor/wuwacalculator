import {formatDescription} from "@shared/utils/formatDescription.js";
import React from 'react';
import {highlightKeywordsInText} from "@shared/constants/echoSetData.jsx";

export default function ChixiaUI() {
    const hasToggles = false;
    if (!hasToggles) return null;
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

    const skills = Object.values(character?.raw?.SkillTrees ?? {}).filter(
        node => node.Skill?.Type === "Inherent Skill"
    );

    return (
        <div className="inherent-skills">
            <h4 style={{ fontSize: '20px', marginBottom: '8px' }}>Inherent Skills</h4>

            {skills.map((node, index) => {
                const name = node.Skill?.Name ?? '';
                const lowerName = name.toLowerCase();
                const isThermobaric = lowerName.includes("numbingly spicy");
                const isScorching = lowerName.includes("scorching magazine");

                const unlockLevel = isScorching ? 50 : isThermobaric ? 70 : 1;
                const locked = charLevel < unlockLevel;

                if (isThermobaric && locked && activeStates.inherent2 > 0) {
                    setCharacterRuntimeStates(prev => ({
                        ...prev,
                        [charId]: {
                            ...(prev[charId] ?? {}),
                            activeStates: {
                                ...(prev[charId]?.activeStates ?? {}),
                                inherent2: 0
                            }
                        }
                    }));
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

                        {isThermobaric && (
                            <div className="slider-label-with-input"
                                 style={{
                                     marginTop: '8px',
                                     opacity: locked ? 0.5 : 1,
                                     cursor: !locked ? 'auto' : 'not-allowed'
                                 }}
                            >
                                Thermobaric Bullets
                                <input
                                    type="number"
                                    className="character-level-input"
                                    min="0"
                                    max="60"
                                    style={{cursor: !locked ? 'auto' : 'not-allowed'}}
                                    disabled={locked}
                                    value={activeStates.inherent2 ?? 0}
                                    onChange={(e) => {
                                        const val = Math.max(0, Math.min(60, Number(e.target.value) || 0));
                                        setCharacterRuntimeStates(prev => ({
                                            ...prev,
                                            [charId]: {
                                                ...(prev[charId] ?? {}),
                                                activeStates: {
                                                    ...(prev[charId]?.activeStates ?? {}),
                                                    inherent2: val
                                                }
                                            }
                                        }));
                                    }}
                                />
                                {locked && (
                                    <span style={{ marginLeft: '8px', fontSize: '12px', color: 'gray' }}>
                                        (Unlocks at Lv. {unlockLevel})
                                    </span>
                                )}
                            </div>
                        )}

                        {isScorching && locked && (
                            <div style={{ marginTop: '8px', fontSize: '12px', color: 'gray' }}>
                                (Unlocks at Lv. {unlockLevel})
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export function chixiaSequenceToggles({ nodeKey, sequenceToggles, toggleSequence, currentSequenceLevel }) {
    if (!['3', '6'].includes(String(nodeKey))) return null;

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
                    <div className="echo-buff-name">S6: Easter Egg Performance</div>
                </div>
                <div className="echo-buff-effect">
                    Resonance Skill <span className="highlight">Boom Boom</span> increases the <span className="highlight">Basic Attack DMG Bonus</span> of all team members by <span className="highlight">25%</span> for 15s.
                </div>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.easter || false}
                        onChange={() => toggleState('easter')}
                    />
                    Enable
                </label>
            </div>
        </div>
    );
}