import { highlightKeywordsInText } from "@shared/constants/echoSetData.jsx";
import { setIconMap } from "@shared/constants/echoSetData2.js";
import React from "react";
import DropdownSelect from "@/shared/ui/common/DropdownSelect.jsx";

export default function three19 ({ setInfo, activeStates, charId, setCharacterRuntimeStates }) {
    const lawOfHarmony = activeStates?.lawOfHarmony3p ?? 0;

    const handleChange = (newValue) => {
        setCharacterRuntimeStates(prev => ({
            ...prev,
            [charId]: {
                ...(prev[charId] ?? {}),
                activeStates: {
                    ...(prev[charId]?.activeStates ?? {}),
                    lawOfHarmony3p: newValue
                }
            }
        }));
    };

    return (
        <div className="echo-buff">
            <div className="echo-buff-header">
                <img className="echo-buff-icon" src={setIconMap[setInfo.id]} alt={setInfo.name} />
                <div className="echo-buff-name">{setInfo.name} (3-piece)</div>
            </div>
            <div className="echo-buff-effect">
                {highlightKeywordsInText(setInfo.threePiece, ['Echo Skill DMG Bonus'])}
            </div>
            <DropdownSelect
                label=""
                options={[0, 1, 2, 3, 4]}
                value={lawOfHarmony}
                onChange={handleChange}
                width="80px"
            />
        </div>
    );
}