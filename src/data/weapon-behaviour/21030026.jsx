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
                    <p>{highlightKeywordsInText(`ATK is increased by ${currentParamValues[0]}.`, keywords)}</p>
                </div>

                <div className="status-toggle-box-inner">
                    <p>
                        {highlightKeywordsInText(`Inflicting Aero Erosion on the target gives ${currentParamValues[1]} Aero DMG Bonus for 10s.`, keywords)}
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
                        {highlightKeywordsInText(`Hitting targets with Aero Erosion reduces their Aero RES by ${currentParamValues[3]} for 20s. Effects of the same name cannot be stacked.`, keywords)}
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
                                     currentParamValues = [],
                                     activeCharacter
                                 }) {
    const atk = parseFloat(currentParamValues[0]);
    const resShred = parseFloat(currentParamValues[3]);
    const aero = parseFloat(currentParamValues[1]);

    const elementMap = {
        1: 'glacio',
        2: 'fusion',
        3: 'electro',
        4: 'aero',
        5: 'spectro',
        6: 'havoc'
    };
    const element = elementMap?.[activeCharacter?.attribute];

    mergedBuffs.atkPercent = (mergedBuffs.atkPercent ?? 0) + atk;
    mergedBuffs.aero = (mergedBuffs.aero ?? 0) +
        (characterState?.activeStates?.firstP ? aero : 0);
    skillMeta.skillResIgnore = (skillMeta.skillResIgnore ?? 0) +
        (characterState?.activeStates?.secondP && element === 'aero' && combatState.aeroErosion > 0 ? resShred : 0);

    return { mergedBuffs, combatState, skillMeta };
}