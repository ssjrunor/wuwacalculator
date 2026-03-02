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
                    <p>{highlightKeywordsInText(`When the Resonator's HP is above 80%, increases ATK by ${currentParamValues[1]}.`, keywords)}</p>
                </div>
                <label className="modern-checkbox">
                    <input
                        type="checkbox"
                        checked={activeStates.firstP || false}
                        onChange={() => toggleState('firstP')}
                    />
                    Enable
                </label>
                <div className="status-toggle-box-inner">
                    <p>
                        {highlightKeywordsInText(
                            `When the Resonator's HP is below ${currentParamValues[2]}, gives ${currentParamValues[3]} healing when dealing Basic Attack DMG or Heavy Attack DMG. This effect can be triggered 1 time(s) every 8s.`,
                            keywords
                        )}
                    </p>
                </div>
            </div>
        </div>
    );
}