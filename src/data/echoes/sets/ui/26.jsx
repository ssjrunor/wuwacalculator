import React, { useEffect } from "react";
import { setIconMap } from "@/constants/echoSetData2.js";
import DropdownSelect from "@/components/common/DropdownSelect.jsx";

export default function five26({
                                   setInfo,
                                   activeStates,
                                   charId,
                                   setCharacterRuntimeStates,
                                   toggleState
                               }) {
    const stacks = activeStates?.gildedRevelationStacks ?? 0;
    const hasBasicBuff = !!activeStates?.gildedRevelationBasicBuff;

    const handleChange = (newValue) => {
        setCharacterRuntimeStates(prev => ({
            ...prev,
            [charId]: {
                ...(prev[charId] ?? {}),
                activeStates: {
                    ...(prev[charId]?.activeStates ?? {}),
                    gildedRevelationStacks: newValue
                }
            }
        }));
    };

    // If stacks drop below 3, auto-disable the Liberation basic buff
    useEffect(() => {
        if (hasBasicBuff && stacks < 3) {
            toggleState("gildedRevelationBasicBuff");
        }
    }, [hasBasicBuff, stacks]);

    return (
        <div className="echo-buff">
            <div className="echo-buff-header">
                <img
                    className="echo-buff-icon"
                    src={setIconMap[setInfo.id]}
                    alt={setInfo.name}
                />
                <div className="echo-buff-name">
                    {setInfo.name} (5-piece)
                </div>
            </div>

            {/* Line 1: Spectro stacks */}
            <div className="echo-buff-effect">
                Dealing <span className="highlight">Basic Attack DMG</span> increases{" "}
                <span className="highlight">Spectro DMG</span> by{" "}
                <span className="highlight">10%</span>, stacking up to{" "}
                <span className="highlight">3 times</span> for{" "}
                <span className="highlight">5s</span>.
            </div>
            <DropdownSelect
                label=""
                options={[0, 1, 2, 3]}
                value={stacks}
                onChange={handleChange}
                width="80px"
            />

            {/* Line 2: Liberation basic buff */}
            <div className="echo-buff-effect" style={{ marginTop: "1rem" }}>
                With <span className="highlight">3 stacks</span>, casting{" "}
                <span className="highlight">Resonance Liberation</span> grants{" "}
                <span className="highlight">40% Basic Attack DMG Bonus</span>.
            </div>

            <label
                className="modern-checkbox"
                style={{
                    opacity: stacks < 3 ? 0.5 : 1,
                    cursor: stacks >= 3 ? "pointer" : "not-allowed"
                }}
            >
                <input
                    type="checkbox"
                    disabled={stacks < 3}
                    checked={stacks >= 3 && hasBasicBuff}
                    onChange={() => toggleState("gildedRevelationBasicBuff")}
                />
                Enable
                {stacks < 3 && (
                    <span
                        style={{
                            marginLeft: "8px",
                            fontSize: "12px",
                            color: "gray"
                        }}
                    >
                        (Needs 3 stacks~!)
                    </span>
                )}
            </label>
        </div>
    );
}