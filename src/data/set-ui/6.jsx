import { highlightKeywordsInText } from "../../constants/echoSetData.jsx";
import { setIconMap } from "../../constants/echoSetData2.js";
import React from "react";
import DropdownSelect from "../../components/utils-ui/DropdownSelect.jsx";
import {attributeColors} from "../../utils/attributeHelpers.js";

export default function five6 ({ setInfo, activeStates, toggleState, charId, setCharacterRuntimeStates }) {
    const eclipseValue = activeStates?.eclipse5pc ?? 0;

    const handleChange = (newValue) => {
        setCharacterRuntimeStates(prev => ({
            ...prev,
            [charId]: {
                ...(prev[charId] ?? {}),
                activeStates: {
                    ...(prev[charId]?.activeStates ?? {}),
                    eclipse5pc: newValue
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
                options={[0, 1, 2, 3, 4]}
                value={eclipseValue}
                onChange={handleChange}
                width="80px"
            />
        </div>
    );
}