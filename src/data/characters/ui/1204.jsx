import React from "react";
import {formatDescription} from "@shared/utils/formatDescription.js";
import {highlightKeywordsInText} from "@shared/constants/echoSetData.jsx";

export default function MortefiUI() {
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
                const lower = name.toLowerCase();
                const isHarmonic = lower.includes("harmonic control");
                const isRhythmic = lower.includes("rhythmic vibrato");

                const lockLevel = isHarmonic ? 50 : isRhythmic ? 70 : 1;
                const locked = charLevel < lockLevel;

                if (isHarmonic && locked && activeStates.inherent1) {
                    setCharacterRuntimeStates(prev => ({
                        ...prev,
                        [charId]: {
                            ...(prev[charId] ?? {}),
                            activeStates: {
                                ...(prev[charId]?.activeStates ?? {}),
                                inherent1: false
                            }
                        }
                    }));
                }

                if (isRhythmic && locked && activeStates.inherent2 > 0) {
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

                        {isHarmonic && (
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
                                        (Unlocks at Lv. {lockLevel})
                                    </span>
                                )}
                            </label>
                        )}

                        {isRhythmic && (
                            <div
                                className="slider-label-with-input"
                                style={{
                                    marginTop: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    opacity: locked ? 0.5 : 1,
                                    cursor: !locked ? 'auto' : 'not-allowed'
                                }}

                            >
                                Rhythmic Vibrato
                                <input
                                    type="number"
                                    className="character-level-input"
                                    min="0"
                                    max="50"
                                    disabled={locked}
                                    value={activeStates.inherent2 ?? 0}
                                    onChange={(e) => {
                                        const val = Math.max(0, Math.min(50, Number(e.target.value) || 0));
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
                                    style={{
                                        cursor: !locked ? 'auto' : 'not-allowed'
                                    }}
                                />
                                {locked && (
                                    <span style={{ fontSize: '12px', color: 'gray' }}>
                                        (Unlocks at Lv. {lockLevel})
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export function mortefiSequenceToggles({ nodeKey, sequenceToggles, toggleSequence, currentSequenceLevel }) {
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
                    <div className="echo-buff-name">Outro Skill: Rage Transposition</div>
                </div>
                <div className="echo-buff-effect">
                    The incoming Resonator gains <span className="highlight">38% Heavy Attack DMG</span> Amplification for <span className="highlight">14s</span> or until they are switched out.
                </div>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.transposition || false}
                        onChange={() => toggleState('transposition')}
                    />
                    Enable
                </label>
            </div>

            <div className="echo-buff">
                <div className="echo-buff-header">
                    <div className="echo-buff-name">S6: Apoplectic Instrumental</div>
                </div>
                <div className="echo-buff-effect">
                    When Resonance Liberation <span className="highlight">Violent Finale</span> is cast, ATK of all team members is increased by <span className="highlight">20%</span> for <span className="highlight">20s</span>.
                </div>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.apoplectic || false}
                        onChange={() => toggleState('apoplectic')}
                    />
                    Enable
                </label>
            </div>
        </div>
    );
}