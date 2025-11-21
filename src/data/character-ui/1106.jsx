import {formatDescription} from "../../utils/formatDescription.js";
import React from "react";
import DropdownSelect from "../../components/utils-ui/DropdownSelect.jsx";
import {highlightKeywordsInText} from "../../constants/echoSetData.jsx";

export default function YouhuUI({ activeStates, toggleState }) {
    return (
        <div className="status-toggles">
            <div className="status-toggle-box">
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>Poetic Essence</h3>

                <div className="status-toggle-box-inner">
                    <h4 className={'highlight'} style={{ fontSize: '16px', fontWeight: 'bold' }}>Antithesis</h4>
                    <ul style={{ paddingLeft: '20px' }}>
                        <li>A pair of <span className='highlight'>Auspices</span>. Increase <span className='highlight'>Poetic Essence</span>'s DMG by <span className='highlight'>70%</span>.</li>
                    </ul>
                    <label className="modern-checkbox">
                        <input
                            type="checkbox"
                            checked={activeStates.antithesis || false}
                            onChange={() => toggleState('antithesis')}
                        />
                        Enable
                    </label>
                </div>

                <div className="status-toggle-box-inner">
                    <h4 className={'highlight'} style={{ fontSize: '16px', fontWeight: 'bold' }}>Triplet</h4>
                    <ul style={{ paddingLeft: '20px' }}>
                        <li>Three identical <span className='highlight'>Auspices</span>. Increase <span className='highlight'>Poetic Essence</span>'s DMG by <span className='highlight'>175%</span>.</li>
                    </ul>
                    <label className="modern-checkbox">
                        <input
                            type="checkbox"
                            checked={activeStates.triplet || false}
                            onChange={() => toggleState('triplet')}
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
                                         charLevel = 1,
                                         unlockLevels = [50, 70],
    keywords = [],
                                     }) {
    const charId = character?.Id ?? character?.id ?? character?.link;
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

    const skills = Object.values(character?.raw?.SkillTrees ?? {}).filter(
        node => node.Skill?.Type === "Inherent Skill"
    );

    return (
        <div className="inherent-skills">
            <h4 style={{ fontSize: '20px', marginBottom: '8px' }}>Inherent Skills</h4>

            {skills.map((node, index) => {
                const name = node.Skill?.Name ?? '';
                const lowerName = name.toLowerCase();

                const isInherent1 = lowerName.includes("treasured piece");
                const isInherent2 = lowerName.includes("rare find");

                const unlockLevel = unlockLevels[index] ?? 1;
                const locked = charLevel < unlockLevel;

                if (locked) {
                    if (isInherent1 && activeStates.inherent1) toggleState('inherent1');
                    if (isInherent2 && activeStates.inherent2) toggleState('inherent2');
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

                        {isInherent1 && (
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

                        {isInherent2 && (
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
                    </div>
                );
            })}
        </div>
    );
}

export function youhuSequenceToggles({
                                        nodeKey,
                                        sequenceToggles,
                                        toggleSequence,
                                        currentSequenceLevel,
                                        setCharacterRuntimeStates,
                                        charId
                                    }) {
    const validKeys = ['5', '6'];
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
                options={[0, 1, 2, 3, 4]}
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

export function buffUI({ activeStates, toggleState }) {
    return (
        <div className="echo-buffs">
            <div className="echo-buff">
                <div className="echo-buff-header">
                    <div className="echo-buff-name">Outro Skill: Timeless Classics</div>
                </div>
                <div className="echo-buff-effect">
                    The incoming Resonator has their <span className="highlight">Coordinated Attack DMG</span> Amplified by <span className="highlight">100%</span> for <span className="highlight">28s</span>.
                </div>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.timeless || false}
                        onChange={() => toggleState('timeless')}
                    />
                    Enable
                </label>
            </div>
        </div>
    );
}