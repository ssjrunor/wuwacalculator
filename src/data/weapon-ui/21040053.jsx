import React from 'react';
import DropdownSelect from "../../components/DropdownSelect.jsx";

export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     skillMeta = {},
                                     currentParamValues = []
                                 }) {
    const bonus = parseFloat(currentParamValues[0]);
    mergedBuffs.resonanceLiberation = (mergedBuffs.resonanceLiberation ?? 0) + bonus;


    return { mergedBuffs, combatState, skillMeta };
}