import { highlightKeywordsInText } from "@/constants/echoSetData.jsx";
import { setIconMap } from "@/constants/echoSetData2.js";
import React from "react";
import DropdownSelect from "@/components/common/DropdownSelect.jsx";
import {attributeColors} from "@/utils/attributeHelpers.js";

export default function five3 ({ setInfo, activeStates, charId, setCharacterRuntimeStates }) {
    const voidValue = activeStates?.void5pc ?? 0;

    const handleChange = (newValue) => {
        setCharacterRuntimeStates(prev => ({
            ...prev,
            [charId]: {
                ...(prev[charId] ?? {}),
                activeStates: {
                    ...(prev[charId]?.activeStates ?? {}),
                    void5pc: newValue
                }
            }
        }));
    };

    return (
        <div className="echo-buff">
            <div className="echo-buff-header">
                <img className="echo-buff-icon" src={setIconMap[setInfo.id]} alt={setInfo.name} />
                <div className="echo-buff-name">{setInfo.name} (5-piece)</div>
            </div>
            <div className="echo-buff-effect">
                {highlightKeywordsInText(setInfo.fivePiece)}
            </div>
            <DropdownSelect
                label=""
                options={[0, 1, 2]}
                value={voidValue}
                onChange={handleChange}
                width="80px"
            />
        </div>
    );
}