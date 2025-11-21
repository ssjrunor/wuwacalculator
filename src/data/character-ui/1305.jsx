import React from "react";
import {formatDescription} from "../../utils/formatDescription.js";
import DropdownSelect from "../../components/utils-ui/DropdownSelect.jsx";
import {highlightKeywordsInText} from "../../constants/echoSetData.jsx";

export default function YaoUI() {
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

    let activeStates = { ...(characterRuntimeStates?.[charId]?.activeStates ?? {}) };

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

    const lockedStates = { ...activeStates };
    if (charLevel < 50 && (lockedStates.inherent1 ?? 0) > 0) {
        lockedStates.inherent1 = 0;
        updateState('inherent1', 0);
    }
    if (charLevel < 70 && lockedStates.inherent2) {
        lockedStates.inherent2 = false;
        updateState('inherent2', false);
    }

    activeStates = lockedStates;

    return (
        <div className="inherent-skills">
            <h4 style={{ fontSize: '20px', marginBottom: '8px' }}>Inherent Skills</h4>

            {skills.map((node, index) => {
                const name = node.Skill?.Name ?? '';
                const lowerName = name.toLowerCase();
                const isKnowing = lowerName.includes("knowing");
                const isFocus = lowerName.includes("focus");

                const unlockLevel = unlockLevels[index] ?? 1;
                const locked = charLevel < unlockLevel;

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

                        {isKnowing && (
                            <div
                                className="slider-label-with-input"
                                style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px',
                                    opacity: locked ? 0.5 : 1,
                                    cursor: !locked ? 'pointer' : 'not-allowed'
                                }}
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

                        {isFocus && locked && (
                            <span style={{ marginLeft: '8px', fontSize: '12px', color: 'gray' }}>
                                (Unlocks at Lv. {unlockLevel}
                            </span>
                        )}

                        {!isKnowing && !isFocus && locked && (
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


export function yoaSequenceToggles({ nodeKey, sequenceToggles, toggleSequence, currentSequenceLevel }) {
    if (!['2', '3', '4'].includes(String(nodeKey))) return null;

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
                    <div className="echo-buff-name">S4: Vessel of Rebirth</div>
                </div>
                <div className="echo-buff-effect">
                    Casting Resonance Liberation <span className="highlight">Cogitation Model</span> grants a <span className="highlight">25%</span> DMG Bonus to all team members' <span className="highlight">Resonance Liberation</span> for 30s.
                </div>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.rebirth || false}
                        onChange={() => toggleState('rebirth')}
                    />
                    Enable
                </label>
            </div>
        </div>
    );
}