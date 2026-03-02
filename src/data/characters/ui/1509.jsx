import {formatDescription} from "@shared/utils/formatDescription.js";
import React, {useEffect} from 'react';
import DropdownSelect from '@/shared/ui/common/DropdownSelect.jsx';
import {attributeColors} from "@shared/utils/attributeHelpers.js";
import {highlightKeywordsInText} from "@shared/constants/echoSetData.jsx";

export default function LynaeUI({ toggleState, activeStates }) {
    return (
        <div className="status-toggles">
            <div className="status-toggle-box">
                <h4 className={'highlight'} style={{ fontSize: '18px'}}>Prismatic Overblast</h4>
                <div>
                    <p>
                        During <span className="highlight">Prismatic Overblast</span>, all nearby Resonators in the team deal <span className="highlight">24%</span> more DMG for 25s.
                    </p>
                    <label className="modern-checkbox">
                        <input
                            type="checkbox"
                            checked={activeStates.prismaticOverblast || false}
                            onChange={() => toggleState('prismaticOverblast')}
                        />
                        Enable
                    </label>
                </div>
            </div>

            <div className="status-toggle-box">
                <h4 className={'highlight'} style={{ fontSize: '18px'}}>True Color</h4>
                <div>
                    <p>
                        This skill consumes 3 points of <span className="highlight">True Color</span> and grants all nearby Resonators in the team 40 points of <span className="highlight">Tune Break Boost</span> for 30s.
                    </p>
                    <label className="modern-checkbox">
                        <input
                            type="checkbox"
                            checked={activeStates.trueColor || false}
                            onChange={() => toggleState('trueColor')}
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

                const adaptiveOptics = lowerName.includes("adaptive optics");
                const unlockLevel = adaptiveOptics ? 70 : 50;
                const locked = charLevel < unlockLevel;

                if (locked) {
                    if (adaptiveOptics && activeStates.inherent2) updateState('inherent2', false);
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
                        {adaptiveOptics && (
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
                        {!adaptiveOptics && locked && (
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


export function lynaeSequenceToggles({
                                          nodeKey,
                                          sequenceToggles,
                                          toggleSequence,
                                          currentSequenceLevel,
                                          setCharacterRuntimeStates,
                                         characterRuntimeStates,
                                          charId
                                      }) {
    const validKeys = ['3', '6'];
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
                options={[0, 1, 2, 3]}
                value={value}
                onChange={handleChange}
                disabled={isDisabled}
                className="sequence-dropdown"
                width="80px"
            />
        );
    }

    if (String(nodeKey) === '3') {
        const currentValue =
            characterRuntimeStates?.[charId]?.sequenceToggles?.premixedHue ?? 0;

        return (
            <div className="sequence-checkbox-group">
                <div
                    className="slider-label-with-input"
                    style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
                >
                    <label htmlFor={'premixedHue'} style={{ fontWeight: 'bold' }}>
                        Premixed Hue
                    </label>
                    <input
                        id={'premixedHue'}
                        type="number"
                        className="character-level-input"
                        step="1"
                        min="0"
                        max="25"
                        style={{ width: '70px' }}
                        value={currentValue}
                        disabled={isDisabled}
                        onChange={(e) => {
                            const val = Math.max(
                                0,
                                Math.min(25, Number(e.target.value) || 0)
                            );
                            setCharacterRuntimeStates((prev) => ({
                                ...prev,
                                [charId]: {
                                    ...(prev[charId] ?? {}),
                                    sequenceToggles: {
                                        ...(prev[charId]?.sequenceToggles ?? {}),
                                        premixedHue: val
                                    }
                                }
                            }));
                        }}
                    />
                </div>
            </div>
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

export function buffUI({ activeStates, toggleState }) {
    return (
        <div className="echo-buffs">
            <div className="echo-buff">
                <div className="echo-buff-header">
                    <div className="echo-buff-name">Prismatic Overblast</div>
                </div>
                <div className="echo-buff-effect">
                    <p>
                        During <span className="highlight">Prismatic Overblast</span>, all nearby Resonators in the team deal <span className="highlight">24%</span> more DMG for 25s.
                    </p>
                    <label className="modern-checkbox">
                        <input
                            type="checkbox"
                            checked={activeStates.prismaticOverblast || false}
                            onChange={() => toggleState('prismaticOverblast')}
                        />
                        Enable
                    </label>
                </div>
            </div>

            <div className="echo-buff">
                <div className="echo-buff-header">
                    <div className="echo-buff-name">True Color</div>
                </div>
                <div className="echo-buff-effect">
                    <p>
                        This skill consumes 3 points of <span className="highlight">True Color</span> and grants all nearby Resonators in the team 40 points of <span className="highlight">Tune Break Boost</span> for 30s.
                    </p>
                    <label className="modern-checkbox">
                        <input
                            type="checkbox"
                            checked={activeStates.trueColor || false}
                            onChange={() => toggleState('trueColor')}
                        />
                        Enable
                    </label>
                </div>
            </div>

            <div className="echo-buff">
                <div className="echo-buff-header">
                    <div className="echo-buff-name">Outro Skill: Let's Hit the Road! (˶˃ ᵕ ˂˶)</div>
                </div>
                <div className="echo-buff-effect">
                    <p>
                        The next incoming Resonator has their All DMG Amplified by <span className="highlight">15%</span> and <span className="highlight">Resonance Liberation DMG</span> by <span className="highlight">25%</span> for 14s or until they are switched out.
                    </p>
                    <label className="modern-checkbox">
                        <input
                            type="checkbox"
                            checked={activeStates.hitTheRoad || false}
                            onChange={() => toggleState('hitTheRoad')}
                        />
                        Enable
                    </label>
                </div>
            </div>

            <div className="echo-buff">
                <div className="echo-buff-header">
                    <div className="echo-buff-name">S2: Into Lights' Vanishing Point</div>
                </div>
                <div className="echo-buff-effect">
                    <p>
                        Grants the incoming Resonator <span className="highlight">25%</span> All-DMG Amplification for 14s or until the Resonator is switched out.
                    </p>
                    <label className="modern-checkbox">
                        <input
                            type="checkbox"
                            checked={activeStates.vanishingPoint || false}
                            onChange={() => toggleState('vanishingPoint')}
                        />
                        Enable
                    </label>
                </div>
            </div>
        </div>
    );
}