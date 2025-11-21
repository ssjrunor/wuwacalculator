import {highlightKeywordsInText, setIconMap} from "../../constants/echoSetData.jsx";
import React from "react";
import DropdownSelect from "../../components/utils-ui/DropdownSelect.jsx";
import {attributeColors} from "../../utils/attributeHelpers.js";

export default function five9 ({ setInfo, activeStates, charId, setCharacterRuntimeStates }) {
    const lingeringValue = activeStates?.lingering5p1 ?? 0;

    const handleChange = (newValue) => {
        setCharacterRuntimeStates(prev => ({
            ...prev,
            [charId]: {
                ...(prev[charId] ?? {}),
                activeStates: {
                    ...(prev[charId]?.activeStates ?? {}),
                    lingering5p1: newValue
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
                While on the field, <span className="highlight">ATK</span> increases by <span className="highlight">5%</span> every 1.5s, stacking up to 4 times
            </div>
            <DropdownSelect
                label=""
                options={[0, 1, 2, 3, 4]}
                value={lingeringValue}
                onChange={handleChange}
                width="80px"
            />
            <div className="echo-buff-effect">
                <span className="highlight">Outro Skill</span> DMG increases by <span className="highlight">60%</span>.
            </div>
        </div>
    );
}