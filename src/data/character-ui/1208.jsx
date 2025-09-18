import React from "react";
import {formatDescription} from "../../utils/formatDescription.js";
import DropdownSelect from "../../components/DropdownSelect.jsx";
import {highlightKeywordsInText} from "../../constants/echoSetData.jsx";
import {attributeColors} from "../../utils/attributeHelpers.js";

export default function GalbrenaUI( {setCharacterRuntimeStates, charId, activeStates, toggleState} ) {
    return (
        <div className="status-toggle-box">
            <div
                className="status-toggle-box-inner"
            >
                <h4 className={'highlight'} style={{ fontSize: '16px', fontWeight: 'bold' }}>Demon Hypostasis</h4>
                <div>
                    <p>Gain <span className="highlight">85%</span> <span style={{ color: attributeColors['fusion'], fontWeight: 'bold' }}>Fusion DMG Bonus</span> for <span className="highlight">Resonance Liberation - Hellfire Absolution</span> and all attacks while in <span className="highlight">Demon Hypostasis</span> for 14s</p>
                </div>
                <label className="modern-checkbox" onClick={(e) => e.stopPropagation()}>
                    <input
                        type="checkbox"
                        checked={activeStates.demonHypostasis || false}
                        onChange={() => toggleState('demonHypostasis')}
                    />
                    Enable
                </label>
            </div>
            <div
                className="status-toggle-box-inner"
            >
                <h4 className={'highlight'} style={{ fontSize: '16px', fontWeight: 'bold' }}>Burning Drive</h4>
                <div>
                    <p>Casting <span className="highlight">Intro Skill</span>, <span className="highlight">Hellstride</span>, <span className="highlight">Normal Attack - Seraphic Execution Basic Attack Stage 4</span>, <span className="highlight">Resonance Skill - Encroach</span>, <span className="highlight">Resonance Skill - Ascend of Malice</span>, and <span className="highlight">Resonance Skill - Ravage</span> increases <span className="highlight">Galbrena</span>'s ATK by <span className="highlight">20%</span> for 4s.</p>
                </div>
                <label className="modern-checkbox" onClick={(e) => e.stopPropagation()}>
                    <input
                        type="checkbox"
                        checked={activeStates.burningDrive || false}
                        onChange={() => toggleState('burningDrive')}
                    />
                    Enable
                </label>
            </div>
            <div className="status-toggle-box-inner">
                <h4 className={'highlight'} style={{ fontSize: '18px', fontWeight: 'bold' }}>Afterflame</h4>
                <div>
                    While in <span className='highlight'>Demon Hypostasis</span>, every point of <span className='highlight'>Afterflame</span> increases the DMG dealt through <span className='highlight'>Basic Attack - Seraphic Execution</span>, <span className='highlight'>Heavy Attack - Flamewing Verdict</span>, <span className='highlight'>Mid-air Attack - Hellsent Barrage</span>, <span className='highlight'>Resonance Skill - Ravage</span>,
                    and <span className='highlight'>Dodge Counter - Purgatory Scourge</span> by <span className='highlight'>1.5%</span>, up to <span className='highlight'>60%</span>, which is removed up exiting <span className='highlight'>Demon Hypostasis</span>.
                    When <span className='highlight'>Purging Flame</span> depletes or after staying in <span className='highlight'>Demon Hypostasis</span> for over 50s, <span className='highlight'>Demon Hypostasis</span> ends automatically.
                </div>
                <div className="slider-label-with-input" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label style={{ fontWeight: 'bold', marginTop: '0.5rem' }}>
                        Afterflame
                    </label>
                    <input
                        style={{ marginTop: '0.5rem' }}
                        type="number"
                        className="character-level-input"
                        min="0"
                        max="40"
                        value={activeStates.afterflame ?? 0}
                        onChange={(e) => {
                            const val = Math.max(0, Math.min(40, Number(e.target.value) || 0));
                            setCharacterRuntimeStates(prev => ({
                                ...prev,
                                [charId]: {
                                    ...(prev[charId] ?? {}),
                                    activeStates: {
                                        ...(prev[charId]?.activeStates ?? {}),
                                        afterflame: val
                                    }
                                }
                            }));
                        }}
                    />
                    {!activeStates.demonHypostasis && (
                        <span style={{ marginLeft: '8px', fontSize: '12px', color: 'gray' }}>
                (Only effective while Demon Hypostasis is active)
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
    const activeStates = characterRuntimeStates?.[charId]?.activeStates ?? {};
    const charLevel = characterRuntimeStates?.[charId]?.CharacterLevel ?? 1;
    keywords.push(
        'Mid-air Attack',
        '-',
        'Heavy Attack',
        'Flamewing Verdict',
        'Volley of Death',
        'Dodge Counter',
        'Seraphic Execution',
        'Basic Attack',
        'Intro Skill',
        'Resonance Liberation',
        'Ascend of Malice',
        'Encroach',
        'Ravage',
        'Resonance Skill',
        'Stage 4',
        'Fated End'
    );

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

                const oathbound = lowerName.includes("oathbound hunt");
                const unlockLevel = oathbound ? 50 : 70;
                const locked = charLevel < unlockLevel;

                if (locked) {
                    if (oathbound && activeStates.inherent2) updateState('inherent1', false);
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

                        {oathbound && (
                            <div className="slider-label-with-input" style={{
                                marginTop: '8px',
                                opacity: locked ? 0.5 : 1,
                                cursor: !locked ? 'auto' : 'not-allowed'
                            }}>
                                <div
                                    className="slider-label-with-input"
                                    style={{ display: 'flex', alignItems: 'center', gap: '10px',
                                        opacity: locked ? 0.5 : 1,
                                        cursor: !locked ? 'pointer' : 'not-allowed'
                                    }}
                                >
                                    <DropdownSelect
                                        label=""
                                        options={[0, 1, 2, 3, 4, 5]}
                                        value={activeStates.oathbound ?? 0}
                                        onChange={(newValue) => updateState('oathbound', newValue)}
                                        width="80px"
                                        disabled={locked}
                                    />
                                    {locked && (
                                        <span style={{ fontSize: '12px', color: 'gray' }}>
                                        (Unlocks at Lv. {unlockLevel})
                                    </span>
                                    )}
                                </div>
                                {locked && (
                                    <span style={{ marginLeft: '8px', fontSize: '12px', color: 'gray' }}>
                                        (Unlocks at Lv. {unlockLevel})
                                    </span>
                                )}
                            </div>
                        )}
                        {!oathbound && locked && (
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

export function GalbrenaSequenceToggles({
                                            nodeKey,
                                            sequenceToggles,
                                            toggleSequence,
                                            currentSequenceLevel,
                                        }) {
    if (!['1', '2', '4', '6'].includes(String(nodeKey))) return null;

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
                    <div className="echo-buff-name">S4: Carry Forth This Fading Spark</div>
                </div>
                <div className="echo-buff-effect">
                    When Resonators in the team cast <span className="highlight">Echo Skill</span>, all Resonators in the team gain <span className="highlight">20%</span> all-Attribute DMG Bonus for 20s.
                </div>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.fadingSpark || false}
                        onChange={() => toggleState('fadingSpark')}
                    />
                    Enable
                </label>
            </div>
        </div>
    );
}