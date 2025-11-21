import React, {useEffect} from "react";
import {formatDescription} from "../../utils/formatDescription.js";
import DropdownSelect from "../../components/utils-ui/DropdownSelect.jsx";
import {highlightKeywordsInText} from "../../constants/echoSetData.jsx";
import {attributeColors} from "../../utils/attributeHelpers.js";

export default function AugustaUI({
                                      activeStates,
                                      toggleState,
                                      currentSequenceLevel,
                                      setCharacterRuntimeStates,
                                      charId,
                                      characterRuntimeStates
                                  }) {
    const crownofWills = characterRuntimeStates?.[charId]?.activeStates?.crownofWills ?? 0;

    const handleChange = (newValue) => {
        setCharacterRuntimeStates(prev => ({
            ...prev,
            [charId]: {
                ...(prev[charId] ?? {}),
                activeStates: {
                    ...(prev[charId]?.activeStates ?? {}),
                    crownofWills: newValue
                }
            }
        }));
    };

    let content;

    if (currentSequenceLevel >= 6) {
        content = (
            <>
                <div>
                    <p>
                        <span style={{ color: attributeColors['electro'], fontWeight: 'bold' }}>Electro DMG Bonus</span> is increased by <span className="highlight">15%</span>, stacking up to 4 times.
                    </p>
                </div>
                <DropdownSelect
                    label=""
                    options={[0, 1, 2, 3, 4]}
                    value={crownofWills}
                    onChange={handleChange}
                    width="80px"
                />
            </>
        );
    } else if (currentSequenceLevel >= 1) {
        content = (
            <>
                <div>
                    <p>
                        <span style={{ color: attributeColors['electro'], fontWeight: 'bold' }}>Electro DMG Bonus</span> is increased by <span className="highlight">15%</span>, stacking up to 2 times.
                    </p>
                </div>
                <DropdownSelect
                    label=""
                    options={[0, 1, 2]}
                    value={crownofWills}
                    onChange={handleChange}
                    width="80px"
                />
            </>
        );
    } else {
        content = (
            <>
                <div>
                    <p>
                        <span style={{ color: attributeColors['electro'], fontWeight: 'bold' }}>Electro DMG Bonus</span> is increased by <span className="highlight">15%</span>.
                    </p>
                </div>
                <label className="modern-checkbox" onClick={(e) => e.stopPropagation()}>
                    <input
                        type="checkbox"
                        checked={activeStates.crownofWills || false}
                        onChange={() => toggleState('crownofWills')}
                    />
                    Enable
                </label>
            </>
        );
    }

    useEffect(() => {
        setCharacterRuntimeStates(prev => {
            const prevValue = prev?.[charId]?.activeStates?.crownofWills;

            let newValue;

            if (currentSequenceLevel >= 6) {
                newValue = typeof prevValue === 'number' ? Math.min(prevValue, 4) : 0;
            } else if (currentSequenceLevel >= 1) {
                newValue = typeof prevValue === 'number' ? Math.min(prevValue, 2) : 0;
            } else {
                newValue = !!prevValue;
            }

            return {
                ...prev,
                [charId]: {
                    ...(prev[charId] ?? {}),
                    activeStates: {
                        ...(prev[charId]?.activeStates ?? {}),
                        crownofWills: newValue
                    }
                }
            };
        });
    }, [currentSequenceLevel, charId]);

    return (
        <div className="status-toggle-box">
            <div className="status-toggle-box-inner">
                <h4 className="highlight" style={{ fontSize: '16px', fontWeight: 'bold' }}>Crown of Wills</h4>
                {content}
            </div>
        </div>
    );
}

export function AugustaSequenceToggles({ nodeKey, sequenceToggles, toggleSequence, currentSequenceLevel }) {
    const validKeys = ['4'];
    if (!validKeys.includes(String(nodeKey))) return null;

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

export function buffUI({ activeStates, toggleState, attributeColors }) {
    return (
        <div className="echo-buffs">
            <div className="echo-buff">
                <div className="echo-buff-header">
                    <div className="echo-buff-name">Outro Skill: Battlesong of the Unyielding</div>
                </div>
                <div className="echo-buff-effect">
                    The next Resonator switched onto the field gains <span className='highlight'>15%</span> DMG Amplification for all Attributes for 14s, which end immediately if this Resonator is switched out.
                </div>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.battlesong || false}
                        onChange={() => toggleState('battlesong')}
                    />
                    Enable
                </label>
            </div>
            <div className="echo-buff">
                <div className="echo-buff-header">
                    <div className="echo-buff-name">S4: Ascent in Sun and Glory</div>
                </div>
                <div className="echo-buff-effect">
                    Casting Intro Skill - <span className='highlight'>Stride of Goldenflare</span> increases the ATK of all Resonators in the team by  <span className='highlight'>20%</span> for 30s.
                </div>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.ascentinSun || false}
                        onChange={() => toggleState('ascentinSun')}
                    />
                    Enable
                </label>
            </div>
        </div>
    );
}