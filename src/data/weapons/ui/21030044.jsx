import React from 'react';
import {highlightKeywordsInText} from "@shared/constants/echoSetData.jsx";

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
                    <p>{highlightKeywordsInText(`When Intro Skill is cast, Resonance Skill DMG Bonus by ${currentParamValues[0]} for 15s.`, keywords)}</p>
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