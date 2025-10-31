import React from 'react';
import DropdownSelect from "../../components/DropdownSelect.jsx";
import {elementToAttribute} from "../../utils/attributeHelpers.js";
import {highlightKeywordsInText} from "../../constants/echoSetData.jsx";

export function WeaponUI({
                             activeStates,
                             toggleState,
                             currentParamValues = [],
                             characterRuntimeStates, setCharacterRuntimeStates, charId, keywords
                         }) {
    const stacks = characterRuntimeStates?.[charId]?.activeStates?.stacks ?? 0;

    const handleChange = (newValue) => {
        setCharacterRuntimeStates(prev => ({
            ...prev,
            [charId]: {
                ...(prev[charId] ?? {}),
                activeStates: {
                    ...(prev[charId]?.activeStates ?? {}),
                    stacks: newValue
                }
            }
        }));
    };

    return (
        <div className="status-toggles">
            <div className="status-toggle-box">
                <div className="status-toggle-box-inner">
                    <p>{highlightKeywordsInText(`ATK is increased by ${currentParamValues[0]}.`, keywords)}</p>
                </div>

                <div className="status-toggle-box-inner">
                    <p>
                        {highlightKeywordsInText(`Casting Echo Skill grants 1 stack of Bamboo Cleaver, which grants ${currentParamValues[2]}% Heavy Attack DMG Bonus to the wielder. This effect can be triggered by Echoes of the same name once only, stacking up to 2 times, lasting for 30s.
                        When Bamboo Cleaver reaches max stacks, casting Echo Skill resets its duration.`, keywords)}
                    </p>
                    <label className="modern-checkbox">
                        <DropdownSelect
                            label=""
                            options={[0, 1, 2]}
                            value={stacks}
                            onChange={handleChange}
                            width="80px"
                        />
                        Stacks
                    </label>
                    <p>
                        {highlightKeywordsInText(`Casting Intro Skill grants ${currentParamValues[5]} Echo Skill DMG
                        Bonus to all Resonators in the team for 30s. Effects of the same name cannot be stacked.`, keywords)}
                    </p>
                    <label className="modern-checkbox">
                        <input
                            type="checkbox"
                            checked={activeStates.firstP2 || false}
                            onChange={() => toggleState('firstP2')}
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
                                 }) {
    const atk = parseFloat(currentParamValues[0]);
    const heavy = parseFloat(currentParamValues[2]);
    const stacks = characterState?.activeStates?.stacks ?? 0;
    const echoSkill = parseFloat(currentParamValues[5]);

    mergedBuffs.atkPercent = (mergedBuffs.atkPercent ?? 0) + atk;
    mergedBuffs.heavyAtk = (mergedBuffs.heavyAtk ?? 0) + heavy * stacks;

    if (characterState?.activeStates?.firstP2) {
        mergedBuffs.echoSkill = (mergedBuffs.echoSkill ?? 0) + echoSkill;
    }

    return { mergedBuffs, combatState, skillMeta };
}