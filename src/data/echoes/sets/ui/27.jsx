import React from "react";
import { highlightKeywordsInText } from "@shared/constants/echoSetData.jsx";
import { setIconMap } from "@shared/constants/echoSetData2.js";

export default function five27({ setInfo, activeStates, toggleState }) {
    const keywords = ['Fusion Burst', 'Tune Rupture', 'Crit. Rate', 'Fusion DMG Bonus', 'Fusion DMG'];

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
                    "Inflicting Fusion Burst or Tune Rupture - Shifting increases the Resonator's Crit. Rate by 20% and grants 20% Fusion DMG Bonus for 8s.",
                    keywords
                )}
            </div>
            <label className="modern-checkbox" style={{ marginBottom: '10px' }}>
                <input
                    type="checkbox"
                    checked={activeStates.trailblazingStar5pc || false}
                    onChange={() => toggleState('trailblazingStar5pc')}
                />
                Enable
            </label>
        </div>
    );
}
