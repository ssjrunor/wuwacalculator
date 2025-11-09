import {highlightKeywordsInText, setIconMap} from "../../constants/echoSetData.jsx";
import React from "react";

export default function three22 ({ setInfo, activeStates, toggleState }) {
    return (
        <div className="echo-buff">
            <div className="echo-buff-header">
                <img className="echo-buff-icon" src={setIconMap[setInfo.id]} alt={setInfo.name} />
                <div className="echo-buff-name">{setInfo.name} (3-piece)</div>
            </div>
            <div className="echo-buff-effect" style={{ paddingTop: '0.5rem' }}>
                {highlightKeywordsInText(
                    'Dealing Echo Skill DMG increases Heavy Attack Crit. Rate by 20% for 6s.', ['Echo Skill', 'Heavy Attack'])}
            </div>
            <label className="modern-checkbox">
                <input
                    type="checkbox"
                    checked={activeStates.flamewingsShadow2pcP1 || false}
                    onChange={() => toggleState('flamewingsShadow2pcP1')}
                />
                Enable
            </label>
            <div className="echo-buff-effect" style={{ paddingTop: '0.5rem' }}>
                {highlightKeywordsInText(
                    'Dealing Heavy Attack DMG increases Echo Skill Crit. Rate by 20% for 6s', ['Echo Skill', 'Heavy Attack'])}
            </div>
            <label className="modern-checkbox">
                <input
                    type="checkbox"
                    checked={activeStates.flamewingsShadow2pcP2 || false}
                    onChange={() => toggleState('flamewingsShadow2pcP2')}
                />
                Enable
            </label>
            <div className="echo-buff-effect" style={{ paddingTop: '0.5rem' }}>
                {highlightKeywordsInText(
                    'While both effects are active, gain 16% Fusion DMG Bonus.', ['Fusion DMG Bonus'])}
            </div>
        </div>
    );
}