import { highlightKeywordsInText } from "@/constants/echoSetData.jsx";
import { setIconMap } from "@/constants/echoSetData2.js";
import React from "react";
import {attributeColors} from "@/utils/attributeHelpers.js";

export default function five11({ setInfo, activeStates, toggleState }) {
    return (
        <div className="echo-buff">
            <div className="echo-buff-header">
                <img className="echo-buff-icon" src={setIconMap[setInfo.id]} alt={setInfo.name} />
                <div className="echo-buff-name">{setInfo.name} (5-piece)</div>
            </div>
            <div className="echo-buff-effect">
                Inflicting enemies with  <span style={{ color: attributeColors['spectro'], fontWeight: 'bold' }}>Spectro</span> Frazzle increases <span className="highlight">Crit. Rate</span> by <span className="highlight">20%</span> for 15s.
            </div>
            <label className="modern-checkbox" style={{marginBottom: '10px'}}>
                <input
                    type="checkbox"
                    checked={activeStates.radiance5p1 || false}
                    onChange={() => toggleState('radiance5p1')}
                />
                Enable
            </label>
            <div className="echo-buff-effect">
                Attacking enemies with 10 stacks of <span style={{ color: attributeColors['spectro'], fontWeight: 'bold' }}>Spectro</span> Frazzle grants <span className="highlight">15%</span>  <span style={{ color: attributeColors['spectro'], fontWeight: 'bold' }}>Spectro</span> DMG Bonus for 15s.
            </div>
            <label className="modern-checkbox" style={{marginBottom: '10px'}}>
                <input
                    type="checkbox"
                    checked={activeStates.radiance5p2 || false}
                    onChange={() => toggleState('radiance5p2')}
                />
                Enable
            </label>
        </div>
    );
}