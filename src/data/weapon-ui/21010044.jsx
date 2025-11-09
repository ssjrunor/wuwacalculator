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
                    <p>
                        {highlightKeywordsInText(
                            `When Intro Skill is cast, increases ATK by ${currentParamValues[0]} and DEF by ${currentParamValues[1]}, lasting for 15s.`,
                            keywords,
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


export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     isToggleActive = () => false,
                                     currentParamValues = []
                                 }) {
    const atk = parseFloat(currentParamValues[0]);
    const def = parseFloat(currentParamValues[1]);
    if (characterState?.activeStates?.firstP) {
        mergedBuffs.atkPercent = (mergedBuffs.atkPercent ?? 0) + atk;
        mergedBuffs.defPercent = (mergedBuffs.defPercent ?? 0) + def;
    }

    return { mergedBuffs, combatState, skillMeta };
}