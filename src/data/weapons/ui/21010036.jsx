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
                    <p>{highlightKeywordsInText(`Increases ATK by ${currentParamValues[0]}.`, keywords)}</p>
                </div>

                <div className="status-toggle-box-inner">
                    <p>
                        {highlightKeywordsInText(`Performing Intro Skill or Resonance Liberation increases Resonance Liberation DMG by ${currentParamValues[1]}.`, keywords)}
                    </p>
                    <label className="modern-checkbox">
                        <input
                            type="checkbox"
                            checked={activeStates.firstP || false}
                            onChange={() => toggleState('firstP')}
                        />
                        Enable
                    </label>
                    <p>
                        {highlightKeywordsInText(
                            `Dealing Heavy Attack DMG extends this effect by 4s, up to 1 time. Each successful extension gives ${currentParamValues[5]} Fusion DMG Bonus to all Resonators in the team for 30s. Effects of the same name cannot be stacked.`,
                            keywords
                        )}
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