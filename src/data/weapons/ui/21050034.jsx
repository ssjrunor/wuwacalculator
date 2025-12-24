import React from 'react';
import {highlightKeywordsInText} from "@/constants/echoSetData.jsx";

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
                        {highlightKeywordsInText(`When Resonance Skill is cast, if the Resonator's HP is below 60%, heals ${currentParamValues[1]} of 
                            their Max HP. This effect can be triggered 1 time(s) every 8s. If the Resonator's HP is above 60%, 
                            increases ATK by ${currentParamValues[5]}, lasting for 10s.`, keywords)}
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