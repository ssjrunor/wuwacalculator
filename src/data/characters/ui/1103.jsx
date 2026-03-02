import React from 'react';
import { formatDescription } from "@shared/utils/formatDescription.js";
import {highlightKeywordsInText} from "@shared/constants/echoSetData.jsx";

export function CustomInherentSkills({
                                         character,
                                         currentSliderColor,
                                         characterRuntimeStates,
                                         setCharacterRuntimeStates,
                                         charLevel = 1,
                                         unlockLevels = [50, 70],
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
                const unlockLevel = unlockLevels[index] ?? 1;
                const locked = charLevel < unlockLevel;

                const toggleKey = index === 0 ? 'inherent1' : index === 1 ? 'inherent2' : null;
                if (locked && toggleKey && activeStates?.[toggleKey]) {
                    toggleState(toggleKey);
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

                        {toggleKey && (
                            <label className="modern-checkbox"
                                   style={{
                                       opacity: locked ? 0.5 : 1,
                                       cursor: !locked ? 'pointer' : 'not-allowed'
                                   }}
                            >
                                <input
                                    type="checkbox"
                                    checked={activeStates[toggleKey] ?? false}
                                    onChange={() => !locked && toggleState(toggleKey)}
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

export function BaizhiSequenceToggles({ nodeKey, sequenceToggles, toggleSequence, currentSequenceLevel }) {
    const validKeys = ['2', '3', '4', '6'];
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
                    <div className="echo-buff-name">Euphonia</div>
                </div>
                <div className="echo-buff-effect">
                    ATK of the Resonators who pick up Euphonia is increased by <span className="highlight">15%</span> for 20s.
                </div>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.euphonia || false}
                        onChange={() => toggleState('euphonia')}
                    />
                    Enable
                </label>
            </div>

            <div className="echo-buff">
                <div className="echo-buff-header">
                    <div className="echo-buff-name">Outro Skill: Rejuvinating Flow</div>
                </div>
                <div className="echo-buff-effect">
                    The healed Resonator has their DMG Amplified by <span className="highlight">15%</span> for 6s.
                </div>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.rejuvinating || false}
                        onChange={() => toggleState('rejuvinating')}
                    />
                    Enable
                </label>
            </div>

            <div className="echo-buff">
                <div className="echo-buff-header">
                    <div className="echo-buff-name">S6: Seeker's Devotion</div>
                </div>
                <div className="echo-buff-effect">
                    When <span className="highlight">Euphonia</span> is picked up, increase the <span style={{ color: attributeColors['glacio'], fontWeight: 'bold' }}>Glacio DMG Bonus</span> of all characters nearby by <span className="highlight">12%</span> for 20s.
                </div>
                <label className="modern-checkbox" style={{ opacity: !activeStates.euphonia ? 0.5 : 1 }}>
                    <input
                        type="checkbox"
                        checked={activeStates.devotion || false}
                        onChange={() => toggleState('devotion')}
                        disabled={!activeStates.euphonia}
                    />
                    Enable
                </label>
            </div>
        </div>
    );
}