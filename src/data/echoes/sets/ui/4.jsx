import { highlightKeywordsInText } from "@shared/constants/echoSetData.jsx";
import { setIconMap } from "@shared/constants/echoSetData2.js";
import React from "react";

export default function five4({ setInfo, activeStates, toggleState }) {
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
                    checked={activeStates.sierra5 || false}
                    onChange={() => toggleState('sierra5')}
                />
                Enable
            </label>
        </div>
    );
}