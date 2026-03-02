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
                    <p>
                        {highlightKeywordsInText(
                            `Casting the Resonance Skill grants ${currentParamValues[0]} Resonance Energy and increases ATK by ${currentParamValues[1]}, lasting for 16s. This effect can be triggered once every 20s.`,
                            keywords
                        )}
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