import {elementToAttribute} from "../../utils/attributeHelpers.js";

export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     isToggleActive = () => false,
                                     currentParamValues = [],
                                     activeCharacter
                                 }) {
    const attr = parseFloat(currentParamValues[0]);
    const stacks = characterState?.activeStates?.stacks ?? 0;
    const heavy = parseFloat(currentParamValues[1]) * stacks;

    for (const elem of Object.values(elementToAttribute)) {
        mergedBuffs[elem] = (mergedBuffs[elem] ?? 0) + attr;
    }
    mergedBuffs.heavyAtk = (mergedBuffs.heavyAtk ?? 0) + heavy;

    return { mergedBuffs, combatState, skillMeta };
}