import { highlightKeywordsInText } from "@/constants/echoSetData.jsx";
import { setIconMap } from "@/constants/echoSetData2.js";
import React from "react";

export default function three23 ({ setInfo, activeStates, toggleState }) {
    return (
        <div className="echo-buff">
            <div className="echo-buff-header">
                <img className="echo-buff-icon" src={setIconMap[setInfo.id]} alt={setInfo.name} />
                <div className="echo-buff-name">{setInfo.name} (3-piece)</div>
            </div>
            <div className="echo-buff-effect">
                {highlightKeywordsInText(setInfo.threePiece, ['Havoc Bane'])}
            </div>
            <label className="modern-checkbox">
                <input
                    type="checkbox"
                    checked={activeStates.threadOfSeveredFate3pc || false}
                    onChange={() => toggleState('threadOfSeveredFate3pc')}
                />
                Enable
            </label>
        </div>
    );
}