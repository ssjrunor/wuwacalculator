import React from 'react';
import DropdownSelect from "../../components/DropdownSelect.jsx";

export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     skillMeta = {},
                                     currentParamValues = []
                                 }) {
    const bonus = parseFloat(currentParamValues[0]);
    mergedBuffs.basicAtk = (mergedBuffs.basicAtk ?? 0) + bonus;
    mergedBuffs.heavyAtk = (mergedBuffs.heavyAtk ?? 0) + bonus;


    return { mergedBuffs, combatState, skillMeta };
}