import React from "react";
import { highlightKeywordsInText } from "@/constants/echoSetData.jsx";
import { setIconMap } from "@/constants/echoSetData2.js";

export default function five28({
                                    setInfo,
                                    activeStates,
                                    toggleState
                                }) {
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
                {highlightKeywordsInText(setInfo.fivePiece)}
            </div>
            <label className="modern-checkbox" style={{ marginBottom: '10px' }}>
                <input
                    type="checkbox"
                    checked={activeStates.chromaticFoamSelf || false}
                    onChange={() => toggleState('chromaticFoamSelf')}
                />
                Enable
            </label>
        </div>
    );
}
