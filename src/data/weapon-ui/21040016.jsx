import React from 'react';
import DropdownSelect from "../../components/DropdownSelect.jsx";
import {elementToAttribute} from "../../utils/attributeHelpers.js";
import {highlightKeywordsInText} from "../../constants/echoSetData.jsx";

export function WeaponUI({
                             activeStates,
                             toggleState,
                             currentParamValues = [],
    keywords
                         }) {
    return (
        <div className="status-toggles">
            <div className="status-toggle-box">
                <div className="status-toggle-box-inner">
                    <p>{highlightKeywordsInText(`Gain ${currentParamValues[0]} Attribute DMG Bonus.`, keywords)}</p>
                </div>

                <div className="status-toggle-box-inner">
                    <p>
                        {highlightKeywordsInText(`When using Resonance Liberation, the wielder gains ${currentParamValues[1]} Resonance Liberation DMG Bonus for 8s.
                            This effect can be extended by 5s each time Resonance Skills are cast, up to 3 times.`, keywords)}
                    </p>
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
    const attr = parseFloat(currentParamValues[0]);
    const firstP = parseFloat(currentParamValues[1]);

    for (const elem of Object.values(elementToAttribute)) {
        mergedBuffs[elem] = (mergedBuffs[elem] ?? 0) + attr;
    }

    if (characterState?.activeStates?.firstP) {
        mergedBuffs.resonanceLiberation = (mergedBuffs.resonanceLiberation ?? 0) + firstP;
    }


    return { mergedBuffs, combatState, skillMeta };
}