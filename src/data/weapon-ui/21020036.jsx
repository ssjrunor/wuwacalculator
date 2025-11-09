import React from 'react';
import DropdownSelect from "../../components/DropdownSelect.jsx";
import {highlightKeywordsInText} from "../../constants/echoSetData.jsx";

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
                    <p>{highlightKeywordsInText(`Increase Crit. Rate by ${currentParamValues[0]}.`, keywords)}</p>
                </div>

                <div className="status-toggle-box-inner">
                    <p>
                        {highlightKeywordsInText(`Casting Resonance Liberation gives ${currentParamValues[1]} Basic Attack DMG Bonus.`, keywords)}
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
                        {highlightKeywordsInText(`Dealing Basic Attack DMG gives ${currentParamValues[3]} Basic Attack DMG Bonus.`, keywords)}
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


export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     currentParamValues = []
                                 }) {
    const basic1 = parseFloat(currentParamValues[1]);
    const cr = parseFloat(currentParamValues[0]);
    const basic2 = parseFloat(currentParamValues[3]);

    mergedBuffs.critRate = (mergedBuffs.critRate ?? 0) + cr;

    if (characterState?.activeStates?.firstP) {
        mergedBuffs.basicAtk = (mergedBuffs.basicAtk ?? 0) + basic1;
    }

    if (characterState?.activeStates?.secondP) {
        mergedBuffs.basicAtk = (mergedBuffs.basicAtk ?? 0) + basic2;
    }

    return { mergedBuffs, combatState, skillMeta };
}