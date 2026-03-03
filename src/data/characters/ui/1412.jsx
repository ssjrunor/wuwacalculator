import React from "react";
import DropdownSelect from "@shared/ui/common/DropdownSelect.jsx";
import {highlightKeywordsInText} from "@shared/constants/echoSetData.jsx";
import {formatDescription} from "@shared/utils/formatDescription.js";

export default function SigrikaUI({
                                      activeStates,
                                      toggleState,
                                      setCharacterRuntimeStates,
                                      charId,
                                      characterRuntimeStates
}) {
    const innateGift = characterRuntimeStates?.[charId]?.activeStates?.innateGift ?? 0;

    const handleChange = (newValue) => {
        setCharacterRuntimeStates(prev => ({
            ...prev,
            [charId]: {
                ...(prev[charId] ?? {}),
                activeStates: {
                    ...(prev[charId]?.activeStates ?? {}),
                    innateGift: newValue
                }
            }
        }));
    };

    return (
        <div className="status-toggle-box">
            <div
                className="status-toggle-box-inner"
            >
                <h4 className={'highlight'} style={{ fontSize: '16px', fontWeight: 'bold' }}>Soliskin Vitality</h4>
                <div>
                    <p>
                        When casting <span className="highlight">Heavy Attack - Schemata of Runes</span>, if <span className="highlight">Sigrika</span> holds at least 30 points of <span className="highlight">Soliskin Vitality</span>, consume 30 points to increase the DMG Multipliers of the current <span className="highlight">Runic Outburst</span>, <span className="highlight">Runic Chain Whip</span>, and <span className="highlight">Runic Soliskin</span> by <span className="highlight">25%</span>.
                    </p>
                </div>
                <label className="modern-checkbox" onClick={(e) => e.stopPropagation()}>
                    <input
                        type="checkbox"
                        checked={activeStates.soliskinVitality || false}
                        onChange={() => toggleState('soliskinVitality')}
                    />
                    Enable
                </label>
            </div>

            <div
                className="status-toggle-box-inner"
            >
                <h4 className={'highlight'} style={{ fontSize: '16px', fontWeight: 'bold' }}>Innate Gift?</h4>
                <div>
                    <p>
                        <span className="highlight">Sigrika</span> can hold up to 10 stacks of <span className="highlight">Innate Gift?</span>. Each stack grants <span className="highlight">Heavy Attack - Schemata of Runes</span>, <span className="highlight">Runic Outburst</span>, <span className="highlight">Runic Chain Whip</span>, <span className="highlight">Runic Soliskin</span> and <span className="highlight">Resonance Skill - Learn My True Name 15%</span> DMG Amplification.
                    </p>
                </div>
                <DropdownSelect
                    label=""
                    options={[0, 1, 2, 3, 4, 5, 7, 8, 9, 10]}
                    value={innateGift}
                    onChange={handleChange}
                    width="80px"
                />
            </div>
        </div>
    );
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
    const currentLevel = characterRuntimeStates?.[charId]?.CharacterLevel ?? charLevel;
    const sequence = characterRuntimeStates?.[charId]?.SkillLevels?.sequence;

    const ruptureMode = activeStates.tuneRupture;

    const dropOpt = ruptureMode ? [0, 1, 2, 3] : [0, 1, 2];

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
                const unlockLevel = unlockLevels[index] ?? 1;
                const locked = currentLevel < unlockLevel;

                const isNamesAligned = lowerName.includes('true names aligned');

                if (locked) {
                    if (isNamesAligned && activeStates.inherent2) updateState('inherent2', false);
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

                        {isNamesAligned && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <DropdownSelect
                                    locked={locked}
                                    text={`(Unlocks at Lv. ${unlockLevel})`}
                                    label="Stacks"
                                    options={[0, 1, 2, 3, 4, 5, 6]}
                                    value={activeStates.sigrikaInherent2 ?? 0}
                                    onChange={(value) => !locked && updateState('sigrikaInherent2', value)}
                                    disabled={locked}
                                    width="80px"
                                />
                            </div>
                        )}
                        {!isNamesAligned && locked && (
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

export function sigrikaSequenceToggles({
                                        nodeKey,
                                        sequenceToggles,
                                        toggleSequence,
                                        currentSequenceLevel,
                                    }) {
    const validKeys = ['4'];
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

export function buffUI({ activeStates, toggleState, setCharacterRuntimeStates, charId, characterRuntimeStates }) {
    const trueNamesAligned = characterRuntimeStates?.[charId]?.activeStates?.trueNamesAligned ?? 0;
    const handleChange = (newValue) => {
        setCharacterRuntimeStates(prev => ({
            ...prev,
            [charId]: {
                ...(prev[charId] ?? {}),
                activeStates: {
                    ...(prev[charId]?.activeStates ?? {}),
                    trueNamesAligned: newValue
                }
            }
        }));
    };
    return (
        <div className="echo-buffs">
            <div className="echo-buff">
                <div className="echo-buff-header">
                    <div className="echo-buff-name">True Names Aligned</div>
                </div>
                <div className="echo-buff-effect">
                    When Resonators in the team cast <span className="highlight">Echo Skill</span>, they gain 6% Aero DMG Bonus and <span className="highlight">6% Echo Skill DMG Bonus</span> for 6s, stacking up to 6 times. Echoes with the same name can only trigger this effect once.
                </div>
                <DropdownSelect
                    label=""
                    options={[0, 1, 2, 3, 4, 5, 6]}
                    value={trueNamesAligned}
                    onChange={handleChange}
                    width="80px"
                />
            </div>

            <div className="echo-buff">
                <div className="echo-buff-header">
                    <div className="echo-buff-name">S4: I Lose, Yet I Gain</div>
                </div>
                <div className="echo-buff-effect">
                    When Resonators in the team cast <span className="highlight">Echo Skill</span>, all Resonators in the team have their ATK increased by <span className="highlight">20%</span> for 20s.
                </div>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.iLoseIGain || false}
                        onChange={() => toggleState('iLoseIGain')}
                    />
                    Enable
                </label>
            </div>
        </div>
    );
}