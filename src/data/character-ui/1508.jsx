import React from "react";
import {formatDescription} from "../../utils/formatDescription.js";
import DropdownSelect from "../../components/DropdownSelect.jsx";
import {attributeColors} from "../../utils/attributeHelpers.js";
import {highlightKeywordsInText} from "../../constants/echoSetData.jsx";

export default function ChisaUI({ setCharacterRuntimeStates, charId, activeStates, toggleState, characterRuntimeStates }) {
/*
    const combatState = characterRuntimeStates[charId]?.CombatState;
    const havocBane = combatState?.havocBane ?? 0;
*/

    return (
        <div className="status-toggles">
            <div className="status-toggle-box">
                <div className="status-toggle-box-inner">
                    <h4 className={'highlight'} style={{ fontSize: '18px', fontWeight: 'bold' }}>Thread of Bane</h4>
                    <div>
                        <p>
                            When dealing damage to targets affected by <span className='highlight'>Unseen Snare</span>, ignore <span className='highlight'>18%</span> of their DEF.
                        </p>
                    </div>
                    <label className="modern-checkbox">
                        <input
                            type="checkbox"
                            checked={activeStates.threadOfBane || false}
                            onChange={() => toggleState('threadOfBane')}
                        />
                        Enable
                    </label>
                    {/*{activeStates.threadOfBane &&
                        <span style={{ fontSize: '12px', color: 'gray' }}>
                            ({havocBane > 6 ? '6+' : havocBane} {havocBane !== 1 ? 'stacks' : 'stack'} of <span style={{ color: attributeColors['havoc'], fontWeight: 'bold' }}>Havoc Bane</span>)
                        </span>
                    }*/}
                </div>
                <div className="status-toggle-box-inner">
                    <h4 className={'highlight'} style={{ fontSize: '18px', fontWeight: 'bold' }}>Woven Myriad - Convergence</h4>
                    <div>
                        <p> The DMG Multipliers of <span className='highlight'>Sawring - Blitz</span> and <span className='highlight'>Sawring - Eradication</span> are increased by <span className='highlight'>120%</span>
                            . Ring of Chainsaw consumed by <span className='highlight'>Sawring- Blitz</span> additionally increases the DMG Multiplier of <span className='highlight'>Sawring - Eradication</span> by <span className='highlight'>120%</span>.
                        </p>
                    </div>
                    <label className="modern-checkbox">
                        <input
                            type="checkbox"
                            checked={activeStates.myriadConvergence || false}
                            onChange={() => toggleState('myriadConvergence')}
                        />
                        Enable
                    </label>
                </div>
                <div className="status-toggle-box-inner">
                    <h4 className={'highlight'} style={{ fontSize: '18px', fontWeight: 'bold' }}>Ring of Chainsaw</h4>
                    <div>
                        <p>Every 1 points of <span className='highlight'>Ring of Chainsaw</span> consumed by <span className='highlight'>Sawring - Blitz</span> increases the DMG Multiplier of the next <span className='highlight'>Sawring - Eradication</span>, up to 100 points.</p>
                    </div>
                    <div className="slider-label-with-input" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <label htmlFor="blaze-consumed" style={{ fontWeight: 'bold' }}>
                            Ring of Chainsaw Consumed
                        </label>
                        <input
                            type="number"
                            className="character-level-input"
                            min="0"
                            max="100"
                            value={activeStates.ringOfChainsaw ?? 0}
                            onChange={(e) => {
                                const val = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                                setCharacterRuntimeStates(prev => ({
                                    ...prev,
                                    [charId]: {
                                        ...(prev[charId] ?? {}),
                                        activeStates: {
                                            ...(prev[charId]?.activeStates ?? {}),
                                            ringOfChainsaw: val
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

                const allEndsHere = lowerName.includes("all ends here");
                const unlockLevel = allEndsHere ? 70 : 50;
                const locked = charLevel < unlockLevel;

                if (locked) {
                    if (allEndsHere && activeStates.inherent2) updateState('inherent2', false);
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

                        {allEndsHere && (
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
                        {!allEndsHere && locked && (
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

export function chisaSequenceToggles({
                                         nodeKey,
                                         sequenceToggles,
                                         toggleSequence,
                                         currentSequenceLevel,
                                         characterRuntimeStates,
                                         setCharacterRuntimeStates,
                                         charId
                                     }) {
    // Only show for specific sequence nodes
    const validKeys = ['1', '6'];
    if (!validKeys.includes(String(nodeKey))) return null;

    const requiredLevel = Number(nodeKey);
    const isDisabled = currentSequenceLevel < requiredLevel;

    // Simple reusable checkbox renderer
    const renderCheckbox = (label, key) => (
        <label className="modern-checkbox" style={{ opacity: isDisabled ? 0.5 : 1 }}>
            <input
                type="checkbox"
                checked={sequenceToggles[key] || false}
                onChange={() => toggleSequence(key)}
                disabled={isDisabled}
            />
            {label}
        </label>
    );

    // Numeric input tied to runtime state
    const renderInputField = (label, key) => {
        const currentValue =
            characterRuntimeStates?.[charId]?.activeStates?.[key] ?? 0;

        return (
            <div
                className="slider-label-with-input"
                style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
            >
                <label htmlFor={key} style={{ fontWeight: 'bold' }}>
                    {label}
                </label>
                <input
                    id={key}
                    type="number"
                    className="character-level-input"
                    step="5000"
                    min="0"
                    max="100000000"
                    style={{ width: '70px' }}
                    value={currentValue}
                    disabled={isDisabled}
                    onChange={(e) => {
                        const val = Math.max(
                            0,
                            Math.min(100_000_000, Number(e.target.value) || 0)
                        );
                        setCharacterRuntimeStates((prev) => ({
                            ...prev,
                            [charId]: {
                                ...(prev[charId] ?? {}),
                                activeStates: {
                                    ...(prev[charId]?.activeStates ?? {}),
                                    [key]: val
                                }
                            }
                        }));
                    }}
                />
            </div>
        );
    };

    // Sequence 1 logic: toggle → reveal input
    if (nodeKey === '1') {
        return (
            <div className="sequence-checkbox-group">
                {renderCheckbox('Enable', 1)}
                {sequenceToggles[1] &&
                    renderInputField("Enemy's Current HP", 'chisaSeq1EnemyHP')}
            </div>
        );
    }

    return renderCheckbox('Enable', nodeKey);
}

export function buffUI({ activeStates, toggleState, attributeColors, characterRuntimeStates, charId }) {
    const combatState = characterRuntimeStates[charId]?.CombatState;
    //const havocBane = combatState.havocBane ?? 0;

    return (
        <div className="echo-buffs">
            <div className="echo-buff">
                <div className="echo-buff-header">
                    <div className="echo-buff-name">Thread of Bane</div>
                </div>
                <div className="echo-buff-effect">
                    When dealing damage to targets affected by <span className='highlight'>Unseen Snare</span>, ignore <span className='highlight'>18%</span> of their DEF.
                </div>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.threadOfBane || false}
                        onChange={() => toggleState('threadOfBane')}
                    />
                    Enable
                    {/*{activeStates.threadOfBane &&
                        <span style={{ fontSize: '12px', color: 'gray' }}>
                            ({havocBane > 6 ? '6+' : havocBane} {havocBane !== 1 ? 'stacks' : 'stack'} of <span style={{ color: attributeColors['havoc'], fontWeight: 'bold' }}>Havoc Bane</span>)
                        </span>
                    }*/}
                </label>
            </div>

            <div className="echo-buff">
                <div className="echo-buff-header">
                    <div className="echo-buff-name">S2: Into the Web of Endless Bonds</div>
                </div>
                <div className="echo-buff-effect">
                    Nearby Resonators in the team in <span className="highlight">Thread of Bane</span> gain <span className="highlight">50%</span> All Attribute DMG Bonus.
                </div>
                <label className="modern-checkbox"
                       style={{
                           opacity: !activeStates.threadOfBane ? 0.5 : 1,
                           cursor: activeStates.threadOfBane ? 'pointer' : 'not-allowed'
                       }}
                >
                    <input
                        type="checkbox"
                        checked={(activeStates.endlessBonds && activeStates.threadOfBane) || false}
                        onChange={() => toggleState('endlessBonds')}
                        disabled={!activeStates.threadOfBane}
                    />
                    Enable
                    {!activeStates.threadOfBane && (
                        <span style={{ marginLeft: '8px', fontSize: '12px', color: 'gray' }}>
                            (Requires Thread of Bane)
                        </span>
                    )}
                </label>
            </div>

            <div className="echo-buff">
                <div className="echo-buff-header">
                    <div className="echo-buff-name">S6: Thus, Hope is Rekindled with the Rising Dawn</div>
                </div>
                <div className="echo-buff-effect">
                    <span className="highlight">
                        Targets affected by <span className="highlight">Unseen Snare - Finality</span> take <span className="highlight">30%</span> more DMG from the Negative Statuses.</span>.
                </div>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.risingDawn || false}
                        onChange={() => toggleState('risingDawn')}
                    />
                    Enable
                </label>
            </div>
        </div>
    );
}