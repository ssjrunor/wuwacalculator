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
    const huntersStacks = characterRuntimeStates?.[charId]?.activeStates?.huntersStacks ?? 0;

    const handleChange = (newValue) => {
        setCharacterRuntimeStates(prev => ({
            ...prev,
            [charId]: {
                ...(prev[charId] ?? {}),
                activeStates: {
                    ...(prev[charId]?.activeStates ?? {}),
                    huntersStacks: newValue
                }
            }
        }));
    };

    return (
        <div className="status-toggles">
            <div className="status-toggle-box">
                <div className="status-toggle-box-inner">
                    <p>
                        {highlightKeywordsInText(`Dealing Basic Attack or Heavy Attack DMG increases ATK by ${currentParamValues[0]} and grants ${currentParamValues[0]} Heavy
                         Attack DMG Bonus for 7s, stacking up to 4 times. This effect can be triggered 1 time every 1s.`, keywords)}
                    </p>
                    <label className="modern-checkbox">
                        <DropdownSelect
                            label=""
                            options={[0, 1, 2, 3, 4]}
                            value={huntersStacks}
                            onChange={handleChange}
                            width="80px"
                        />
                        Stacks
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

    const bonus = parseFloat(currentParamValues[0]) * (characterState?.activeStates?.huntersStacks ?? 0);
    mergedBuffs.heavyAtk = (mergedBuffs.heavyAtk ?? 0) + bonus;
    mergedBuffs.atkPercent = (mergedBuffs.atkPercent ?? 0) + bonus;

    return { mergedBuffs, combatState, skillMeta };
}