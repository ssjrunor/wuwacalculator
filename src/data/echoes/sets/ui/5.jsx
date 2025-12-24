import { highlightKeywordsInText } from "@/constants/echoSetData.jsx";
import { setIconMap } from "@/constants/echoSetData2.js";
import React from "react";

export default function five5({ setInfo, activeStates, toggleState }) {
    return (
        <div className="echo-buff">
            <div className="echo-buff-header">
                <img className="echo-buff-icon" src={setIconMap[setInfo.id]} alt={setInfo.name} />
                <div className="echo-buff-name">{setInfo.name} (5-piece)</div>
            </div>
            <div className="echo-buff-effect">
                {highlightKeywordsInText(setInfo.fivePiece)}
            </div>
            <label className="modern-checkbox">
                <input
                    type="checkbox"
                    checked={activeStates.celestial5 || false}
                    onChange={() => toggleState('celestial5')}
                />
                Enable
            </label>
        </div>
    );
}