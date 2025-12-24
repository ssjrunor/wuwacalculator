import { highlightKeywordsInText } from "@/constants/echoSetData.jsx";
import { setIconMap } from "@/constants/echoSetData2.js";
import React from "react";
import DropdownSelect from "@/components/common/DropdownSelect.jsx";
import {attributeColors} from "@/utils/attributeHelpers.js";

export default function five10 ({ setInfo, activeStates, toggleState, charId, setCharacterRuntimeStates }) {
    const frostyValue = activeStates?.frosty5p2 ?? 0;

    const handleChange = (newValue) => {
        setCharacterRuntimeStates(prev => ({
            ...prev,
            [charId]: {
                ...(prev[charId] ?? {}),
                activeStates: {
                    ...(prev[charId]?.activeStates ?? {}),
                    frosty5p2: newValue
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
                Casting <span className="highlight">Resonance Skill</span> grants <span className="highlight">22.5%</span> <span style={{ color: attributeColors['glacio'], fontWeight: 'bold' }}>Glacio</span> DMG Bonus for 15s.
            </div>
            <label className="modern-checkbox" style={{marginBottom: '10px'}}>
                <input
                    type="checkbox"
                    checked={activeStates.frosty5p1 || false}
                    onChange={() => toggleState('frosty5p1')}
                />
                Enable
            </label>
            <div className="echo-buff-effect">
                Casting <span className="highlight">Resonance Liberation</span> increases <span className="highlight">Resonance Skill</span> DMG by <span className="highlight">18%</span>, lasting for 5s. This effect stacks up to 2 times.
            </div>
            <DropdownSelect
                label=""
                options={[0, 1, 2]}
                value={frostyValue}
                onChange={handleChange}
                width="80px"
            />
        </div>
    );
}