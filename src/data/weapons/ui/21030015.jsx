import React from 'react';
import {highlightKeywordsInText} from "@shared/constants/echoSetData.jsx";

export function WeaponUI({
                                 currentParamValues = [], keywords
                             }) {

    return (
        <div className="status-toggles">
            <div className="status-toggle-box">
                <div className="status-toggle-box-inner">
                    <p>{highlightKeywordsInText(`Increases Energy Regen by {currentParamValues[0]}.`, keywords)}</p>
                </div>

                <div className="status-toggle-box-inner">
                    <p>
                        {highlightKeywordsInText(`Incoming Resonator's ATK is increased by ${currentParamValues[1]} for 14s, 
                            stackable for up to 1 times after the wielder casts Outro Skill.`, keywords)}
                    </p>

                </div>
            </div>
        </div>
    );
}