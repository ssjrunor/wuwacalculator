import {elementToAttribute} from "@shared/utils/attributeHelpers.js";
export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     currentParamValues = [],
                                 }) {
    const attr = parseFloat(currentParamValues[0]);
    const stacks = characterState?.activeStates?.stacks ?? 0;
    const atk = parseFloat(currentParamValues[1]) * stacks;
    const atk2 = parseFloat(currentParamValues[4]);

    for (const elem of Object.values(elementToAttribute)) {
        mergedBuffs.attribute[elem].dmgBonus += attr;
    }
    mergedBuffs.atk.percent += atk;

    if (characterState?.activeStates?.secondP) {
        mergedBuffs.atk.percent += atk2;
    }

    return { mergedBuffs, combatState, skillMeta };
}
