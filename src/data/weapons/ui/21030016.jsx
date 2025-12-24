import React from 'react';
import {highlightKeywordsInText} from "@/constants/echoSetData.jsx";

export function lastDanceUI({
                                     activeStates,
                                     toggleState,
                                     currentParamValues = [],
    keywords
                                 }) {
    return (
        <div className="status-toggles">
            <div className="status-toggle-box">
                <div className="status-toggle-box-inner">
                    <p>{highlightKeywordsInText(`Increases ATK by ${currentParamValues[0]}`, keywords)}</p>
                </div>

                <div className="status-toggle-box-inner">
                    <p>
                        {highlightKeywordsInText(`Every time Intro Skill or Resonance Liberation is cast, Resonance Skill DMG Bonus increases by ${currentParamValues[1]}.`, keywords)}
                    </p>
                    <label className="modern-checkbox">
                        <input
                            type="checkbox"
                            checked={activeStates.eulogy || false}
                            onChange={() => toggleState('eulogy')}
                        />
                        Enable
                    </label>
                </div>
            </div>
        </div>
    );
}

export const WeaponUI = lastDanceUI;