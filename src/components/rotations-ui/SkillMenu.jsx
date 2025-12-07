import React from "react";

export const tabDisplayOrder = [
    'normalAttack',
    'resonanceSkill',
    'forteCircuit',
    'resonanceLiberation',
    'introSkill',
    'outroSkill',
    'echoAttacks',
    'negativeEffect'
];

const tabDisplayNames = {
    normalAttack: 'Normal Attack',
    resonanceSkill: 'Resonance Skill',
    forteCircuit: 'Forte Circuit',
    resonanceLiberation: 'Resonance Liberation',
    introSkill: 'Intro Skill',
    outroSkill: 'Outro Skill',
    echoAttacks: 'Echo Attacks',
    negativeEffect: 'Negative Effects'
};

export const skillTypeIconMap = {
    basic: '/assets/stat-icons/basic.png',
    heavy: '/assets/stat-icons/heavy.png',
    skill: '/assets/stat-icons/skill.png',
    ultimate: '/assets/stat-icons/liberation.png',
    intro: '/assets/stat-icons/intro.png',
    outro: '/assets/stat-icons/outro.png',
    //healing: '/assets/stat-icons/healing.png',
    shielding: '/assets/stat-icons/shield.png',
    spectroFrazzle: '/assets/stat-icons/flat-attribute/spectro.webp',
    aeroErosion: '/assets/stat-icons/flat-attribute/aero.webp',
    echoSkill: '/assets/stat-icons/echo.png'
};

export const skillTypeLabelMap = {
    basic: 'Basic Attack',
    skill: 'Resonance Skill',
    heavy: 'Heavy Attack',
    ultimate: 'Resonance Liberation',
    intro: 'Intro Skill',
    outro: 'Outro Skill',
    spectroFrazzle: 'Spectro Frazzle',
    aeroErosion: 'Aero Erosion',
    echoSkill: 'Echo Skill',
    healing: 'Healing',
    shielding: 'Shielding',
    tuneRupture: 'Tune Rupture'
};

export default function SkillMenu({
                                      open,
                                      isClosing,
                                      closeMenu,
                                      groupedSkillOptions,
                                      expandedTabs,
                                      toggleTab,
                                      handleAddSkill,
                                      onClickOut = null
                                  }) {
    if (!open) return null;

    return (
        <div
            className={`skill-menu-overlay ${isClosing ? "fade-out" : ""}`}
            onClick={onClickOut ? onClickOut : closeMenu}
        >
            <div
                className={`skill-menu-panel guides changelog-modal ${
                    isClosing ? "fade-out" : "fade-in"
                }`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="menu-header-with-buttons">
                    <div className="menu-header">Select a Skill</div>
                    <button className="rotation-button clear" onClick={closeMenu}>
                        ✕
                    </button>
                </div>

                <div className="skill-menu-list">
                    {tabDisplayOrder.map(
                        (tabKey) =>
                            groupedSkillOptions[tabKey]?.length > 0 && (
                                <div key={tabKey} className={`skill-tab-section echo-buff ${
                                    expandedTabs[tabKey] ? 'open' : 'closed'
                                }`}>
                                    <div
                                        className="skill-tab-label collapsible-label"
                                        onClick={() => toggleTab(tabKey)}
                                    >
                                        <span>{tabDisplayNames[tabKey]}</span>
                                    </div>

                                    <div
                                        className={`skill-tab-content ${
                                            expandedTabs[tabKey] ? 'open' : 'closed'
                                        }`}
                                    >
                                        {groupedSkillOptions[tabKey].map((skill, index) => (
                                            <div
                                                key={index}
                                                className="skill-option"
                                                onClick={() => handleAddSkill(skill)}
                                            >
                                                <div className="dropdown-item-content">
                                                    <div className="dropdown-main">
                                                        <span>{skill.name}</span>
                                                    </div>

                                                    <div className="dropdown-icons">
                                                        {(() => {
                                                            const type = Array.isArray(skill.type)
                                                                ? skill.type[0]
                                                                : skill.type;
                                                            if (
                                                                typeof type === "string" &&
                                                                skillTypeIconMap[type.toLowerCase()]
                                                            ) {
                                                                return (
                                                                    <img
                                                                        src={skillTypeIconMap[type.toLowerCase()]}
                                                                        style={{ width: "1.5rem", height: "1.5rem" }}
                                                                        alt={type}
                                                                        className="skill-type-icon"
                                                                        onError={(e) => {
                                                                            e.target.style.display = "none";
                                                                        }}
                                                                    />
                                                                );
                                                            }
                                                            return null;
                                                        })()}

                                                        <span
                                                            style={{ opacity: 0.75, fontSize: "0.8rem" }}
                                                        >
                                                            {(() => {
                                                                const type = Array.isArray(skill.type)
                                                                  ? skill.type[0]
                                                                  : skill.type;
                                                                return typeof type === "string"
                                                                  ? skillTypeLabelMap[type] ?? type
                                                                  : "Unknown";
                                                            })()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                    )}
                </div>
            </div>
        </div>
    );
}