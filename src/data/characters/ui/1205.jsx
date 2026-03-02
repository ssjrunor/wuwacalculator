import {formatDescription} from "@shared/utils/formatDescription.js";
import DropdownSelect from "@/shared/ui/common/DropdownSelect.jsx";
import React from "react";
import {highlightKeywordsInText} from "@shared/constants/echoSetData.jsx";

export default function ChangliUI() {
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
    const charLevel = characterRuntimeStates?.[charId]?.CharacterLevel ?? 1;
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

    const unlockLevels = [50, 70];

    return (
        <div className="inherent-skills">
            <h4 style={{ fontSize: '20px', marginBottom: '8px' }}>Inherent Skills</h4>

            {skills.map((node, index) => {
                const name = node.Skill?.Name ?? '';
                const lowerName = name.toLowerCase();
                const isStrategist = lowerName.includes("secret strategist");
                const isSweeping = lowerName.includes("sweeping force");

                const unlockLevel = unlockLevels[index] ?? 1;
                const locked = charLevel < unlockLevel;

                if (locked) {
                    if (isSweeping && activeStates.inherent2) updateState('inherent2', false);
                    if (isStrategist && (activeStates.inherent1 ?? 0) > 0) updateState('inherent1', 0);
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

                        {isStrategist && (
                            <div
                                className="slider-label-with-input"
                                style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px', opacity: locked ? 0.5 : 1,
                                    cursor: !locked ? 'pointer' : 'not-allowed' }}

                            >
                                <DropdownSelect
                                    label=""
                                    options={[0, 1, 2, 3, 4]}
                                    value={activeStates.inherent1 ?? 0}
                                    onChange={(newValue) => updateState('inherent1', newValue)}
                                    width="80px"
                                    disabled={locked}
                                />
                                {locked && (
                                    <span style={{ fontSize: '12px', color: 'gray' }}>
                                        (Unlocks at Lv. {unlockLevel})
                                    </span>
                                )}
                            </div>
                        )}

                        {isSweeping && (
                            <label className="modern-checkbox"
                                   style={{
                                       opacity: locked ? 0.5 : 1,
                                       cursor: !locked ? 'pointer' : 'not-allowed'
                                   }}
                            >
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

export function changliSequenceToggles({ nodeKey, sequenceToggles, toggleSequence, currentSequenceLevel }) {
    if (!['1', '2', '4'].includes(String(nodeKey))) return null;

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
                    <div className="echo-buff-name">Outro Skill: Strategy of Duality</div>
                </div>
                <div className="echo-buff-effect">
                    The incoming Resonator has their <span style={{ color: attributeColors['fusion'], fontWeight: 'bold' }}>Fusion DMG</span> Amplified by <span className="highlight">20%</span> and <span className="highlight">Resonance Liberation DMG</span> Amplified by <span className="highlight">25%</span> for <span className="highlight">10s</span> or until the Resonator is switched out.
                </div>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.duality || false}
                        onChange={() => toggleState('duality')}
                    />
                    Enable
                </label>
            </div>

            <div className="echo-buff">
                <div className="echo-buff-header">
                    <div className="echo-buff-name">S4: Polished Words</div>
                </div>
                <div className="echo-buff-effect">
                    After <span className="highlight">Intro Skill</span> is cast, all team members' ATK is increased by <span className="highlight">20%</span> for <span className="highlight">30s</span>.
                </div>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.polished || false}
                        onChange={() => toggleState('polished')}
                    />
                    Enable
                </label>
            </div>
        </div>
    );
}