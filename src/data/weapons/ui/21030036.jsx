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
                    <p>{highlightKeywordsInText(`ATK is increased by ${currentParamValues[0]}.`, keywords)}</p>
                </div>

                <div className="status-toggle-box-inner">
                    <p>
                        {highlightKeywordsInText(`Upon dealing Echo Skill DMG, gain ${currentParamValues[1]} 
                        Heavy Attack DMG Amplification for 6s.`, keywords)}
                    </p>
                    <label className="modern-checkbox">
                        <input
                            type="checkbox"
                            checked={activeStates.firstP1 || false}
                            onChange={() => toggleState('firstP1')}
                        />
                        Enable
                    </label>
                    <p>
                        {highlightKeywordsInText(`Upon dealing Heavy Attack DMG, gain ${currentParamValues[1]} 
                        Echo Skill DMG Amplification for 6s.`, keywords)}
                    </p>
                    <label className="modern-checkbox">
                        <input
                            type="checkbox"
                            checked={activeStates.firstP2 || false}
                            onChange={() => toggleState('firstP2')}
                        />
                        Enable
                    </label>
                    <p>
                        {highlightKeywordsInText(`DMG Amplification on each attack is capped at ${currentParamValues[1]}. While both effects are active, dealing damage ignores ${currentParamValues[6]} of the target's DEF.`, keywords)}
                    </p>
                </div>
            </div>
        </div>
    );
}