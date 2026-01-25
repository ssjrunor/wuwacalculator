import React from "react";
import DropdownSelect from "@/components/common/DropdownSelect.jsx";
import {formatDescription} from "@/utils/formatDescription.js";
import {highlightKeywordsInText} from "@/constants/echoSetData.jsx";

export default function LuukUI({ activeStates, toggleState, setCharacterRuntimeStates, charId, characterRuntimeStates }) {
    const endnotes = characterRuntimeStates?.[charId]?.activeStates?.endnotes ?? 0;

    const handleChange = (newValue) => {
        setCharacterRuntimeStates(prev => ({
            ...prev,
            [charId]: {
                ...(prev[charId] ?? {}),
                activeStates: {
                    ...(prev[charId]?.activeStates ?? {}),
                    endnotes: newValue
                }
            }
        }));
    };

    return (
        <div className="status-toggles">
            <div className="status-toggle-box">
                <h4 className={'highlight'} style={{ fontSize: '18px', fontWeight: 'bold' }}>Aureate Judge</h4>
                <ul>With full <span className="highlight">Ichor Flow</span>, enter the <span className="highlight">Aureate Judge</span> state. In this state, <span className="highlight">Luuk Herssen</span> gains the following effects:
                    <li><span className="highlight">Ichor Flow</span> does not restore. The DMG Multipliers of all forms of <span className="highlight">Resonance Skill Aureole of Execution</span> increases.</li>
                    <li>Casting <span className="highlight">Aureole of Execution: Glare</span> increases the DMG Multiplier of the next <span className="highlight">Mid-air Attack - Gavel of Earthshaker</span>.</li>
                </ul>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.aureateJudge || false}
                        onChange={() => toggleState('aureateJudge')}
                    />
                    Enable
                </label>
            </div>

            <div className="status-toggle-box">
                <h4 className={'highlight'} style={{ fontSize: '18px', fontWeight: 'bold' }}>Endnotes on the Endgame</h4>
                <p>Increase the DMG Multiplier of <span className="highlight">Resonance Liberation Rewritten in Winter's Margins</span> by <span className="highlight">25%</span>, stacking up to 3 times.</p>
                <DropdownSelect
                    label=""
                    options={[0, 1, 2, 3]}
                    value={endnotes}
                    onChange={handleChange}
                    width="80px"
                />
            </div>

            <div className="status-toggle-box">
                <h4 className={'highlight'} style={{ fontSize: '18px'}}>Silent Debate of Light</h4>
                <div>
                    <p>
                        Responding to Tune Strain - Interfered: Every 0.12% stack of Tune Strain - Interfered on the target increases <span className="highlight">Luuk Herssen</span>'s total DMG against them. Each point of <span className="highlight">Luuk Herssen</span>'s Tune Break Boost increases the total DMG by <span className="highlight">0.12%</span>.
                    </p>
                    <label className="modern-checkbox">
                        <input
                            type="checkbox"
                            checked={activeStates.silentDebate || false}
                            onChange={() => toggleState('silentDebate')}
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

    return (
        <div className="inherent-skills">
            <h4 style={{ fontSize: '20px', marginBottom: '8px' }}>Inherent Skills</h4>

            {skills.map((node, index) => {
                const name = node.Skill?.Name ?? '';
                const lowerName = name.toLowerCase();

                const uncausedDiagnosis = lowerName.includes("uncaused diagnosis");
                const unlockLevel = uncausedDiagnosis ? 70 : 50;
                const locked = charLevel < unlockLevel;

                if (locked) {
                    if (uncausedDiagnosis && activeStates.inherent2) updateState('inherent2', false);
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
                        {uncausedDiagnosis && (
                            <div
                                className="slider-label-with-input"
                                style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}
                            >
                                <label className="modern-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={activeStates.inherent2 || false}
                                        onChange={() => !locked && toggleState('inherent2')}
                                        disabled={locked}
                                    />
                                    Enable
                                </label>
                            </div>
                        )}
                        {!uncausedDiagnosis && locked && (
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

export function LuukSequenceToggles({
                                        nodeKey,
                                        sequenceToggles,
                                        toggleSequence,
                                        currentSequenceLevel,
                                    }) {
    if (!['4', '6'].includes(String(nodeKey))) return null;

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

export function buffUI({ activeStates, toggleState }) {
    return (
        <div className="echo-buffs">
            <div className="echo-buff">
                <div className="echo-buff-header">
                    <div className="echo-buff-name">Sequence 4: Pulse Thrumming Under Rime</div>
                </div>
                <div className="echo-buff-effect">
                    When Resonators in the team cast Tune Break, all Resonators in the team gain <span className="highlight">20% All-Attribute DMG Bonus</span> for 20s.
                </div>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.teamTuneBreakBuff || false}
                        onChange={() => toggleState('teamTuneBreakBuff')}
                    />
                    Enable
                </label>
            </div>
        </div>
    );
}
