import React from "react";
import {formatDescription} from "@shared/utils/formatDescription.js";
import DropdownSelect from "@/shared/ui/common/DropdownSelect.jsx";
import {highlightKeywordsInText} from "@shared/constants/echoSetData.jsx";

export default function JiyanUI({ activeStates, toggleState }) {
    return (
        <div className="status-toggles">
            <div className="status-toggle-box">
                <h4 className={'highlight'} style={{ fontSize: '18px', fontWeight: 'bold' }}>Qingloong at War</h4>
                <p>When casting Resonance Skill <span className='highlight'>Windqueller</span>, if <span className='highlight'>Jiyan</span> has <span className='highlight'>30</span> or more "<span className='highlight'>Resolve</span>", he consumes <span className='highlight'>30</span> "<span className='highlight'>Resolve</span>" to increase the DMG of this Resonance Skill <span className='highlight'>Windqueller</span> by <span className='highlight'>20%</span>.
                    When <span className='highlight'>Jiyan</span> is in <span className='highlight'>Qingloong</span> Mode, DMG of Resonance Skill <span className='highlight'>Windqueller</span> is increased by <span className='highlight'>20%</span> and no longer consumes "<span className='highlight'>Resolve</span>"</p>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.war || false}
                        onChange={() => {
                            toggleState('war');
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
                                         unlockLevels = [],
                                         charLevel = 1,
    keywords
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
                const balance = lowerName.includes("heavenly balance");
                const taming = lowerName.includes("tempest taming");

                const unlockLevel = unlockLevels[index] ?? 1;
                const locked = charLevel < unlockLevel;

                if (locked) {
                    if (balance && activeStates.inherent1) {
                        toggleState('inherent1');
                    }
                    if (taming && activeStates.inherent2) {
                        toggleState('inherent2');
                    }
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

                        {balance && (
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

                        {taming && (
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


export function jiyanSequenceToggles({
                                        nodeKey,
                                        sequenceToggles,
                                        toggleSequence,
                                        currentSequenceLevel,
                                        setCharacterRuntimeStates,
                                        charId
                                    }) {
    const validKeys = ['2', '3', '4', '5', '6'];
    if (!validKeys.includes(String(nodeKey))) return null;

    const requiredLevel = Number(nodeKey);
    const isDisabled = currentSequenceLevel < requiredLevel;

    if (String(nodeKey) === '5') {
        const value = sequenceToggles['5_value'] ?? 0;

        return (
            <div className="slider-label-with-input" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                    id="blaze-consumed"
                    type="number"
                    className="character-level-input"
                    min="0"
                    max="15"
                    value={value}
                    onChange={(e) => {
                        const val = Math.max(0, Math.min(15, Number(e.target.value) || 0));
                        setCharacterRuntimeStates(prev => ({
                            ...prev,
                            [charId]: {
                                ...(prev[charId] ?? {}),
                                sequenceToggles: {
                                    ...(prev[charId]?.sequenceToggles ?? {}),
                                    '5_value': val
                                }
                            }
                        }));
                    }}
                />
            </div>
        );
    } else if (String(nodeKey) === '6') {
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

export function buffUI({ activeStates, toggleState }) {
    return (
        <div className="echo-buffs">
            <div className="echo-buff">
                <div className="echo-buff-header">
                    <div className="echo-buff-name">S4: Prudence</div>
                </div>
                <div className="echo-buff-effect">
                    When casting Resonance Liberation <span className="highlight">Emerald Storm: Prelude</span> or Resonance Liberation <span className="highlight">Emerald Storm: Finale</span>, the H<span className="highlight">eavy Attack DMG Bonus</span> of all team members is increased by <span className="highlight">25%</span> for 30s.
                </div>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.prudence || false}
                        onChange={() => toggleState('prudence')}
                    />
                    Enable
                </label>
            </div>
        </div>
    );
}