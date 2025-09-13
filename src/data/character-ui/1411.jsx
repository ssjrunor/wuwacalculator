import {formatDescription} from "../../utils/formatDescription.js";
import React, {useEffect} from 'react';
import DropdownSelect from '../../components/DropdownSelect';
import {attributeColors} from "../../utils/attributeHelpers.js";
import {highlightKeywordsInText} from "../../constants/echoSetData.jsx";

export default function QiuyuanUI({ activeStates, toggleState }) {
    return (
        <div className="status-toggles">
            <div className="status-toggle-box">
                <h4 className={'highlight'} style={{ fontSize: '18px', fontWeight: 'bold' }}>Bamboo's Shade</h4>
                <div>
                    <p>
                        When <span className='highlight'>Qiuyuan</span> holds <span className='highlight'>400</span> points of <span className='highlight'>Swordster's Soliloquy</span>,
                        he gains the <span className='highlight'>Bamboo's Shade</span> effect, allowing all Resonators in the team to gain <span className='highlight'>30% Echo Skill DMG Bonus</span> for 30s.</p>
                </div>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.bambooShade || false}
                        onChange={() => {
                            toggleState('bambooShade');
                        }}
                    />
                    Bamboo's Shade?
                </label>
            </div>
            <div className="status-toggle-box-inner">
                <h4 className={'highlight'} style={{ fontSize: '18px', fontWeight: 'bold' }}>Sundering Strike</h4>
                <div>
                    <p> For every <span className='highlight'>1%</span> of <span className='highlight'>Qiuyuan</span>'s Crit. Rate over <span className='highlight'>50%</span>, this skill increases the Crit. DMG of all Resonators in the team by <span className='highlight'>2%</span> for 30s, maxed at <span className='highlight'>30%</span>.</p>
                </div>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.sunderingStrike || false}
                        onChange={() => {
                            toggleState('sunderingStrike');
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
    keywords.push(
        'Thus Spoke the Blade: To Teach',
        'Thus Spoke the Blade: To Save',
        'Thus Spoke the Blade: To Sacrifice',
        'Swordster\'s Soliloquy'
    );

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
                const isQuietude = lower.includes("quietude within");
                const isAgeOld = lower.includes("drink away woes age-old");

                const lockLevel = isQuietude ? 50 : isAgeOld ? 70 : 1;
                const locked = charLevel < lockLevel;

                if (isQuietude && locked && activeStates.inherent1) {
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

                if (isAgeOld && locked && activeStates.inherent2 > 0) {
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

                        {isQuietude && (
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

                        {isAgeOld && (
                            <label className="modern-checkbox"
                                   style={{
                                       opacity: locked ? 0.5 : 1,
                                       cursor: !locked ? 'pointer' : 'not-allowed'
                                   }}>
                                <input
                                    type="checkbox"
                                    checked={activeStates.inherent2 ?? false}
                                    onChange={() => !locked && toggleState('inherent2')}
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
                    </div>
                );
            })}
        </div>
    );
}


export function QiuyuanSequenceToggles({
                                          nodeKey,
                                          sequenceToggles,
                                          toggleSequence,
                                          currentSequenceLevel,
                                          setCharacterRuntimeStates,
                                          charId
                                      }) {
    if (!['3'].includes(String(nodeKey))) return null;

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

export function buffUI({ activeStates, toggleState, charId, setCharacterRuntimeStates, characterRuntimeStates }) {
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

    const state = characterRuntimeStates?.[charId]?.activeStates;
    const team = state?.teamBase;
    const isTeamValid = (team?.length === 3 &&
        team?.every(char => Number(char.Attribute) === 2)) ?? false;

    return (
        <div className="echo-buffs">
            <label className="slider-label-with-input">
                Crit. Rate:
                <input
                    type="number"
                    value={activeStates.sunderingCr ?? 5}
                    min={5}
                    max={999}
                    step={1}
                    onChange={(e) => {
                        const value = parseFloat(e.target.value) || 5;
                        updateState('sunderingCr', value);
                    }}
                    className="character-level-input"
                /> %
            </label>
            <div className="echo-buff">
                <div className="echo-buff-header">
                    <div className="echo-buff-name">Bamboo's Shade</div>
                </div>
                <div className="echo-buff-effect">
                    <p>
                        When <span className='highlight'>Qiuyuan</span> holds <span className='highlight'>400</span> points of <span className='highlight'>Swordster's Soliloquy</span>,
                        he gains the <span className='highlight'>Bamboo's Shade</span> effect, allowing all Resonators in the team to gain <span className='highlight'>30% Echo Skill DMG Bonus</span> for 30s.</p>
                    <label className="modern-checkbox">
                        <input
                            type="checkbox"
                            checked={activeStates.bambooShade || false}
                            onChange={() => toggleState('bambooShade')}
                        />
                        Enable
                    </label>
                </div>
            </div>
            <div className="echo-buff">
                <div className="echo-buff-header">
                    <div className="echo-buff-name">Sundering Strike</div>
                </div>
                <div className="echo-buff-effect">
                    <p> For every <span className='highlight'>1%</span> of <span className='highlight'>Qiuyuan</span>'s Crit. Rate over <span className='highlight'>50%</span>, this skill increases the Crit. DMG of all Resonators in the team by <span className='highlight'>2%</span> for 30s, maxed at <span className='highlight'>30%</span>.</p>
                </div>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.sunderingStrike || false}
                        onChange={() => toggleState('sunderingStrike')}
                    />
                    Enable
                </label>
            </div>

            <div className="echo-buff">
                <div className="echo-buff-header">
                    <div className="echo-buff-name">Outro Skill: Stand Ready For My Arrival, Worm.</div>
                </div>
                <div className="echo-buff-effect">
                    Grant <span className='highlight'>50% Echo Skill</span> DMG Amplification to the incoming Resonator, lasting for 14s or until the Resonator is switched out.
                </div>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.strikeBeforeReady || false}
                        onChange={() => toggleState('strikeBeforeReady')}
                    />
                    Enable
                </label>
            </div>

            <div className="echo-buff">
                <div className="echo-buff-header">
                    <div className="echo-buff-name">S2: O Blade, I, Who Teach No More</div>
                </div>
                <div className="echo-buff-effect">
                    <span className="highlight">Bamboo's Shade</span> now grants <span className="highlight">30% Echo Skill</span> DMG Amplification to all Resonators in the team.
                </div>
                <label
                    className="modern-checkbox"
                    style={{
                        opacity: !activeStates.bambooShade ? 0.5 : 1,
                        cursor: activeStates.bambooShade ? 'pointer' : 'not-allowed'
                    }}
                >
                    <input
                        type="checkbox"
                        checked={activeStates.qiuyuanS2 || false}
                        onChange={() => toggleState('qiuyuanS2')}
                        disabled={!activeStates.bambooShade}
                    />
                    Enable
                    {!activeStates.bambooShade && (
                        <span style={{ marginLeft: '8px', fontSize: '12px', color: 'gray' }}>
                (Requires Bamboo's Shade)
                            </span>)}
                </label>
            </div>

            <div className="echo-buff">
                <div className="echo-buff-header">
                    <div className="echo-buff-name">S6: Thus I Heard, Thus I Saw, Thus I Spoke</div>
                </div>
                <div className="echo-buff-effect">
                    When <span className="highlight">Qiuyuan</span> is in the team, all other Resonators' <span className="highlight">Echo Skill</span> DMG ignores <span className="highlight">10%</span> of the target's DMG RES for all Attributes.
                </div>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.qiuyuanS6 || false}
                        onChange={() => toggleState('qiuyuanS6')}
                    />
                    Enable
                </label>
            </div>
        </div>
    );
}