import React from 'react';
import {highlightKeywordsInText} from "@shared/constants/echoSetData.jsx";

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
                    <p>
                        {highlightKeywordsInText(`When the Resonator dashes or dodges, increases ATK by ${currentParamValues[0]}.
                            Increases Dodge Counter DMG by ${currentParamValues[1]}, lasting for 8s. When Dodge Counter is performed, heals
                        ${currentParamValues[3]} of the Resonator's Max HP. This effect can be triggered 1 time(s) every 6s.`, keywords)}
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