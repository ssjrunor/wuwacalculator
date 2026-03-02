import React, {useEffect} from "react";
import DropdownSelect from "@/shared/ui/common/DropdownSelect.jsx";
import {formatDescription} from "@shared/utils/formatDescription.js";
import {highlightKeywordsInText} from "@shared/constants/echoSetData.jsx";
import {attributeColors} from "@shared/utils/attributeHelpers.js";
export default function AemeathUI({ activeStates, toggleState, charId, setCharacterRuntimeStates }) {
    const ruptureMode = activeStates.tuneRupture;
    const burstMode = activeStates.fusionBurst;

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
        <div className="status-toggles">
            <div className="status-toggle-box">
                <h4 className={'highlight'} style={{ fontSize: '18px', fontWeight: 'bold' }}>Instant Response</h4>
                <ul>
                    <li>In <span className='highlight'>Instant Response</span>, <span className='highlight'>Heavy Attack - Aemeath</span> and <span className='highlight'>Heavy Attack - Mech</span> take less time to charge up fully.</li>
                    <li>In <span className='highlight'>Instant Response</span>, casting <span className='highlight'>Heavy Attack - Aemeath</span> or <span className='highlight'>Heavy Attack - Mech</span> restores 100 points of Synchronization Rate. If <span className='highlight'>Aemeath</span> is in the <span className='highlight'>Heavenfall Edict - Unbound</span> state at the same time, she additionally restores 100 points of <span className='highlight'>Synchronization Rate</span>.</li>
                    <li>If Inherent Skill Before All Sounds is activated, while in <span className='highlight'>Instant Response</span>, <span className='highlight'>Heavy Attack - Aemeath</span> and <span className='highlight'>Heavy Attack - Mech</span> gain <span className='highlight'>200%</span> DMG Amplification</li>
                </ul>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.instantResponse || false}
                        onChange={() => {
                            toggleState('instantResponse');
                        }}
                    />
                    Enable
                </label>
            </div>
            <div className="status-toggle-box">
                <h4 className={'highlight'} style={{ fontSize: '18px'}}>Resonance Mode - Tune Rupture</h4>
                <ul>
                    <li>In <span className='highlight'>Resonance Mode - Tune Rupture</span>, casting <span className='highlight'>Resonance Skill Duet of Seraphic Plumes</span> additionally deals 5 instances of <span className='highlight'>Tune Rupture DMG</span>, each time on a random target within the range. The target's Off-Tune Level does not affect these instances of <span className='highlight'>Tune Rupture DMG</span>. When Duet of <span className='highlight'>Seraphic Plumes deals damage</span>, remove the target's <span className='highlight'>Rupturous Trail</span> and increases the DMG Multiplier of Tune Rupture based on the number of stacks removed, each stack increasing the DMG Multiplier by <span className='highlight'>4%</span> for 3s.</li>
                    <li>In <span className='highlight'>Resonance Mode - Tune Rupture</span>, casting <span className='highlight'>Resonance Skill Duet of Seraphic Plumes</span> additionally deal 10 instances of <span className='highlight'>Tune Rupture DMG</span>.</li>
                    <li>In <span className='highlight'>Resonance Mode - Tune Rupture</span>, when Resonators in the team inflict <span className='highlight'>Tune Rupture - Shifting</span> or deal <span className='highlight'>Tune Rupture DMG</span>, <span className='highlight'>Aemeath</span>'s Crit. DMG increases by <span className='highlight'>20%</span>, up to 3 times. Each Resonator can only trigger this effect once.
                        With 3 stacks, <span className='highlight'>Resonance Liberation Heavenfall Edict - Finale</span> ignores <span className='highlight'>20%</span> DEF on the target.</li>
                    <li>In <span className='highlight'>Resonance Mode - Tune Rupture</span>: all Resonators in the team except <span className='highlight'>Aemeath</span> gain <span className='highlight'>10%</span> All DMG Amplification for 20s. The All DMG Amplification effect is increased to <span className='highlight'>20%</span> for Resonators who inflict <span className='highlight'>Tune Rupture - Shifting</span>.</li>
                </ul>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={ruptureMode || false}
                        onChange={() => {
                            toggleState('tuneRupture');
                            if (burstMode) toggleState('fusionBurst');
                        }}
                    />
                    Tune Rupture?
                </label>
            </div>

            <div className="status-toggle-box">
                <h4 className={'highlight'} style={{ fontSize: '18px'}}>Resonance Mode - Fusion Burst</h4>
                <ul>
                    <li>In <span className='highlight'>Resonance Mode - Fusion Burst</span>, when <span className='highlight'>Resonance Skill Duet of Seraphic Plumes</span> hits the target, if they are inflicted with <span style={{ color: attributeColors['fusion'], fontWeight: 'bold' }}>Fusion Trail</span>, remove the <span style={{ color: attributeColors['fusion'], fontWeight: 'bold' }}>Fusion Trail</span> stacks, and trigger the <span style={{ color: attributeColors['fusion'], fontWeight: 'bold' }}>Fusion Burst</span> on the target based on its max stack limit without removing its stacks. Each stack of <span style={{ color: attributeColors['fusion'], fontWeight: 'bold' }}>Fusion Trail</span> removed increases the DMG Multiplier of <span style={{ color: attributeColors['fusion'], fontWeight: 'bold' }}>Fusion Burst</span> on the main target by <span className='highlight'>10%</span>.</li>
                    <li>In <span className='highlight'>Resonance Mode - Fusion Burst</span>, the DMG Multiplier of <span style={{ color: attributeColors['fusion'], fontWeight: 'bold' }}>Fusion Burst</span> triggered by <span className='highlight'>Resonance Skill Duet of Seraphic Plumes</span> on the main target is additionally increased by <span className='highlight'>200%</span>. The DMG Multiplier increase effect is stackable with that provided by <span style={{ color: attributeColors['fusion'], fontWeight: 'bold' }}>Fusion Trail</span>.</li>
                    <li>In <span className='highlight'>Resonance Mode - Fusion Burst</span>, when Resonators in the team inflict <span style={{ color: attributeColors['fusion'], fontWeight: 'bold' }}>Fusion Burst</span>, <span className='highlight'>Aemeath</span>'s Crit. DMG increases by <span className='highlight'>30%</span>, up to 2 times. Each Resonator can only trigger this effect once.
                        With 2 stacks, <span className='highlight'>Resonance Liberation Heavenfall Edict - Finale</span> ignores <span className='highlight'>20%</span> DEF on the target.</li>
                    <li>In <span className='highlight'>Resonance Mode - Fusion Burst</span>: all Resonators in the team except <span className='highlight'>Aemeath</span> gain <span className='highlight'>10%</span> All DMG Amplification for 20s. The All DMG Amplification effect is increased to <span className='highlight'>20%</span> for Resonators who inflict <span style={{ color: attributeColors['fusion'], fontWeight: 'bold' }}>Fusion Burst</span>.</li>
                </ul>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={burstMode || false}
                        onChange={() => {
                            toggleState('fusionBurst');
                            if (ruptureMode) toggleState('tuneRupture');
                        }}
                    />
                    Fusion Burst?
                </label>
            </div>

            {burstMode && (
                <div className="status-toggle-box">
                    <h4 className={'highlight'} style={{ fontSize: '18px'}}>Fusion Trail</h4>
                    <p>
                        In <span className='highlight'>Resonance Mode - Fusion Burst</span>, when Resonators in the team inflict <span style={{ color: attributeColors['fusion'], fontWeight: 'bold' }}>Fusion Burst</span>, inflict 1 stack of <span style={{ color: attributeColors['fusion'], fontWeight: 'bold' }}>Fusion Trail</span> for 30s, stacking up to 30 times.
                    </p>
                    <label style={{ fontWeight: 'bold' }}>Fusion Trail</label>
                    <input
                        type="number"
                        className="character-level-input"
                        min="0"
                        max="30"
                        value={activeStates.fusionTrail ?? 0}
                        onChange={(e) => {
                            const val = Math.max(0, Math.min(30, Number(e.target.value) || 0));
                            setCharacterRuntimeStates(prev => ({
                                ...prev,
                                [charId]: {
                                    ...(prev[charId] ?? {}),
                                    activeStates: {
                                        ...(prev[charId]?.activeStates ?? {}),
                                        fusionTrail: val
                                    }
                                }
                            }));
                        }}
                    />
                </div>
            )}

            {ruptureMode && (
                <div className="status-toggle-box">
                    <h4 className={'highlight'} style={{ fontSize: '18px'}}>Rupturous Trail</h4>
                    <p>
                        In <span className='highlight'>Resonance Mode - Tune Rupture</span>, when Resonators in the team respond to <span className='highlight'>Tune Rupture - Interfered</span>, inflict 10 stacks of <span className='highlight'>Rupturous Trail</span> on the target for 30s, stacking up to 30 times.
                    </p>
                    <label className="modern-checkbox">
                        <DropdownSelect
                            label="Stacks"
                            options={[0, 1, 2, 3]}
                            value={activeStates.rupturousTrail ?? 0}
                            onChange={(value) => updateState('rupturousTrail', value)}
                            width="80px"
                        />
                    </label>
                </div>
            )}
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
    const burstMode = activeStates.fusionBurst;

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

                const isBetweenStars = lowerName.includes('between the stars');

                if (locked) {
                    if (isBetweenStars && activeStates.inherent2) updateState('inherent1', false);
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

                        {isBetweenStars && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <DropdownSelect
                                    locked={locked}
                                    text={`(Unlocks at Lv. ${unlockLevel})`}
                                    label="Stacks"
                                    options={dropOpt}
                                    value={activeStates.aemeathInherent2Stacks ?? 0}
                                    onChange={(value) => !locked && updateState('aemeathInherent2Stacks', value)}
                                    disabled={locked || sequence >= 3}
                                    width="80px"
                                />
                                {sequence >= 3 && !locked && (
                                    <span style={{fontSize: '12px', color: 'gray' }}>
                                (See sequence node 3~)
                            </span>
                                )}
                            </div>
                        )}
                        {!isBetweenStars && locked && (
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

export function AemeathSequenceToggles({
                                          nodeKey,
                                          sequenceToggles,
                                          toggleSequence,
                                          currentSequenceLevel,
                                          setCharacterRuntimeStates,
                                          charId
                                      }) {
    const requiredLevel = Number(nodeKey);
    const isDisabled = currentSequenceLevel < requiredLevel;

    if (String(nodeKey) === '2') {
        const value = sequenceToggles['2_stacks'] ?? 0;
        const handleChange = (newValue) => {
            setCharacterRuntimeStates(prev => ({
                ...prev,
                [charId]: {
                    ...(prev[charId] ?? {}),
                    sequenceToggles: {
                        ...(prev[charId]?.sequenceToggles ?? {}),
                        ['2_stacks']: newValue
                    }
                }
            }));
        };

        return (
            <DropdownSelect
                label="Tune Rupture hits"
                options={[0, 1, 2, 3, 4, 5]}
                value={value}
                onChange={handleChange}
                disabled={isDisabled}
                width="80px"
            />
        );
    }

    if (String(nodeKey) === '4') {
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

    return null;
}

export function buffUI({ activeStates, toggleState, charId, setCharacterRuntimeStates }) {
    return (
        <div className="echo-buffs">
            <div className="echo-buff">
                <div className="echo-buff-header">
                    <div className="echo-buff-name">Outro Skill: Silent Protection</div>
                </div>
                <div className="echo-buff-effect">
                    When casting this skill, the following effects are triggered based on the Resonance Mode Aemeath are in:
                    <ul>
                        <li>In <span className="highlight">Resonance Mode - Tune Rupture</span>: all Resonators in the team except <span className="highlight">Aemeath</span> gain <span className="highlight">10% All DMG Amplification</span> for 20s.</li>
                        <li>In <span className="highlight">Resonance Mode - Fusion Burst</span>: all Resonators in the team except <span className="highlight">Aemeath</span> gain <span className="highlight">10% All DMG Amplification</span> for 20s.</li>
                    </ul>
                    <label className="modern-checkbox">
                        <input
                            type="checkbox"
                            checked={activeStates.aemeathOutroActive || false}
                            onChange={() => toggleState('aemeathOutroActive')}
                        />
                        Enable
                    </label>

                    <ul>
                        <li>The <span className="highlight">All DMG Amplification</span> effect is increased to <span className="highlight">20%</span> for Resonators who inflict <span className="highlight">Tune Rupture - Shifting</span>.</li>
                        <li>The <span className="highlight">All DMG Amplification</span> effect is increased to <span className="highlight">20%</span> for Resonators who inflict <span style={{ color: attributeColors['fusion'], fontWeight: 'bold' }}>Fusion Burst</span>.</li>
                    </ul>
                    <label className="modern-checkbox"
                           style={{
                               opacity: !activeStates.aemeathOutroActive ? 0.5 : 1,
                               cursor: activeStates.aemeathOutroActive ? 'pointer' : 'not-allowed'
                           }}
                    >
                        <input
                            type="checkbox"
                            checked={(activeStates.aemeathOutroTrigger && activeStates.aemeathOutroActive) || false}
                            onChange={() => toggleState('aemeathOutroTrigger')}
                            disabled={!activeStates.aemeathOutroActive}
                        />
                        Enable
                    </label>
                    {!activeStates.aemeathOutroActive && (
                        <span style={{ marginLeft: '8px', fontSize: '12px', color: 'gray' }}>
                            (Requires the first toggle to be on)
                        </span>
                    )}
                </div>
            </div>

            <div className="echo-buff">
                <div className="echo-buff-header">
                    <div className="echo-buff-name">Sequence 4: Ethereal Waltz</div>
                </div>
                <div className="echo-buff-effect">
                    When casting <span className="highlight">Intro Skill Aria across the Endless Blue</span>, <span className="highlight">Intro Skill Starborne Debut</span>, <span className="highlight">Resonance Skill Combo - Pierce</span> and <span className="highlight">Resonance Skill Duet of Seraphic Plumes</span>, Resonators in the team gain <span className="highlight">20% All-Attribute DMG Bonus</span> for 30s.
                </div>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.aemeathS4Buff || false}
                        onChange={() => toggleState('aemeathS4Buff')}
                    />
                    Buff active
                </label>
            </div>
        </div>
    );
}
