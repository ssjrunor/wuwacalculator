import React from "react";
import {formatDescription} from "@shared/utils/formatDescription.js";
import DropdownSelect from "@/shared/ui/common/DropdownSelect.jsx";
import {highlightKeywordsInText} from "@shared/constants/echoSetData.jsx";

export default function CantUI() {
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

                const poison = lowerName.includes("\"poison\"");
                const unlockLevel = poison ? 70 : 50;
                const locked = charLevel < unlockLevel;

                if (locked) {
                    if (poison && activeStates.inherent2) updateState('inherent2', false);
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

                        {poison && (
                            <div
                                className="slider-label-with-input"
                                style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px',
                                    opacity: locked ? 0.5 : 1,
                                    cursor: !locked ? 'pointer' : 'not-allowed'
                                }}
                            >
                                <DropdownSelect
                                    label=""
                                    options={[0, 1, 2]}
                                    value={activeStates.inherent2 ?? 0}
                                    onChange={(newValue) => updateState('inherent2', newValue)}
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

                        {!poison && locked && (
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

export function cantSequenceToggles({
                                          nodeKey,
                                          sequenceToggles,
                                          toggleSequence,
                                          currentSequenceLevel,
                                      }) {
    const validKeys = ['1', '4', '6'];
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

export function buffUI({ activeStates, toggleState, attributeColors }) {
    return (
        <div className="echo-buffs">
            <div className="echo-buff">
                <div className="echo-buff-header">
                    <div className="echo-buff-name">Outro Skill: Gentle Tentacles</div>
                </div>
                <div className="echo-buff-effect">
                    Amplify the incoming Resonator's <span style={{ color: attributeColors['havoc'], fontWeight: 'bold' }}>Havoc DMG</span> by <span className="highlight">20%</span> and <span className="highlight">Resonance Skill DMG</span> by <span className="highlight">25%</span> for 14s. Switching Resonators ends this effect.
                </div>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.tentacles || false}
                        onChange={() => toggleState('tentacles')}
                    />
                    Enable
                </label>
            </div>
        </div>
    );
}