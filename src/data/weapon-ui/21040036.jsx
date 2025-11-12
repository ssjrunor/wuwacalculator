import React from 'react';
import {highlightKeywordsInText} from "../../constants/echoSetData.jsx";

export function blazingJusticeUI({
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
                        {highlightKeywordsInText(`When enabled, Basic Attacks ignore ${currentParamValues[1]} of enemy DEF and Spectro Frazzle DMG
                            is Amplified by ${currentParamValues[2]}.`, keywords)}
                    </p>
                    <label className="modern-checkbox">
                        <input
                            type="checkbox"
                            checked={activeStates.darknessBreaker || false}
                            onChange={() => toggleState('darknessBreaker')}
                        />
                        Enable
                    </label>
                </div>
            </div>
        </div>
    );
}

export const WeaponUI = blazingJusticeUI;