import React from 'react';
import DropdownSelect from "../../components/DropdownSelect.jsx";
import {highlightKeywordsInText} from "../../constants/echoSetData.jsx";

export function WeaponUI({
                             activeStates,
                             toggleState,
                             currentParamValues = [],
    keyword,
                         }) {
    return (
        <div className="status-toggles">
            <div className="status-toggle-box">
                <div className="status-toggle-box-inner">
                    <p>{highlightKeywordsInText(`Increases Energy Regen by ${currentParamValues[0]}.`, keyword)}</p>
                </div>

                <div className="status-toggle-box-inner">
                    <p>
                        {highlightKeywordsInText(`When hitting a target with Resonance Skill, increases Basic Attack DMG Bonus by ${currentParamValues[1]}, lasting for 8s.`, keyword)}
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
                        {highlightKeywordsInText(`When hitting a target with Basic Attacks, increases Resonance Skill DMG Bonus by ${currentParamValues[3]}, lasting for 8s.`, keyword)}
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
    const energy = parseFloat(currentParamValues[0]);
    const firstP = parseFloat(currentParamValues[1]);
    const secondP = parseFloat(currentParamValues[3]);

    mergedBuffs.energyRegen = (mergedBuffs.energyRegen ?? 0) + energy;


    if (characterState?.activeStates?.firstP) {
        mergedBuffs.basicAtk = (mergedBuffs.basicAtk ?? 0) + firstP;
    }

    if (characterState?.activeStates?.secondP) {
        mergedBuffs.resonanceSkill = (mergedBuffs.resonanceSkill ?? 0) + secondP;
    }

    return { mergedBuffs, combatState, skillMeta };
}