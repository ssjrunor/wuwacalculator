import { highlightKeywordsInText } from "@shared/constants/echoSetData.jsx";
import { setIconMap } from "@shared/constants/echoSetData2.js";
import React from "react";
import {attributeColors} from "@shared/utils/attributeHelpers.js";

export default function five13({ setInfo, activeStates, toggleState }) {
    return (
        <div className="echo-buff">
            <div className="echo-buff-header">
                <img className="echo-buff-icon" src={setIconMap[setInfo.id]} alt={setInfo.name} />
                <div className="echo-buff-name">{setInfo.name} (5-piece)</div>
            </div>
            <div className="echo-buff-effect">
                Increase the Resonator's <span className="highlight">Coordinated</span> Attack DMG by <span className="highlight">80%</span>.
            </div>
            <div className="echo-buff-effect">
                Upon a critical hit of <span className="highlight">Coordinated</span> Attack, increase the active Resonator's <span className="highlight">ATK</span> by <span className="highlight">20%</span> for 4s
            </div>
            <label className="modern-checkbox">
                <input
                    type="checkbox"
                    checked={activeStates.empyrean5 || false}
                    onChange={() => toggleState('empyrean5')}
                />
                Enable
            </label>
        </div>
    );
}