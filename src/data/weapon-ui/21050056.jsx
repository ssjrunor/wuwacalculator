import React from 'react';
import DropdownSelect from "../../components/DropdownSelect.jsx";
import {highlightKeywordsInText} from "../../constants/echoSetData.jsx";

export function WeaponUI({
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
                    <p>{highlightKeywordsInText(`Increases ATK by ${currentParamValues[0]}.`, keywords)}</p>
                </div>

                <div className="status-toggle-box-inner">
                    <p>
                        {highlightKeywordsInText(`Casting Echo Skill within 10s after casting Intro Skill or Basic Attacks grants 1
                            stack of Gentle Dream. Echoes with the same name can only trigger this effect once,
                            stacking up to 2 times, lasting for 10s. When reaching 2 stacks, casting Echo Skill no
                            longer resets the duration of this effect. This effect activates up to once per 10s.
                            Switching to another Resonator ends this effect early.`, keywords)}
                    </p>
                    <p>
                        <p>
                            {highlightKeywordsInText(`With 1 stack: Grants ${currentParamValues[6]} Basic Attack DMG Bonus.`, keywords)}
                        </p>
                        <p>
                            {highlightKeywordsInText(`With 2 stacks: Ignores ${currentParamValues[8]} of the target's Havoc RES.`, keywords)}
                        </p>
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
                                     activeCharacter
                                 }) {
    const atk = parseFloat(currentParamValues[0]);
    const basic = parseFloat(currentParamValues[6]);
    const resShred = parseFloat(currentParamValues[8]);
    const stacks = characterState?.activeStates?.stacks ?? 0;

    const element = skillMeta.element ?? null;

    mergedBuffs.atkPercent = (mergedBuffs.atkPercent ?? 0) + atk;
    mergedBuffs.basicAtk = (mergedBuffs.basicAtk ?? 0) + (stacks > 0 ? basic : 0)
    skillMeta.skillResIgnore = (skillMeta.skillResIgnore ?? 0) +
        (stacks > 1 && element === 'havoc' ? resShred : 0);


    return { mergedBuffs, combatState, skillMeta };
}