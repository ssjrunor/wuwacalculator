import React from 'react';
import DropdownSelect from "../../components/DropdownSelect.jsx";
import {highlightKeywordsInText} from "../../constants/echoSetData.jsx";

export function WeaponUI({
                             activeStates,
                             toggleState,
                             currentParamValues = [],
                             characterRuntimeStates, setCharacterRuntimeStates, charId,
    keywords
                         }) {
    const eminenceStacks = characterRuntimeStates?.[charId]?.activeStates?.eminenceStacks ?? 0;

    const handleChange = (newValue) => {
        setCharacterRuntimeStates(prev => ({
            ...prev,
            [charId]: {
                ...(prev[charId] ?? {}),
                activeStates: {
                    ...(prev[charId]?.activeStates ?? {}),
                    eminenceStacks: newValue
                }
            }
        }));
    };

    return (
        <div className="status-toggles">
            <div className="status-toggle-box">
                <div className="status-toggle-box-inner">
                    <p>{highlightKeywordsInText(`Increase ATK by ${currentParamValues[0]}.`, keywords)}</p>
                </div>

                <div className="status-toggle-box-inner">
                    <p>
                        {highlightKeywordsInText(`Casting Intro Skill or Resonance Skill increases Heavy Attack DMG by ${currentParamValues[1]} for 15s.`, keywords)}
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
                        {highlightKeywordsInText(`Obtaining Shield allows Heavy Attack DMG to ignore ${currentParamValues[3]} of the 
                        target's DEF for 7s, stacking up to 5 times. This effect is triggered once every 0.5s`, keywords)}
                    </p>
                    <label className="modern-checkbox">
                        <DropdownSelect
                            label=""
                            options={[0, 1, 2, 3, 4, 5]}
                            value={eminenceStacks}
                            onChange={handleChange}
                            width="80px"
                        />
                        Stacks
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
    const firstp = parseFloat(currentParamValues[1]);

    mergedBuffs.atkPercent = (mergedBuffs.atkPercent ?? 0) + atk;

    if (characterState?.activeStates?.firstP) {
        mergedBuffs.heavyAtk = (mergedBuffs.heavyAtk ?? 0) + firstp;
    }

    return { mergedBuffs, combatState, skillMeta };
}

export function updateSkillMeta({
                                    characterState,
                                    skillMeta = {},
                                    currentParamValues = []
                                } ) {
    const defIgnore = characterState?.activeStates?.eminenceStacks ?? 0;
    if (skillMeta.skillType.includes('heavy')) {
        skillMeta.skillDefIgnore = (skillMeta.skillDefIgnore ?? 0) + defIgnore * parseFloat(currentParamValues[3]);
    }

    return skillMeta;
}