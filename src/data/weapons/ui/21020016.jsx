import React from 'react';
import {highlightKeywordsInText} from "@shared/constants/echoSetData.jsx";

export function WeaponUI({
                             activeStates,
                             currentParamValues = [],
    keywords,
                             setCharacterRuntimeStates, charId
                         }) {
    keywords.push('Searing Feather')
    return (
        <div className="status-toggles">
            <div className="status-toggle-box">
                <div className="status-toggle-box-inner">
                    <p>{highlightKeywordsInText(`Increases ATK by ${currentParamValues[0]}.`, keywords)}</p>
                </div>

                <div className="status-toggle-box-inner">
                    <p>
                        {highlightKeywordsInText(`The wielder gains 1 stack of Searing Feather upon dealing damage, which can be triggered once every 0.5s, and gains 5 stacks of the same effect upon casting Resonance Skill.
                            Each stack of Searing Feather gives ${currentParamValues[1]} additional Resonance Skill DMG Bonus for up to 14 stacks.`, keywords)}
                    </p>
                    <input
                        type="number"
                        className="character-level-input"
                        min="0"
                        max="14"
                        value={activeStates.stacks ?? 0}
                        onChange={(e) => {
                            const val = Math.max(0, Math.min(14, Number(e.target.value) || 0));
                            setCharacterRuntimeStates(prev => ({
                                ...prev,
                                [charId]: {
                                    ...(prev[charId] ?? {}),
                                    activeStates: {
                                        ...(prev[charId]?.activeStates ?? {}),
                                        stacks: val
                                    }
                                }
                            }));
                        }}
                    />
                </div>
            </div>
        </div>
    );
}