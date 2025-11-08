import React from "react";
import Rotations, { TeamRotation } from "./Rotations.jsx";
import { attributeColors } from "../utils/attributeHelpers.js";
import {getSkillData} from "../utils/computeSkillDamage.js";
import {i} from "framer-motion/m";

export default function DamageSection({
                                          charId,
                                          skillResults = [],
                                          echoSkillResults = [],
                                          negativeEffects = [],
                                          showSubHits,
                                          setShowSubHits,
                                          rotationEntries,
                                          teamRotationDmg,
                                          hasValidTeamRotation,
                                          characterRuntimeStates,
                                          characterStates,
                                          setCharacterRuntimeStates,
                                          isDark,
                                          activeCharacter
                                      }) {
    if (!skillResults?.length) return null;

    const formatNumber = (num) => {
        if (num >= 1e9) return (num / 1e9).toFixed(1) + "B";
        if (num >= 1e6) return (num / 1e6).toFixed(1) + "M";
        return Math.round(num).toLocaleString();
    };

    const getSubHitFormula = (hits, type) => {
        if (!hits || hits.length === 0) return "";
        return hits.map(hit => {
            const val = Math.round(hit[type]);
            return hit.count > 1
                ? `${val.toLocaleString()} × ${hit.count}`
                : `${val.toLocaleString()}`;
        }).join(" + ");
    };
    const textColor = isDark ? '#dddddd' : 'unset'

    const renderSkillRow = (skill, color) => {
        const isSupportSkill = skill.isSupportSkill;
        const supportColor = skill.supportColor ?? color;
        const displayColor = isSupportSkill ? supportColor : color;

        if (isSupportSkill) {
            return (
                <React.Fragment key={skill.name}>
                    <div style={{ color: supportColor, fontWeight: "bold" }}>{skill.name}</div>
                    <div></div><div></div>
                    <div style={{ color: supportColor, fontWeight: "bold" }}>
                        {formatNumber(skill.avg)}
                    </div>
                </React.Fragment>
            );
        }

        return (
            <React.Fragment key={skill.name}>
                <div
                    className={skill.tab === 'echoAttacks' ? "highlight" : ""}
                    style={{
                        fontWeight: "bold",
                        color:
                            skill.tab === 'negativeEffect' ?
                                attributeColors[skill.element] : textColor,
                    }}
                >
                    {skill.name}
                </div>
                <div
                    className="damage-tooltip-wrapper"
                    data-tooltip={skill.subHits?.length > 0 ? getSubHitFormula(skill.subHits, "normal") : skill.normal.toLocaleString()}
                    style={{ color: displayColor, fontWeight: "bold" }}
                >
                    {formatNumber(skill.normal)}
                </div>
                <div
                    className="damage-tooltip-wrapper"
                    data-tooltip={skill.subHits?.length > 0 ? getSubHitFormula(skill.subHits, "crit") : skill.crit.toLocaleString()}
                    style={{ color: displayColor, fontWeight: "bold" }}
                >
                    {formatNumber(skill.crit)}
                </div>
                <div
                    className="damage-tooltip-wrapper"
                    data-tooltip={skill.subHits?.length > 0 ? getSubHitFormula(skill.subHits, "avg") : skill.avg.toLocaleString()}
                    style={{ color: displayColor, fontWeight: "bold" }}
                >
                    {formatNumber(skill.avg)}
                </div>

                {showSubHits &&
                    skill.subHits?.map((hit, i) => (
                        <React.Fragment key={`${skill.name}-sub-${i}`}>
                            <div style={{ paddingLeft: "0.5rem", fontStyle: "italic", fontSize: "0.9rem", opacity: 0.8 }}>
                                ↳ {skill.name}-{i + 1}{hit.label ? ` (${hit.label})` : ""}
                            </div>
                            <div className="subhit" style={{ fontSize: "0.9rem", opacity: 0.6 }}>
                                {formatNumber(Math.round(hit.normal))}
                            </div>
                            <div className="subhit" style={{ fontSize: "0.9rem", opacity: 0.6 }}>
                                {formatNumber(Math.round(hit.crit))}
                            </div>
                            <div className="subhit" style={{ fontSize: "0.9rem", opacity: 0.6 }}>
                                {formatNumber(Math.round(hit.avg))}
                            </div>
                        </React.Fragment>
                    ))}
            </React.Fragment>
        );
    };

    // ---------- group skills by tab so we render per-tab boxes ----------
    const groupedByTab = skillResults.reduce((acc, skill) => {
        const tab = skill.tab ?? "Misc";
        (acc[tab] ||= []).push(skill);
        return acc;
    }, {});

    const skillSections = Object.entries(groupedByTab)
        .filter(([tab, skills]) => skills.some(s => s.visible))
        .map(([tab, skills]) => {
            const skill = getSkillData(activeCharacter, tab);
            return (
                <div key={tab} className="box-wrapper">
                    <div className="damage-inner-box">
                        <h3 className="damage-box-title">
                            {tab
                                .replace(/([A-Z])/g, " $1")
                                .replace(/^./, s => s.toUpperCase())}
                            {skill?.Name ? `: ${skill.Name}` : ''}
                        </h3>
                        <div className="damage-grid">
                            <div></div>
                            <div className="subhit">Normal</div>
                            <div className="subhit">CRIT</div>
                            <div className="subhit">AVG</div>
                            {skills
                                .filter(s => s.visible)
                                .map(s => renderSkillRow(s, attributeColors[s.element] ?? "#ccc"))}
                        </div>
                    </div>
                </div>
            )
        });

    const team = characterRuntimeStates?.[charId]?.Team ?? [];
    const teamRotation = characterRuntimeStates?.[charId]?.teamRotation ?? {};
    const activeStates = characterRuntimeStates?.[charId]?.activeStates ?? {};
    const toggleKeys = ["teammateRotation-1", "teammateRotation-2"];
    const computedHasValidTeamRotation =
        team.length > 1 &&
        Object.keys(teamRotation).length > 0 &&
        (activeStates[toggleKeys[0]] || activeStates[toggleKeys[1]]);

    const showTeamRotation = (typeof hasValidTeamRotation === "boolean")
        ? hasValidTeamRotation
        : computedHasValidTeamRotation;

    const allDisabled = rotationEntries
        .filter(entry => entry.type !== 'block')
        .every(entry => entry.disabled === true);

    console.log(allDisabled);

    return (
        <div className="damage-box">
            <h2 className="panel-title">
                Damage
                <label className="modern-checkbox" style={{ fontSize: "1rem", gap: "0.3rem" }}>
                    Show Sub-Hits
                    <input
                        type="checkbox"
                        checked={showSubHits}
                        onChange={(e) => setShowSubHits(e.target.checked)}
                    />
                </label>
            </h2>

            <div className="damage-section">
                {skillSections}
                {(rotationEntries?.length > 0 && !allDisabled) && (
                    <div className="box-wrapper">
                        <div className="damage-inner-box">
                            <Rotations
                                charId={charId}
                                rotationEntries={rotationEntries}
                                characterRuntimeStates={characterRuntimeStates}
                                skillResults={skillResults}
                            />
                        </div>
                    </div>
                )}
                {showTeamRotation && (
                    <div className="box-wrapper">
                        <div className="damage-inner-box">
                            <TeamRotation
                                mainCharId={charId}
                                characterRuntimeStates={characterRuntimeStates}
                                characterStates={characterStates}
                                setCharacterRuntimeStates={setCharacterRuntimeStates}
                                result={teamRotationDmg}
                                skillResults={skillResults}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}