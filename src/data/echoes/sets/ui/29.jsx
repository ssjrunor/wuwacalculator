import React from "react";
import { highlightKeywordsInText } from "@/constants/echoSetData.jsx";
import { setIconMap } from "@/constants/echoSetData2.js";

export default function five29({ setInfo, activeStates, toggleState }) {
    const keywords = ['Echo Skill', 'Crit. Rate', 'Aero DMG Bonus'];

    return (
        <div className="echo-buff">
            <div className="echo-buff-header">
                <img
                    className="echo-buff-icon"
                    src={setIconMap[setInfo.id]}
                    alt={setInfo.name}
                />
                <div className="echo-buff-name">{setInfo.name} (5-piece)</div>
            </div>
            <div className="echo-buff-effect">
                {highlightKeywordsInText(
                    "Dealing Echo Skill DMG to enemies increases the Resonator's Echo Skill Crit. Rate by 20%, and grants 15% Aero DMG Bonus for 5s.",
                    keywords
                )}
            </div>
            <label className="modern-checkbox" style={{ marginBottom: '10px' }}>
                <input
                    type="checkbox"
                    checked={activeStates.soundOfTrueName5pc || false}
                    onChange={() => toggleState('soundOfTrueName5pc')}
                />
                Enable
            </label>
        </div>
    );
}
