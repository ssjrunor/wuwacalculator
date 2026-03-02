// src/data/echo-set-ui/five25.jsx (or wherever your other 5p UIs live)

import React from "react";
import { setIconMap } from "@shared/constants/echoSetData2.js";
import {highlightKeywordsInText} from "@shared/constants/echoSetData.jsx";

export default function five25({
                                   setInfo,
                                   activeStates,
                                   charId,
                                   setCharacterRuntimeStates
                               }) {
    const offTuneRate = activeStates?.starryRadiance5pc ?? 0;

    const handleChange = (e) => {
        const raw = Number(e.target.value);
        const safe = Number.isFinite(raw) ? raw : 0;

        const clamped = Math.max(0, Math.min(safe, 125));

        setCharacterRuntimeStates(prev => ({
            ...prev,
            [charId]: {
                ...(prev[charId] ?? {}),
                activeStates: {
                    ...(prev[charId]?.activeStates ?? {}),
                    starryRadiance5pc: clamped
                }
            }
        }));
    };

    const currentBuff = Math.min(offTuneRate * 0.2, 25);

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

            {/* Description line */}
            <div className="echo-buff-effect">
                {highlightKeywordsInText(setInfo.fivePiece, ['All-Attribute DMG Bonus'])}
            </div>

            {/* Input for Off-Tune Buildup Rate */}
            <div className="echo-buff-effect" style={{ marginTop: "0.75rem" }}>
                <label className="slider-label-with-input">
                    Off-Tune Buildup Rate
                    <input
                        type="number"
                        min={0}
                        max={125}
                        step={1}
                        value={offTuneRate}
                        onChange={handleChange}
                        style={{ width: "5rem", textAlign: "right" }}
                        className="character-level-input"
                    />
                    %
                </label>
            </div>

            {/* Preview of resulting buff */}
            <div
                className="echo-buff-effect"
                style={{ marginTop: "0.25rem", fontSize: "0.85rem", opacity: 0.85 }}
            >
                Current bonus:{" "}
                {currentBuff.toFixed(1)}%
            </div>
        </div>
    );
}