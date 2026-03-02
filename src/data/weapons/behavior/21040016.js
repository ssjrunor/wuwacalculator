import {elementToAttribute} from "@shared/utils/attributeHelpers.js";

export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                 currentParamValues = [],
                                 }) {
    const attr = parseFloat(currentParamValues[0]);
    const firstP = parseFloat(currentParamValues[1]);

    for (const elem of Object.values(elementToAttribute)) {
        mergedBuffs.attribute[elem].dmgBonus += attr;
    }

    if (characterState?.activeStates?.firstP) {
        mergedBuffs.skillType.resonanceLiberation.dmgBonus += firstP;
    }


    return { mergedBuffs, combatState, skillMeta };
}
