import React from "react";
import {formatDescription} from "@/utils/formatDescription.js";
import {highlightKeywordsInText} from "@/constants/echoSetData.jsx";

export default function VerinaUI({ activeStates, toggleState }) {
    return (
        <div className="status-toggles">
            <div className="status-toggle-box">
                <h4 className={'highlight'} style={{ fontSize: '18px', fontWeight: 'bold' }}>Outro Skill: Blossom</h4>
                <p>All Resonators on nearby teams have their DMG Amplified by <span className='highlight'>15%</span>.</p>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.blossom || false}
                        onChange={() => {
                            toggleState('blossom');
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
            <h4 className={'highlight'} style={{ fontSize: '20px', marginBottom: '8px' }}>Inherent Skills</h4>

            {skills.map((node, index) => {
                const name = node.Skill?.Name ?? '';
                const lowerName = name.toLowerCase();

                const nature = lowerName.includes("gift of nature");
                const unlockLevel = nature ? 50 : 70;
                const locked = charLevel < unlockLevel;

                if (locked) {
                    if (nature && activeStates.inherent1) updateState('inherent1', false);
                }

                return (
                    <div key={index} className="inherent-skill">
                        <h4 style={{ fontSize: '16px', fontWeight: 'bold' }}>{name}</h4>
                        <p>
                            {highlightKeywordsInText(formatDescription(
                                node.Skill.Desc,
                                node.Skill.Param,
                                currentSliderColor
                            ), keywords)}
                        </p>

                        {nature && (
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
                        {!nature && locked && (
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

export function verinaSequenceToggles({ nodeKey, sequenceToggles, toggleSequence, currentSequenceLevel }) {
    if (!['4', '5', '6'].includes(String(nodeKey))) return null;

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
                    <div className="echo-buff-name">Inherent Skill: Grace of Life</div>
                </div>
                <div className="echo-buff-effect">
                    When Verina casts Heavy Attack <span className="highlight">Starflower Blooms</span>, Mid-air Attack Starflower <span className="highlight">Blooms</span>, Resonance Liberation <span className="highlight">Arboreal Flourish</span> or Outro Skill <span className="highlight">Blossom</span>, all team members' ATK are increased by <span className="highlight">20%</span> for <span className="highlight">20s</span>.
                </div>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.graceOfLife || false}
                        onChange={() => toggleState('graceOfLife')}
                    />
                    Enable
                </label>
            </div>

            <div className="echo-buff">
                <div className="echo-buff-header">
                    <div className="echo-buff-name">Outro Skill: Blossom</div>
                </div>
                <div className="echo-buff-effect">
                    All Resonators on nearby teams have their DMG Amplified by <span className="highlight">15%</span> for <span className="highlight">30s</span>.
                </div>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.blossom || false}
                        onChange={() => toggleState('blossom')}
                    />
                    Enable
                </label>
            </div>

            <div className="echo-buff">
                <div className="echo-buff-header">
                    <div className="echo-buff-name">S4: Blossoming Embrace</div>
                </div>
                <div className="echo-buff-effect">
                    Heavy Attack <span className="highlight">Starflower Blooms</span>, Mid-Air Attack <span className="highlight">Starflower Blooms</span>, Resonance Liberation <span className="highlight">Arboreal Flourish</span> and Outro Skill <span className="highlight">Blossom</span> increases the <span style={{ color: attributeColors['spectro'], fontWeight: 'bold' }}>Spectro DMG Bonus</span> of all team members by <span className="highlight">15%</span> for <span className="highlight">24s</span>.
                </div>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.blossoming || false}
                        onChange={() => toggleState('blossoming')}
                    />
                    Enable
                </label>
            </div>
        </div>
    );
}