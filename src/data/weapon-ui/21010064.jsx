import React from 'react';
import DropdownSelect from "../../components/DropdownSelect.jsx";
import {highlightKeywordsInText} from "../../constants/echoSetData.jsx";

export function WeaponUI({
                                 combatState,
                                 setCombatState,
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
                    <p>
                        {highlightKeywordsInText(
                            `Within 12s after Resonance Skill is cast, increases ATK by ${currentParamValues[2]} every 2s, stacking up to 4 time(s). This effect can be triggered 1 time(s) every 12s. When the number of stacks reaches 4, all stacks will be reset within 6s.`,
                            keywords
                        )}
                    </p>
                    <label className="modern-checkbox">
                        <DropdownSelect
                            label=""
                            options={[0, 1, 2, 3, 4]}
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
                                     isToggleActive = () => false,
                                     currentParamValues = []
                                 }) {
    const stacks = characterState?.activeStates?.stacks ?? 0;
    const atk = parseFloat(currentParamValues[2]) * stacks;

    mergedBuffs.atkPercent = (mergedBuffs.atkPercent ?? 0) + atk;


    return { mergedBuffs, combatState, skillMeta };
}