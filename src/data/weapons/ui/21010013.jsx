import React from 'react';
import {highlightKeywordsInText} from "@/constants/echoSetData.jsx";

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
                        {highlightKeywordsInText(`When Intro Skill is cast, increases ATK by ${currentParamValues[0]}, lasting for 10s`, keywords)}.
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