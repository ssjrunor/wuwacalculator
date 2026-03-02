import React, { useState, useEffect } from "react";
import { formatDescription } from "@shared/utils/formatDescription.js";
import skillTabs from "@shared/constants/skillTabs.js";
import { highlightKeywordsInText } from "@shared/constants/echoSetData.jsx";

export default function SkillsModal({
                                        skillsModalOpen,
                                        setSkillsModalOpen,
                                        activeCharacter,
                                        activeSkillTab,
                                        setActiveSkillTab,
                                        sliderValues,
                                        currentSliderColor,
                                        keywords,
                                        isDark
                                    }) {
    const [isClosing, setIsClosing] = useState(false);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (skillsModalOpen) {
            setVisible(true);
        } else {
            setIsClosing(true);
            const timer = setTimeout(() => {
                setVisible(false);
                setIsClosing(false);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [skillsModalOpen]);

    const getSkillData = (tab) => {
        if (!activeCharacter?.raw?.SkillTrees) return null;
        const tree = Object.values(activeCharacter.raw.SkillTrees).find(
            (tree) =>
                tree.Skill?.Type?.toLowerCase().replace(/\s/g, "") ===
                tab.toLowerCase()
        );
        return tree?.Skill ?? null;
    };

    if (!visible) return null;

    return (
        <div
            className={`skills-modal-overlay ${isClosing ? "closing" : "open"}`}
            onClick={() => setSkillsModalOpen(false)}
        >
            <div
                className={`skills-modal-content ${
                    isDark ? "dark-text" : "light-text"
                } ${isClosing ? "closing" : "open"}`}
                style={{ maxWidth: '900px' }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="rotation-view-toggle">
                    {skillTabs.map((tab) => (
                        <button
                            key={tab}
                            className={`view-toggle-button ${
                                activeSkillTab === tab ? "active" : ""
                            }`}
                            onClick={() => setActiveSkillTab(tab)}
                        >
                            {tab
                                .replace(/([A-Z])/g, " $1")
                                .replace(/^./, (str) => str.toUpperCase())}
                        </button>
                    ))}
                </div>

                <div className="skills-modal-content-area changelog-entries main-echo-description guides">
                    {activeCharacter &&
                        (() => {
                            const skill = getSkillData(activeSkillTab);
                            if (!skill) return <p>No data available.</p>;
                            const sliderValue = sliderValues[activeSkillTab];
                            return (
                                <>
                                    <h3>{skill.Name ?? activeSkillTab}</h3>
                                    <p>
                                        {highlightKeywordsInText(
                                            formatDescription(
                                                skill.Desc,
                                                skill.Param,
                                                currentSliderColor
                                            ),
                                            keywords
                                        )}
                                    </p>
                                    {skill.Level && (
                                        <table className="multipliers-table">
                                            <tbody>
                                            {Object.entries(skill.Level).map(
                                                ([key, levelData]) => (
                                                    <tr key={key} className="multiplier-row">
                                                        <td className="multiplier-label">
                                                            {levelData.Name}
                                                        </td>
                                                        <td className="multiplier-value">
                                                            {levelData.Param?.[0]?.[sliderValue - 1] ??
                                                                "N/A"}
                                                        </td>
                                                    </tr>
                                                )
                                            )}
                                            </tbody>
                                        </table>
                                    )}
                                </>
                            );
                        })()}
                </div>

                <button
                    className="edit-substat-button btn-primary echoes"
                    onClick={() => setSkillsModalOpen(false)}
                >
                    Close
                </button>
            </div>
        </div>
    );
}