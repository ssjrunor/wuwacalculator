import React from "react";
import {formatDescription} from "@shared/utils/formatDescription.js";
import DropdownSelect from "@/shared/ui/common/DropdownSelect.jsx";
import {attributeColors} from "@shared/utils/attributeHelpers.js";
import {highlightKeywordsInText} from "@shared/constants/echoSetData.jsx";

export default function ZaniUI({ setCharacterRuntimeStates, charId, activeStates, toggleState }) {

    return (
        <div className="status-toggles">
            <div className="status-toggle-box">
                <div className="status-toggle-box-inner">
                    <h4 className={'highlight'} style={{ fontSize: '18px', fontWeight: 'bold' }}>Inferno Mode</h4>
                    <div>
                        <p>When in <span className='highlight'>Inferno</span> Mode, the DMG Multiplier of Basic Attack is increased.</p>
                    </div>
                    <label className="modern-checkbox">
                        <input
                            type="checkbox"
                            checked={activeStates.inferno || false}
                            onChange={() => toggleState('inferno')}
                        />
                        Enable
                    </label>
                </div>
                <div className="status-toggle-box-inner">
                    <h4 className={'highlight'} style={{ fontSize: '18px', fontWeight: 'bold' }}>Sunburst</h4>
                    <div>
                        <p>The <span style={{ color: attributeColors['spectro'], fontWeight: 'bold' }}>Spectro Frazzle</span> DMG dealt by <span className='highlight'>Zani</span> to the target is Amplified by <span className='highlight'>20%</span>.</p>
                    </div>
                    <label className="modern-checkbox">
                        <input
                            type="checkbox"
                            checked={activeStates.sunburst || false}
                            onChange={() => toggleState('sunburst')}
                        />
                        Enable
                    </label>
                </div>
                <div className="status-toggle-box-inner">
                    <h4 className={'highlight'} style={{ fontSize: '18px', fontWeight: 'bold' }}>Heliacal Ember</h4>
                    <div>
                        <p>When <span className='highlight'>Zani</span> is in the team and a nearby Resonator inflicts <span style={{ color: attributeColors['spectro'], fontWeight: 'bold' }}>Spectro Frazzle</span> upon a target, immediately consume all <span style={{ color: attributeColors['spectro'], fontWeight: 'bold' }}>Spectro Frazzle</span> stacks and trigger the corresponding DMG, then convert <span style={{ color: attributeColors['spectro'], fontWeight: 'bold' }}>Spectro Frazzle</span> into an equal number of <span className='highlight'>Heliacal Embers</span>. <span className='highlight'>Heliacal Ember</span> is capped at 60 stacks.</p>
                        <p><span className='highlight'>Beacon For the Future</span>: Each stack increases the DMG dealt by <span className='highlight'>10%</span>.</p>
                    </div>
                    <div className="slider-label-with-input" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <label style={{ fontWeight: 'bold' }}>
                            Heliacal Ember
                        </label>
                        <input
                            type="number"
                            className="character-level-input"
                            min="0"
                            max="60"
                            value={activeStates.ember ?? 0}
                            onChange={(e) => {
                                const val = Math.max(0, Math.min(60, Number(e.target.value) || 0));
                                setCharacterRuntimeStates(prev => ({
                                    ...prev,
                                    [charId]: {
                                        ...(prev[charId] ?? {}),
                                        activeStates: {
                                            ...(prev[charId]?.activeStates ?? {}),
                                            ember: val
                                        }
                                    }
                                }));
                            }}
                        />
                    </div>
                </div>
                <div className="status-toggle-box-inner">
                    <h4 className={'highlight'} style={{ fontSize: '18px', fontWeight: 'bold' }}>Heavy Slash - Nightfall: Blaze</h4>
                    <div>
                        <p>Consume up to 40 <span className='highlight'>Blazes</span> on hit, with each <span className='highlight'>Blaze</span> increasing the DMG Multiplier of <span className='highlight'>Heavy Slash - Nightfall</span></p>
                    </div>
                    <div className="slider-label-with-input" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <label htmlFor="blaze-consumed" style={{ fontWeight: 'bold' }}>
                            Blaze Consumed
                        </label>
                        <input
                            type="number"
                            className="character-level-input"
                            min="0"
                            max="40"
                            value={activeStates.blaze ?? 0}
                            onChange={(e) => {
                                const val = Math.max(0, Math.min(40, Number(e.target.value) || 0));
                                setCharacterRuntimeStates(prev => ({
                                    ...prev,
                                    [charId]: {
                                        ...(prev[charId] ?? {}),
                                        activeStates: {
                                            ...(prev[charId]?.activeStates ?? {}),
                                            blaze: val
                                        }
                                    }
                                }));
                            }}
                        />
                    </div>
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
            <h4 style={{ fontSize: '20px', marginBottom: '8px' }}>Inherent Skills</h4>

            {skills.map((node, index) => {
                const name = node.Skill?.Name ?? '';
                const lowerName = name.toLowerCase();

                const response = lowerName.includes("quick response");
                const unlockLevel = response ? 50 : 70;
                const locked = charLevel < unlockLevel;

                if (locked) {
                    if (response && activeStates.inherent1) updateState('inherent1', false);
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

                        {response && (
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
                        {!response && locked && (
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

export function zaniSequenceToggles({
                                        nodeKey,
                                        sequenceToggles,
                                        toggleSequence,
                                        currentSequenceLevel,
                                        setCharacterRuntimeStates,
                                        charId,
                                        characterRuntimeStates,
    activeStates
                                    }) {
    const validKeys = ['1', '3', '4'];
    if (!validKeys.includes(String(nodeKey))) return null;

    const requiredLevel = Number(nodeKey);
    const isDisabled = currentSequenceLevel < requiredLevel;

    if (String(nodeKey) === '3') {
        const value = sequenceToggles['3_value'] ?? 0;

        return (
            <div className="slider-label-with-input" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label style={{ fontWeight: 'bold' }}>
                    Blaze Consumed
                </label>
                <input
                    id="blaze-consumed"
                    type="number"
                    className="character-level-input"
                    min="0"
                    max="150"
                    value={value}
                    onChange={(e) => {
                        const val = Math.max(0, Math.min(150, Number(e.target.value) || 0));
                        setCharacterRuntimeStates(prev => ({
                            ...prev,
                            [charId]: {
                                ...(prev[charId] ?? {}),
                                sequenceToggles: {
                                    ...(prev[charId]?.sequenceToggles ?? {}),
                                    '3_value': val
                                }
                            }
                        }));
                    }}
                />
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

export function buffUI({ activeStates, toggleState, attributeColors }) {
    return (
        <div className="echo-buffs">
            <div className="echo-buff">
                <div className="echo-buff-header">
                    <div className="echo-buff-name">Outro Skill: Beacon For the Future</div>
                </div>
                <div className="echo-buff-effect">
                    The <span style={{ color: attributeColors['spectro'], fontWeight: 'bold' }}>Spectro DMG</span> dealt by other Resonators in the team to the target marked by <span className="highlight">Heliacal Ember</span> is Amplified by <span className="highlight">20%</span> for 20s.
                </div>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.beacon || false}
                        onChange={() => toggleState('beacon')}
                    />
                    Enable
                </label>
            </div>

            <div className="echo-buff">
                <div className="echo-buff-header">
                    <div className="echo-buff-name">S4: More Efficiency, Less Drama</div>
                </div>
                <div className="echo-buff-effect">
                    When Intro Skill <span className="highlight">Immediate Execution</span> is cast, the ATK of all Resonators in the team is increased by <span className="highlight">20%</span> for 30s.

                </div>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.efficiency || false}
                        onChange={() => toggleState('efficiency')}
                    />
                    Enable
                </label>
            </div>
        </div>
    );
}