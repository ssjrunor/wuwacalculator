import React from 'react';
import {highlightKeywordsInText} from "@shared/constants/echoSetData.jsx";

export function WeaponUI({
                             activeStates,
                             toggleState,
                             currentParamValues = [],
                             keywords
                         }) {
    keywords?.push('Tune Rupture', 'Fusion Burst', 'Resonance Liberation');

    return (
        <div className="status-toggles">
            <div className="status-toggle-box">
                <div className="status-toggle-box-inner">
                    <p>{highlightKeywordsInText(`Increases All-Attribute DMG Bonus by ${currentParamValues[0]}.`, keywords)}</p>
                </div>

                <div className="status-toggle-box-inner">
                    <p>
                        {highlightKeywordsInText(`When inflicting Tune Rupture - Shifting or Fusion Burst, the wielder's Resonance Liberation DMG ignores ${currentParamValues[1]} DEF and ${currentParamValues[2]} Fusion RES on targets for ${currentParamValues[3]}s.`, keywords)}
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
