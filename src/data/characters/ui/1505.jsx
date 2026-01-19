import React from "react";
import {formatDescription} from "@/utils/formatDescription.js";
import {highlightKeywordsInText} from "@/constants/echoSetData.jsx";

export default function SkUI({ activeStates, toggleState }) {

    return (
        <div className="status-toggles">
            <div className="status-toggle-box">
                <div className="status-toggle-box-inner">
                    <h4 className={'highlight'} style={{ fontSize: '18px', fontWeight: 'bold' }}>Inner Stellarealm</h4>
                    <div>
                        <p>
                            When a party member uses <span className="highlight">Intro Skill</span> within the <span className="highlight">Outer Stellarealm</span>, it evolves into the <span className="highlight">Inner Stellarealm</span>. Within the effective range of the <span className="highlight">Inner Stellarealm</span>, for every <span className="highlight">0.2%</span> of Shorekeeper's Energy Regen, all party members gain a <span className="highlight">0.01%</span> increase of Crit. Rate, up to <span className="highlight">12.5%%</span>.
                            <span className="highlight">Inner Stellarealm</span> has all the effects of the <span className="highlight">Outer Stellarealm</span>.
                        </p>
                    </div>
                    <label className="modern-checkbox">
                        <input
                            type="checkbox"
                            checked={activeStates.innerS || false}
                            onChange={() => {
                                const newState = !activeStates.innerS;
                                toggleState('innerS');
                                if (!newState && activeStates.supernal) {
                                    toggleState('supernal');
                                }
                            }}
                        />
                        Enable
                    </label>
                </div>

                <div className="status-toggle-box-inner">
                    <h4 className={'highlight'} style={{ fontSize: '18px', fontWeight: 'bold' }}>Supernal Stellarealm</h4>
                    <div>
                        <p>
                            When a party member uses <span className="highlight">Intro Skill</span> within the <span className="highlight">Inner Stellarealm</span>, it evolves into the <span className="highlight">Supernal Stellarealm</span>. Within the effective range of the <span className="highlight">Supernal Stellarealm</span>, for every <span className="highlight">0.1%</span> of <span className="highlight">Shorekeeper</span>'s Energy Regen, all party members gain a <span className="highlight">0.01%</span> increase of Crit. DMG, up to <span className="highlight">25%</span>.
                            <span className="highlight">Supernal Stellarealm</span> has all the effects of the <span className="highlight">Inner Stellarealm</span>.
                        </p>
                    </div>
                    <label className="modern-checkbox"
                           style={{
                               opacity: !activeStates.innerS ? 0.5 : 1,
                               cursor: activeStates.innerS ? 'pointer' : 'not-allowed'
                           }}
                    >
                        <input
                            type="checkbox"
                            checked={activeStates.supernal || false}
                            onChange={() => toggleState('supernal')}
                            disabled={!activeStates.innerS}
                        />
                        Enable
                        {!activeStates.innerS && (
                            <span style={{ marginLeft: '8px', fontSize: '12px', color: 'gray' }}>
                                (Requires Inner Stellarealm)
                            </span>
                        )}
                    </label>
                </div>
                <div className="status-toggles">
                    <div className="status-toggle-box">
                        <h4 className={'highlight'} style={{ fontSize: '18px', fontWeight: 'bold' }}>Outro Skill: Binary Butterfly</h4>
                        <p>
                            All nearby party members' DMG is Amplified by <span className="highlight">15%</span>.
                        </p>
                        <label className="modern-checkbox">
                            <input
                                type="checkbox"
                                checked={activeStates.butterfly || false}
                                onChange={() => {
                                    toggleState('butterfly');
                                }}
                            />
                            Enable
                        </label>
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

                const gravitation = lowerName.includes("self gravitation");
                const unlockLevel = gravitation ? 70 : 50;
                const locked = charLevel < unlockLevel;

                if (locked) {
                    if (gravitation && activeStates.inherent2) updateState('inherent2', false);
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

                        {gravitation && (
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
                                        (Unlocks at Lv. {unlockLevel})
                                    </span>
                                )}
                            </label>
                        )}
                        {!gravitation && locked && (
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

export function skSequenceToggles({ nodeKey, sequenceToggles, toggleSequence, currentSequenceLevel }) {
    if (!['4'].includes(String(nodeKey))) return null;

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

export function buffUI({ activeStates, toggleState, charId, setCharacterRuntimeStates, attributeColors, characterRuntimeStates }) {
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

    const character = characterRuntimeStates?.[charId];
    const name = character?.Name.toLowerCase();
    const isRover = name.includes("rover");

    return (
        <div className="echo-buffs">
            <label className="slider-label-with-input">
                Energy Regen:
                <input
                    type="number"
                    value={activeStates.innerEnergy ?? 100}
                    min={100}
                    max={250}
                    step={1}
                    onChange={(e) => {
                        const value = Math.min(Math.max(parseFloat(e.target.value) || 100, 100), 250);
                        updateState('innerEnergy', value);
                    }}
                    className="character-level-input"
                /> %
            </label>
            <div className="echo-buff">
                <div className="echo-buff-header">
                    <div className="echo-buff-name">Self Gravitation</div>
                </div>
                <div className="echo-buff-effect">
                    When the on-field Resonator is within range of a <span className="highlight">Stellarealm</span>, <span className="highlight">Shorekeeper</span>'s Energy Regen is increased by <span className="highlight">10%</span>, and <span className="highlight">Rover</span>'s Energy Regen is also increased by <span className="highlight">10%</span> if <span className="highlight">Rover</span> is on the team.
                </div>
                <label className="modern-checkbox"
                       style={{
                           opacity: !isRover ? 0.5 : 1,
                           cursor: isRover ? 'pointer' : 'not-allowed',
                       }}
                >
                    <input
                        type="checkbox"
                        checked={(activeStates.gravitation && isRover) || false}
                        disabled={!isRover}
                        onChange={() => toggleState('gravitation')}
                    />
                    Enable
                    {!isRover && (
                        <span style={{ marginLeft: '8px', fontSize: '12px', color: 'gray' }}>
                            ({character?.Name} is not Rover)
                        </span>
                    )}
                </label>
            </div>
            <div className="echo-buff">
                <div className="echo-buff-header">
                    <div className="echo-buff-name">Inner Stellarealm</div>
                </div>
                <div className="echo-buff-effect">
                    When a party member uses <span className="highlight">Intro Skill</span> within the <span className="highlight">Outer Stellarealm</span>, it evolves into the <span className="highlight">Inner Stellarealm</span>. Within the effective range of the <span className="highlight">Inner Stellarealm</span>, for every <span className="highlight">0.2%</span> of Shorekeeper's Energy Regen, all party members gain a <span className="highlight">0.01%</span> increase of Crit. Rate, up to <span className="highlight">12.5%%</span>.
                    <span className="highlight">Inner Stellarealm</span> has all the effects of the <span className="highlight">Outer Stellarealm</span>.
                </div>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.innerS || false}
                        onChange={() => toggleState('innerS')}
                    />
                    Enable
                </label>
            </div>

            <div className="echo-buff">
                <div className="echo-buff-header">
                    <div className="echo-buff-name">Supernal Stellarealm</div>
                </div>
                <div className="echo-buff-effect">
                    When a party member uses <span className="highlight">Intro Skill</span> within the <span className="highlight">Inner Stellarealm</span>, it evolves into the <span className="highlight">Supernal Stellarealm</span>. Within the effective range of the <span className="highlight">Supernal Stellarealm</span>, for every <span className="highlight">0.1%</span> of <span className="highlight">Shorekeeper</span>'s Energy Regen, all party members gain a <span className="highlight">0.01%</span> increase of Crit. DMG, up to <span className="highlight">25%</span>.
                    <span className="highlight">Supernal Stellarealm</span> has all the effects of the <span className="highlight">Inner Stellarealm</span>.
                </div>
                <label className="modern-checkbox"
                       style={{
                           opacity: !activeStates.innerS ? 0.5 : 1,
                           cursor: activeStates.innerS ? 'pointer' : 'not-allowed'
                       }}
                >
                    <input
                        type="checkbox"
                        checked={(activeStates.supernal && activeStates.innerS) || false}
                        onChange={() => toggleState('supernal')}
                        disabled={!activeStates.innerS}
                    />
                    Enable
                    {!activeStates.innerS && (
                        <span style={{ marginLeft: '8px', fontSize: '12px', color: 'gray' }}>
                            (Requires Inner Stellarealm)
                        </span>
                    )}
                </label>
            </div>

            <div className="echo-buff">
                <div className="echo-buff-header">
                    <div className="echo-buff-name">Outro Skill: Binary Butterfly</div>
                </div>
                <div className="echo-buff-effect">
                    All nearby party members' DMG is Amplified by <span className="highlight">15%</span>.
                </div>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.butterfly || false}
                        onChange={() => toggleState('butterfly')}
                    />
                    Enable
                </label>
            </div>

            <div className="echo-buff">
                <div className="echo-buff-header">
                    <div className="echo-buff-name">S2: Night's Gift and Refusal</div>
                </div>
                <div className="echo-buff-effect">
                    The <span className="highlight">Outer Stellarealm</span> now increases the ATK of all nearby party members by <span className="highlight">40%</span>.
                </div>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.nightsGift || false}
                        onChange={() => toggleState('nightsGift')}
                    />
                    Enable
                </label>
            </div>
        </div>
    );
}