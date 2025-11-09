import React from 'react';
import DropdownSelect from "../../components/DropdownSelect.jsx";
import {highlightKeywordsInText} from "../../constants/echoSetData.jsx";

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


export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     skillMeta = {},
                                     currentParamValues = []
                                 }) {
    const energy = parseFloat(currentParamValues[0]);
    mergedBuffs.energyRegen = (mergedBuffs.energyRegen ?? 0) + energy;

    return { mergedBuffs, combatState, skillMeta };
}