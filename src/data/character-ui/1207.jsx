import {formatDescription} from "../../utils/formatDescription.js";
import React, {useEffect} from 'react';
import DropdownSelect from '../../components/DropdownSelect';
import {attributeColors} from "../../utils/attributeHelpers.js";
import {highlightKeywordsInText} from "../../constants/echoSetData.jsx";

export default function LupaUI({ characterRuntimeStates, setCharacterRuntimeStates, charId, activeStates, toggleState }) {
    const packHuntValue = characterRuntimeStates?.[charId]?.activeStates?.packHunt ?? 0;
    const state = characterRuntimeStates?.[charId]?.activeStates;
    const team = state?.teamBase;
    const isTeamValid = (team?.length === 3 &&
        team?.every(char => Number(char.Attribute) === 2)) ?? false;
    const handleChange = (newValue) => {
        setCharacterRuntimeStates(prev => ({
            ...prev,
            [charId]: {
                ...(prev[charId] ?? {}),
                activeStates: {
                    ...(prev[charId]?.activeStates ?? {}),
                    packHunt: newValue
                }
            }
        }));
    };

    return (
        <div className="status-toggles">
            <div className="status-toggle-box">
                <h4 className={'highlight'} style={{ fontSize: '18px', fontWeight: 'bold' }}>Wildfire Banner</h4>
                <p>
                    <span className='highlight'>Lupa</span>'s ATK is increased by <span className='highlight'>12%</span> for 8s when performing the following actions:
                </p>
                <ul>
                    <li>Casting Resonance Skill <span className='highlight'>Feral Fang</span>.</li>
                    <li>Casting <span className='highlight'>Heavy Attack - Wolf's Gnawing</span>, <span className='highlight'>Heavy Attack - Wolf's Claw</span>, or <span className='highlight'>Mid-air Attack - Firestrike</span>.</li>
                    <li>Casting Resonance Liberation <span className='highlight'>Fire-Kissed Glory</span>.</li>
                    <li>Casting <span className='highlight'>Dance With the Wolf</span> and <span className='highlight'>Dance With the Wolf: Climax</span>.</li>
                </ul>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.wildfireBanner || false}
                        onChange={() => {
                            toggleState('wildfireBanner');
                        }}
                    />
                    Enable
                </label>
            </div>

            <div className="status-toggle-box">
                <h4 className={'highlight'} style={{ fontSize: '18px'}}>Pack Hunt</h4>
                <div>
                    <p>
                        Resonators with <span className='highlight'>Pack Hunt</span> gain a  <span className='highlight'>6%</span> ATK increase, and  <span className='highlight'>10%</span> <span style={{ color: attributeColors['fusion'], fontWeight: 'bold' }}>Fusion DMG
                        Bonus</span> when they attack  <span className='highlight'>Overlord</span> Class or  <span className='highlight'>Calamity</span> Class targets (Both are non-stackable).
                    </p>
                    <label className="modern-checkbox">
                        <input
                            type="checkbox"
                            checked={activeStates.packHunt1 || false}
                            onChange={() => toggleState('packHunt1')}
                        />
                        Enable
                    </label>
                    <p>
                        If there are 3 <span style={{ color: attributeColors['fusion'], fontWeight: 'bold' }}>Fusion</span> Resonators in the team, the <span style={{ color: attributeColors['fusion'], fontWeight: 'bold' }}>Fusion DMG Bonus</span> against <span className='highlight'>Overlord</span> Class or
                        <span className='highlight'> Calamity</span> Class targets additionally increases by <span className='highlight'>10%</span>.
                    </p>
                    <label className="modern-checkbox"
                           style={{
                               opacity: !isTeamValid ? 0.5 : 1,
                               cursor: isTeamValid ? 'pointer' : 'not-allowed'
                           }}
                    >
                        <input
                            type="checkbox"
                            checked={(activeStates.packHunt2 && isTeamValid) || false}
                            onChange={() => toggleState('packHunt2')}
                            disabled={!isTeamValid}
                        />
                        Enable
                        {!isTeamValid && (
                            <span style={{ marginLeft: '8px', fontSize: '12px', color: 'gray' }}>
                                (Needs 3 <span style={{ color: attributeColors['fusion'], fontWeight: 'bold' }}>Fusion</span> Resonators in the team)
                            </span>
                        )}
                    </label>
                    <p>
                        When the active Resonator casts <span className='highlight'>Intro Skill</span>
                        , <span className='highlight'>Pack Hunt</span> is enhanced, granting an additional <span className='highlight'>6%</span> ATK increase to all Resonators in the team, up to a maximum of <span className='highlight'>18%</span>.
                    </p>
                    <DropdownSelect
                        disabled={!activeStates.packHunt1 || false}
                        label=""
                        options={[0, 1, 2]}
                        value={packHuntValue}
                        onChange={handleChange}
                        width="80px"
                    />
                    {!activeStates.packHunt1 && (
                        <span style={{ marginLeft: '8px', fontSize: '12px', color: 'gray' }}>
                                (Requires Inner Pack Hunt to be active)
                            </span>
                    )}
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

                const victory = lowerName.includes("applause of victory");
                const unlockLevel = victory ? 70 : 50;
                const locked = charLevel < unlockLevel;

                if (locked) {
                    if (victory && activeStates.inherent2) updateState('inherent2', false);
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
                        {victory && (
                            <div
                                className="slider-label-with-input"
                                style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}
                            >
                                <DropdownSelect
                                    label=""
                                    options={[0, 1, 2, 3]}
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
                        {!victory && locked && (
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


export function LupaSequenceToggles({
                                          nodeKey,
                                          sequenceToggles,
                                          toggleSequence,
                                          currentSequenceLevel,
                                          setCharacterRuntimeStates,
                                          charId
                                      }) {
    const validKeys = ['1', '2', '5'];
    if (!validKeys.includes(String(nodeKey))) return null;

    const requiredLevel = Number(nodeKey);
    const isDisabled = currentSequenceLevel < requiredLevel;

    if (String(nodeKey) === '2') {
        const value = sequenceToggles['2_value'] ?? 0;

        const handleChange = (newValue) => {
            setCharacterRuntimeStates(prev => ({
                ...prev,
                [charId]: {
                    ...(prev[charId] ?? {}),
                    sequenceToggles: {
                        ...(prev[charId]?.sequenceToggles ?? {}),
                        ['2_value']: newValue
                    }
                }
            }));
        };

        return (
            <DropdownSelect
                label=""
                options={[0, 1, 2]}
                value={value}
                onChange={handleChange}
                disabled={isDisabled}
                className="sequence-dropdown"
                width="80px"
            />
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
            <div className="echo-buff">
                <div className="echo-buff-header">
                    <div className="echo-buff-name">Pack Hunt</div>
                </div>
                <div className="echo-buff-effect">
                    <p>
                        Resonators with <span className='highlight'>Pack Hunt</span> gain a  <span className='highlight'>6%</span> ATK increase, and  <span className='highlight'>10%</span> <span style={{ color: attributeColors['fusion'], fontWeight: 'bold' }}>Fusion DMG
                        Bonus</span> when they attack  <span className='highlight'>Overlord</span> Class or  <span className='highlight'>Calamity</span> Class targets (Both are non-stackable).
                    </p>
                    <label className="modern-checkbox">
                        <input
                            type="checkbox"
                            checked={activeStates.packHunt1 || false}
                            onChange={() => toggleState('packHunt1')}
                        />
                        Enable
                    </label>
                    <p>
                        If there are 3 <span style={{ color: attributeColors['fusion'], fontWeight: 'bold' }}>Fusion</span> Resonators in the team, the <span style={{ color: attributeColors['fusion'], fontWeight: 'bold' }}>Fusion DMG Bonus</span> against <span className='highlight'>Overlord</span> Class or
                        <span className='highlight'> Calamity</span> Class targets additionally increases by <span className='highlight'>10%</span>.
                    </p>
                    <label className="modern-checkbox"
                           style={{
                               opacity: !isTeamValid ? 0.5 : 1,
                               cursor: isTeamValid ? 'pointer' : 'not-allowed'
                           }}
                    >
                        <input
                            type="checkbox"
                            checked={(activeStates.packHunt2 && isTeamValid) || false}
                            onChange={() => toggleState('packHunt2')}
                            disabled={!isTeamValid}
                        />
                        Enable
                        {!isTeamValid && (
                            <span style={{ marginLeft: '8px', fontSize: '12px', color: 'gray' }}>
                                (Needs 3 <span style={{ color: attributeColors['fusion'], fontWeight: 'bold' }}>Fusion</span> Resonators in the team)
                            </span>
                        )}
                    </label>
                    <p>
                        When the active Resonator casts <span className='highlight'>Intro Skill</span>,
                        <span className='highlight'>Pack Hunt</span> is enhanced, granting an additional <span className='highlight'>6%</span> ATK increase to all Resonators in the team, up to a maximum of <span className='highlight'>18%</span>.
                    </p>
                    <DropdownSelect
                        label="Stacks"
                        options={[0, 1, 2]}
                        value={activeStates.packHunt ?? 0}
                        onChange={(value) => updateState('packHunt', value)}
                        width="80px"
                    />
                </div>
            </div>
            <div className="echo-buff">
                <div className="echo-buff-header">
                    <div className="echo-buff-name">Resonance Liberation - Glory</div>
                </div>
                <div className="echo-buff-effect">
                    Casting Resonance Liberation <span className="highlight">Fire-Kissed Glory</span> grants <span className="highlight">Glory</span>. Within <span className="highlight">35s</span>:
                    <p>
                        Attacks of all Resonators in the team ignore <span className="highlight">3%</span> of the target's <span style={{ color: attributeColors['fusion'], fontWeight: 'bold' }}>Fusion RES</span>. For each <span style={{ color: attributeColors['fusion'], fontWeight: 'bold' }}>Fusion</span> Resonator in the team other than <span className="highlight">Lupa</span>, this effect increases by <span className="highlight">3%</span>, up to the maximum of <span className="highlight">9%</span>.
                    </p>
                    <p>
                        When there are <span className="highlight">3</span> <span style={{ color: attributeColors['fusion'], fontWeight: 'bold' }}>Fusion</span> Resonators in the team, Resonators' attacks further ignore <span className="highlight">6%</span> <span style={{ color: attributeColors['fusion'], fontWeight: 'bold' }}>Fusion RES</span>
                    </p>
                </div>
                <DropdownSelect
                    label="Stacks"
                    options={[0, 1, 2, 3]}
                    value={activeStates.glory ?? 0}
                    onChange={(value) => updateState('glory', value)}
                    width="80px"
                />
            </div>

            <div className="echo-buff">
                <div className="echo-buff-header">
                    <div className="echo-buff-name">Outro Skill: Stand by Me, Warrior</div>
                </div>
                <div className="echo-buff-effect">
                    The incoming Resonator will have their <span style={{ color: attributeColors['fusion'], fontWeight: 'bold' }}>Fusion DMG</span> Amplified by <span className="highlight">20%</span> and <span className="highlight">Basic Attack DMG</span> Amplified by <span className="highlight">25%</span> for <span className="highlight">14s</span> or until the Resonator is switched out.
                </div>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.warrior || false}
                        onChange={() => toggleState('warrior')}
                    />
                    Enable
                </label>
            </div>

            <div className="echo-buff">
                <div className="echo-buff-header">
                    <div className="echo-buff-name">S2: Every Ground, Her Hunting Field</div>
                </div>
                <div className="echo-buff-effect">
                    Performing <span className="highlight">Fire-Kissed Glory</span>, Heavy Attack - <span className="highlight">Wolf's Gnawing</span>, Heavy Attack - <span className="highlight">Wolf's Claw</span>, or Mid-air Attack - <span className="highlight">Firestrike</span> gives <span className="highlight">20%</span> <span style={{ color: attributeColors['fusion'], fontWeight: 'bold' }}>Fusion DMG Bonus</span> to all Resonators in the team for <span className="highlight">30s</span>, stacking up to <span className="highlight">2</span> times.
                </div>
                <DropdownSelect
                    label="Stacks"
                    options={[0, 1, 2]}
                    value={activeStates.huntingField ?? 0}
                    onChange={(value) => updateState('huntingField', value)}
                    width="80px"
                />
            </div>
        </div>
    );
}