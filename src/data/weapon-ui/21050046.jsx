import React from 'react';
import DropdownSelect from "../../components/DropdownSelect.jsx";
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
                    <p>{highlightKeywordsInText(`Increase ATK by ${currentParamValues[0]}.`, keywords)}</p>
                </div>

                <div className="status-toggle-box-inner">
                    <p>
                        {highlightKeywordsInText(`Dealing DMG to targets with Spectro Frazzle grants the wielder ${currentParamValues[1]}
                            Basic Attack DMG Bonus and ${currentParamValues[1]} Heavy Attack DMG Bonus, stacking up to 3 times for 6s`, keywords)}
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
                        {highlightKeywordsInText(`Casting Outro Skill Amplifies the Spectro Frazzle DMG on targets around the active Resonator by
                         ${currentParamValues[4]} for 30s. Effects of the same name cannot be stacked.`, keywords)}
                    </p>
                    <label className="modern-checkbox">
                        <input
                            type="checkbox"
                            checked={!!activeStates?.secondP}
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
                                     currentParamValues = []
                                 }) {
    const atk = parseFloat(currentParamValues[0]);
    const stacks = characterState?.activeStates?.stacks ?? 0;
    const firstP = parseFloat(currentParamValues[1]) * stacks;
    const secondP = parseFloat(currentParamValues[4]);

    mergedBuffs.atkPercent = (mergedBuffs.atkPercent ?? 0) + atk;

    if (combatState.spectroFrazzle > 0) {
        mergedBuffs.basicAtk = (mergedBuffs.basicAtk ?? 0) + firstP;
        mergedBuffs.heavyAtk = (mergedBuffs.heavyAtk ?? 0) + firstP;
    }

    if (characterState?.activeStates?.secondP) {
        mergedBuffs.damageTypeAmplify.spectroFrazzle = (mergedBuffs.damageTypeAmplify.spectroFrazzle ?? 0) + secondP;
    }

    return { mergedBuffs, combatState, skillMeta };
}