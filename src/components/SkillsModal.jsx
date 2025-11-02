import React, {useState} from 'react';
import { formatDescription } from '../utils/formatDescription';
import skillTabs from '../constants/skillTabs';
import {highlightKeywordsInText} from "../constants/echoSetData.jsx";


export default function SkillsModal({ skillsModalOpen, setSkillsModalOpen, activeCharacter, activeSkillTab, setActiveSkillTab, sliderValues, currentSliderColor, keywords, isDark }) {
    const getSkillData = (tab) => {
        if (!activeCharacter?.raw?.SkillTrees) return null;
        const tree = Object.values(activeCharacter.raw.SkillTrees).find(tree =>
            tree.Skill?.Type?.toLowerCase().replace(/\s/g, '') === tab.toLowerCase()
        );
        return tree?.Skill ?? null;
    };

    const [isClosing, setIsClosing] = useState(false);
    if (!skillsModalOpen) return null;

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setSkillsModalOpen(false);
            setIsClosing(false);
        }, 300);
    };

    return (
        <div
            className={`skills-modal-overlay ${isClosing ? 'closing' : ''}`}
            onClick={handleClose}
        >
            <div
                className={`skills-modal-content ${isDark ? 'dark-text' : 'light-text'} ${isClosing ? 'closing' : ''}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="rotation-view-toggle">
                    {skillTabs.map(tab => (
                        <button key={tab} className={`view-toggle-button ${activeSkillTab === tab ? 'active' : ''}`} onClick={() => setActiveSkillTab(tab)}>
                            {tab.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </button>
                    ))}
                </div>

                <div className="skills-modal-content-area">
                    {activeCharacter && (() => {
                        const skill = getSkillData(activeSkillTab);
                        if (!skill) return <p>No data available.</p>;
                        const sliderValue = sliderValues[activeSkillTab];
                        return (
                            <>
                                <h3>{skill.Name ?? activeSkillTab}</h3>
                                <p>
                                    {highlightKeywordsInText(formatDescription(skill.Desc, skill.Param, currentSliderColor), keywords)}
                                </p>
                                {skill.Level && (
                                    <table className="multipliers-table">
                                        <tbody>
                                        {Object.entries(skill.Level).map(([key, levelData]) => (
                                            <tr key={key} className="multiplier-row">
                                                <td className="multiplier-label">{levelData.Name}</td>
                                                <td className="multiplier-value">{levelData.Param?.[0]?.[sliderValue - 1] ?? 'N/A'}</td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                )}
                            </>
                        );
                    })()}
                </div>

                <button className="edit-substat-button btn-primary echoes" onClick={handleClose}>Close</button>
            </div>
        </div>
    );
}