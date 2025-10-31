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
    const stacks = characterRuntimeStates?.[charId]?.activeStates?.threadOfFateStacks ?? 0;
    keywords.push(
        'All-Attribute DMG Bonus', 'Negative Status DMG', 'Negative Status', 'Intro Skill', 'Resonance Liberation DMG'
    )

    const handleChange = (newValue) => {
        setCharacterRuntimeStates(prev => ({
            ...prev,
            [charId]: {
                ...(prev[charId] ?? {}),
                activeStates: {
                    ...(prev[charId]?.activeStates ?? {}),
                    threadOfFateStacks: newValue
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
                        {highlightKeywordsInText(`When the wielder casts Intro Skill or inflicts Negative Status, they gain ${currentParamValues[1]}Resonance Liberation DMG Bonus, stacking up to 3 times for 15s.`, keywords)}
                    </p>
                    <label className="modern-checkbox">
                        <DropdownSelect
                            label=""
                            options={[0, 1, 2, 3]}
                            value={stacks}
                            onChange={handleChange}
                            width="80px"
                        />
                        Stacks
                    </label>
                    <p>
                        {highlightKeywordsInText(`At max stacks, when Resonators in the team inflict Negative Status or deal Negative Status DMG, grants ${currentParamValues[4]}
                        All-Attribute DMG Bonus for 15s. Effects of the same name cannot be stacked.`, keywords)}
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