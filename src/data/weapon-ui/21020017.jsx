import React from 'react';
import DropdownSelect from "../../components/DropdownSelect.jsx";
import {highlightKeywordsInText} from "../../constants/echoSetData.jsx";

export function WeaponUI({
                             currentParamValues = [],
                             characterRuntimeStates, setCharacterRuntimeStates, charId, keywords
                         }) {
    const stacks = characterRuntimeStates?.[charId]?.activeStates?.stacks ?? 0;
    keywords.push('Hiss')

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
                    <p>
                        {highlightKeywordsInText(`Gain 1 stack of Hiss when dealing damage to the target, with 1 stack generated every 1s.`, keywords)}
                    </p>
                    <p>
                        {highlightKeywordsInText(`Hiss: each stack increases the wielder's ATK by ${currentParamValues[3]} for 3s, stacking up to 10 times. 
                            Switching off the wielder clears all stacks. Gaining 10 stacks increases the wielder's Crit. Rate by ${currentParamValues[7]}.`, keywords)}
                    </p>
                </div>
                <label className="modern-checkbox">
                    <DropdownSelect
                        label=""
                        options={Array.from({ length: 11 }, (_, i) => i)}
                        value={stacks}
                        onChange={handleChange}
                        width="80px"
                    />
                    Stacks
                </label>
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
    const stacks = characterState?.activeStates?.stacks ?? 0;
    const atk = parseFloat(currentParamValues[3]) * stacks;
    const critRate = parseFloat(currentParamValues[7])

    mergedBuffs.atkPercent = (mergedBuffs.atkPercent ?? 0) + atk;

    if (stacks >= 10) {
        mergedBuffs.critRate = (mergedBuffs.critRate ?? 0) + critRate;
    }

    return { mergedBuffs, combatState, skillMeta };
}