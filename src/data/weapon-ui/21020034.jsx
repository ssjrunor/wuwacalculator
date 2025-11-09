import React from 'react';
import DropdownSelect from "../../components/DropdownSelect.jsx";
import {highlightKeywordsInText} from "../../constants/echoSetData.jsx";

export function WeaponUI({
                             activeStates,
                             toggleState,
                             currentParamValues = [],
    keywords,
                         }) {
    return (
        <div className="status-toggles">
            <div className="status-toggle-box">
                <div className="status-toggle-box-inner">
                    <p>
                        {highlightKeywordsInText(`When the Resonator's HP drops below ${currentParamValues[0]}, increases Heavy Attack DMG Bonus by ${currentParamValues[1]} and 
                            gives ${currentParamValues[3]} healing when dealing Heavy Attack DMG. This effect can be triggered 1 time(s) every 8s.`, keywords)}
                    </p>
                </div>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.firstP || false}
                        onChange={() => toggleState('firstP')}
                    />
                    Enable
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
    const heavy = parseFloat(currentParamValues[1]);

    if (characterState?.activeStates?.firstP) {
        mergedBuffs.heavyAtk = (mergedBuffs.heavyAtk ?? 0) + heavy;
    }

    return { mergedBuffs, combatState, skillMeta };
}