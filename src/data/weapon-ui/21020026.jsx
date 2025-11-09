import React from 'react';
import DropdownSelect from "../../components/DropdownSelect.jsx";
import {highlightKeywordsInText} from "../../constants/echoSetData.jsx";

export function WeaponUI({
                             activeStates,
                             toggleState,
                             currentParamValues = [],
                             characterRuntimeStates, setCharacterRuntimeStates, charId, keywords
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
                        {highlightKeywordsInText(`When dealing Basic Attack DMG, the wielder gains ${currentParamValues[1]} Basic Attack DMG Bonus for 14s.
                            This effect can be triggered once per second, stacking up to 3 times.`, keywords)}
                    </p>
                    <label className="modern-checkbox">
                        <DropdownSelect
                            label=""
                            options={[0, 1, 2, 3]}
                            value={stacks}
                            onChange={handleChange}
                            width="80px"
                        />
                        Stacks
                    </label>
                    <p>
                        {highlightKeywordsInText(`When the wielder's Concerto Energy is consumed, gain ${currentParamValues[4]} Basic DMG Bonus for 10s.
                            This effect can be triggered once per second and ends when the wielder is switched off the field.`, keywords)}
                    </p>
                    <label className="modern-checkbox">
                        <input
                            type="checkbox"
                            checked={activeStates.secondP || false}
                            onChange={() => toggleState('secondP')}
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
                                     currentParamValues = []
                                 }) {
    const stacks = (characterState?.activeStates?.stacks ?? 0) * 10;
    const atk = parseFloat(currentParamValues[0]);
    const basic = parseFloat(currentParamValues[4]);

    mergedBuffs.atkPercent = (mergedBuffs.atkPercent ?? 0) + atk;
    mergedBuffs.basicAtk = (mergedBuffs.basicAtk ?? 0) + stacks;

    if (characterState?.activeStates?.secondP) {
        mergedBuffs.basicAtk = (mergedBuffs.basicAtk ?? 0) + basic;
    }

    return { mergedBuffs, combatState, skillMeta };
}