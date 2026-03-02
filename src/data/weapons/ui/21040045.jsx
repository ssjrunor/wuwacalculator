import React from 'react';
import DropdownSelect from "@/shared/ui/common/DropdownSelect.jsx";
import {highlightKeywordsInText} from "@shared/constants/echoSetData.jsx";

export function WeaponUI({
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
                        {highlightKeywordsInText(`Dealing damage to targets under Tune Strain - Interfered grants ${currentParamValues[1]} Basic Attack DMG Bonus for ${currentParamValues[2]}s, stacking up to ${currentParamValues[3]} times. This effect can be triggered ${currentParamValues[5]} time(s) every ${currentParamValues[4]}s. Retriggering the effect resets its duration.`, keywords)}
                    </p>
                    <label className="modern-checkbox">
                        <DropdownSelect
                            label=""
                            options={[0, 1, 2, 3, 4]}
                            value={stacks}
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
