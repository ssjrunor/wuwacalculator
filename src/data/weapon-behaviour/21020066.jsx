import React from 'react';
import DropdownSelect from "../../components/DropdownSelect.jsx";
import {elementToAttribute} from "../../utils/attributeHelpers.js";
import {highlightKeywordsInText} from "../../constants/echoSetData.jsx";

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
                        {highlightKeywordsInText(`Casting Echo Skill grants ${currentParamValues[1]} 
                        Heavy Attack DMG Bonus to the wielder for 4s.`, keywords)}
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
                        {highlightKeywordsInText(`Casting Intro Skill grants ${currentParamValues[3]}
                        Echo Skill DMG Bonus to all Resonators in the team for 30s.`, keywords)}
                    </p>
                    <label className="modern-checkbox">
                        <input
                            type="checkbox"
                            checked={activeStates.firstP2 || false}
                            onChange={() => toggleState('firstP2')}
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
                                     currentParamValues = [],
                                 }) {
    const atk = parseFloat(currentParamValues[0]);
    const heavy = parseFloat(currentParamValues[1]);
    const echoSkill = parseFloat(currentParamValues[3]);

    mergedBuffs.atkPercent = (mergedBuffs.atkPercent ?? 0) + atk;

    if (characterState?.activeStates?.firstP1) {
        mergedBuffs.heavyAtk = (mergedBuffs.heavyAtk ?? 0) + heavy;
    }

    if (characterState?.activeStates?.firstP2) {
        mergedBuffs.echoSkill = (mergedBuffs.echoSkill ?? 0) + echoSkill;
    }

    return { mergedBuffs, combatState, skillMeta };
}