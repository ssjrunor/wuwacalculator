import React from 'react';
import DropdownSelect from "../../components/DropdownSelect.jsx";
import {highlightKeywordsInText} from "../../constants/echoSetData.jsx";

export function WeaponUI({
                             activeStates,
                             toggleState,
                             currentParamValues = [],
                             characterRuntimeStates, setCharacterRuntimeStates, charId,
    keywords
                         }) {
    const stacks = characterRuntimeStates?.[charId]?.activeStates?.stacks ?? 0;

    const handleChange = (newValue) => {
        setCharacterRuntimeStates(prev => ({
            ...prev,
            [charId]: {
                ...(prev[charId] ?? {}),
                activeStates: {
                    ...(prev[charId]?.activeStates ?? {}),
                    stacks: newValue
                }
            }
        }));
    };

    return (
        <div className="status-toggles">
            <div className="status-toggle-box">
                <div className="status-toggle-box-inner">
                    <p>{highlightKeywordsInText(`Increase ATK by ${currentParamValues[0]}.`, keywords)}</p>
                </div>

                <div className="status-toggle-box-inner">
                    <p>
                        {highlightKeywordsInText(`While the wielder is on the field, using Resonance Skill grants ${currentParamValues[1]} Basic Attack DMG Bonus,
                            stacking up to 3 times for 6s.`, keywords)}
                    </p>
                    <label className="modern-checkbox">
                        <DropdownSelect
                            label=""
                            options={[0, 1, 2, 3]}
                            value={stacks}
                            onChange={handleChange}
                            width="80px"
                            disabled={activeStates.secondP === true}
                        />
                        Stacks
                    </label>

                    <p>
                        {highlightKeywordsInText(`At 3 stacks or above, casting Outro Skill consumes all stacks of this effect and grants the wielder
                        ${currentParamValues[5]} Basic Attack DMG Bonus for 27s, effective when the wielder is off the field.`, keywords)}
                    </p>
                    <label className="modern-checkbox">
                        <input
                            type="checkbox"
                            checked={activeStates.secondP || false}
                            onChange={() => {
                                toggleState('secondP');

                                if (!activeStates.secondP) {
                                    setCharacterRuntimeStates(prev => ({
                                        ...prev,
                                        [charId]: {
                                            ...(prev[charId] ?? {}),
                                            activeStates: {
                                                ...(prev[charId]?.activeStates ?? {}),
                                                stacks: 0
                                            }
                                        }
                                    }));
                                }
                            }}
                        />
                        Enable
                    </label>
                </div>
            </div>
        </div>
    );
}


export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     currentParamValues = [],
                                 }) {

    const atk = parseFloat(currentParamValues[0]);
    const stacks = characterState?.activeStates?.stacks ?? 0;
    const basic = parseFloat(currentParamValues[1]) * stacks;
    const secondP = parseFloat(currentParamValues[5]);

    mergedBuffs.basicAtk = (mergedBuffs.basicAtk ?? 0) + basic;
    mergedBuffs.atkPercent = (mergedBuffs.atkPercent ?? 0) + atk;

    if (characterState?.activeStates?.secondP) {
        mergedBuffs.basicAtk = (mergedBuffs.basicAtk ?? 0) + secondP;
    }

    return { mergedBuffs, combatState, skillMeta };
}