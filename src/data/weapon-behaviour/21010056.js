import {elementToAttribute} from "../../utils/attributeHelpers.js";

export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     currentParamValues = [],
                                 }) {
    const atk = parseFloat(currentParamValues[0]);
    const stacks = characterState?.activeStates?.threadOfFateStacks ?? 0;
    const lib = parseFloat(currentParamValues[1]) * stacks;
    const attr = parseFloat(currentParamValues[4]);

    mergedBuffs.atkPercent = (mergedBuffs.atkPercent ?? 0) + atk;
    mergedBuffs.resonanceLiberation = (mergedBuffs.resonanceLiberation ?? 0) + lib;

    for (const elem of Object.values(elementToAttribute)) {
        mergedBuffs[elem] = (mergedBuffs[elem] ?? 0) + (characterState?.activeStates?.secondP ? attr : 0);
    }

    return { mergedBuffs, combatState, skillMeta };
}