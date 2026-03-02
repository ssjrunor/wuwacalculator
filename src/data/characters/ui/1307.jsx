import {formatDescription} from "@shared/utils/formatDescription.js";
import React from "react";
import {highlightKeywordsInText} from "@shared/constants/echoSetData.jsx";

export default function BulingUI({ activeStates, toggleState }) {
    return (
        <div className="status-toggles">
            <div className="status-toggle-box">
                <h4 className={'highlight'} style={{ fontSize: '18px', fontWeight: 'bold' }}>Thunder Begets Life</h4>
                <div> <h4 style={{ marginBottom: 'unset' }}>Thunder Spell - Yin and Yang</h4>
                    <p style={{ margin: '4px 0' }}> <span className='highlight'>Thunder Spell - Yin and Yang</span> increases the grants <span className='highlight'>10% Resonance Skill DMG Bonus</span> to all active Resonators in the team.</p>
                </div>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.yinAndYang || false}
                        onChange={() => {
                            toggleState('yinAndYang');
                        }}
                    />
                    Enable
                </label>
                <div> <h4 style={{ marginBottom: 'unset' }}>Thunder Spell - Heaven, Earth, Mind</h4>
                    <p style={{ margin: '4px 0' }}>
                        <span className="highlight">Thunder Spell - Heaven, Earth, Mind</span> grants <span className="highlight">30% Resonance Skill DMG Bonus</span> to all active Resonators in the team.</p>
                </div>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.heavenEarthMind || false}
                        onChange={() => {
                            toggleState('heavenEarthMind');
                        }}
                    />
                    Enable
                </label>
            </div>
            <div className="status-toggles">
                <div className="status-toggle-box">
                    <h4 className={'highlight'} style={{ fontSize: '18px', fontWeight: 'bold' }}>Outro Skill: Exorcist In Command</h4>
                    <p>
                        Heal the nearby Resonator who activates Buling's Outro Skill by <span className="highlight">16%</span> of Buling's ATK per second for 8s
                        . All nearby Resonators in the team have their DMG Amplified by <span className="highlight">15%</span> for 30s.
                    </p>
                    <label className="modern-checkbox">
                        <input
                            type="checkbox"
                            checked={activeStates.exorcistInCommand || false}
                            onChange={() => {
                                toggleState('exorcistInCommand');
                            }}
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

                const evilScatters = lowerName.includes("time arrives, evil scatters");
                const unlockLevel = evilScatters ? 50 : 70;
                const locked = charLevel < unlockLevel;

                if (locked) {
                    if (evilScatters && activeStates.inherent2) updateState('inherent1', false);
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

                        {evilScatters && (
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
                        {!evilScatters && locked && (
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
                    <div className="echo-buff-name">Thunder Begets Life</div>
                </div>
                <div className="echo-buff-effect"> <h4 style={{ marginBottom: 'unset' }}>Thunder Spell - Yin and Yang</h4>
                    <div className="echo-buff-effect"> <span className='highlight'>Thunder Spell - Yin and Yang</span> increases the grants <span className='highlight'>10% Resonance Skill DMG Bonus</span> to all active Resonators in the team.</div>
                </div>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.yinAndYang || false}
                        onChange={() => {
                            toggleState('yinAndYang');
                        }}
                    />
                    Enable
                </label>
                <div className="echo-buff-effect"> <h4 style={{ marginBottom: 'unset' }}>Thunder Spell - Heaven, Earth, Mind</h4>
                    <div className="echo-buff-effect">
                        <span className="highlight">Thunder Spell - Heaven, Earth, Mind</span> grants <span className="highlight">30% Resonance Skill DMG Bonus</span> to all active Resonators in the team.</div>
                </div>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.heavenEarthMind || false}
                        onChange={() => {
                            toggleState('heavenEarthMind');
                        }}
                    />
                    Enable
                </label>
            </div>

            <div className="echo-buff">
                <div className="echo-buff-header">
                    <div className="echo-buff-name">Outro Skill: Exorcist In Command</div>
                </div>
                <div className="echo-buff-effect">
                    Heal the nearby Resonator who activates Buling's Outro Skill by <span className="highlight">16%</span> of Buling's ATK per second for 8s
                    . All nearby Resonators in the team have their DMG Amplified by <span className="highlight">15%</span> for 30s.
                </div>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.exorcistInCommand || false}
                        onChange={() => {
                            toggleState('exorcistInCommand');
                        }}
                    />
                    Enable
                </label>
            </div>

            <div className="echo-buff">
                <div className="echo-buff-header">
                    <div className="echo-buff-name">S6: "Almighty Celestial Lord of Thunder and Lightning"</div>
                </div>
                <div className="echo-buff-effect">
                    When the <span className="highlight">Thunder Spell: Heaven, Earth, Mind</span> state is active, all nearby Resonators in the team have their <span className="highlight">Resonance Skill DMG Bonus</span> increased to <span className="highlight">50%</span>.
                </div>
                <label className="modern-checkbox"
                       style={{
                           opacity: !activeStates.heavenEarthMind ? 0.5 : 1,
                           cursor: activeStates.heavenEarthMind ? 'pointer' : 'not-allowed'
                       }}>
                    <input
                        type="checkbox"
                        checked={(activeStates.almightyCelestialLord && activeStates.heavenEarthMind) || false}
                        onChange={() => {
                            toggleState('almightyCelestialLord');
                        }}
                        disabled={!activeStates.heavenEarthMind}
                    />
                    Enable
                    {!activeStates.heavenEarthMind && (
                        <span style={{ marginLeft: '8px', fontSize: '12px', color: 'gray' }}>
                            (Requires Thunder Spell - Heaven, Earth, Mind)
                        </span>
                    )}
                </label>
            </div>
        </div>
    );
}