import React from 'react';
import {highlightKeywordsInText} from "@/constants/echoSetData.jsx";

export function WeaponUI({
                             activeStates,
                             toggleState,
                             currentParamValues = [],
                             keywords
                         }) {
    keywords?.push('Basic Attack DMG Amplification', 'Spectro DMG Bonus', 'Basic Attack DMG');

    return (
        <div className="status-toggles">
            <div className="status-toggle-box">
                <div className="status-toggle-box-inner">
                    <p>{highlightKeywordsInText(`Increases ATK by ${currentParamValues[0]}.`, keywords)}</p>
                </div>

                <div className="status-toggle-box-inner">
                    <p>
                        {highlightKeywordsInText(`Each time Intro Skill or Resonance Skill is cast, the wielder gains ${currentParamValues[1]} Basic Attack DMG Amplification for ${currentParamValues[2]}s.`, keywords)}
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

                <div className="status-toggle-box-inner">
                    <p>
                        {highlightKeywordsInText(`Dealing Basic Attack DMG increases the wielder's Spectro DMG Bonus by ${currentParamValues[3]}, and the wielder ignores ${currentParamValues[4]} of the target's DEF for ${currentParamValues[5]}s.`, keywords)}
                    </p>
                    <label className="modern-checkbox">
                        <input
                            type="checkbox"
                            checked={activeStates.secondP || false}
                            onChange={() => toggleState('secondP')}
                        />
                        Enable
                    </label>
                </div>
            </div>
        </div>
    );
}
