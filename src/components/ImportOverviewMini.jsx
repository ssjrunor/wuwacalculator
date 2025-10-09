import React from 'react';
import {setIconMap} from "../constants/echoSetData.jsx";
import weaponsRaw from "../data/weapons.json";
import {attributeColors, elementToAttribute} from "../utils/attributeHelpers.js";

export default function ImportOverviewMini({ importPreview }) {
    if (!importPreview) return null;
    const { Name, CharacterLevel, CombatState, equippedEchoes = [], activeStates, SkillLevels, Attribute, Team } = importPreview;
    const weapon = CombatState || {};
    const teammates = (Team?.slice(1) || []).slice(-2);

    const weaponMap = {};
    (weaponsRaw ?? []).forEach(w => {
        weaponMap[w.id] = w;
    });

    const weaponId = weapon.weaponId;
    const weaponIconPath = weaponId
        ? `/assets/weapon-icons/${weaponId}.webp`
        : '/assets/weapon-icons/default.webp';


    const echoSlots = [...equippedEchoes];
    while (echoSlots.length < 5) echoSlots.push(null);

    const attributeColor =
        attributeColors[elementToAttribute[Attribute]] || 'rgba(32,191,185,0.89)';

    return (
        <div className="import-overview-mini">
            <div className="import-overview-header">
                {/* Character cluster */}
                <div className="import-character echo-buff">
                    <div className="charInfo">
                        <img
                            src={`/assets/splash/${importPreview.Id}.webp`}
                            alt={Name}
                            className="header-icon overview main-char-icon"
                        />
                        <div className="import-character-info">
                            <span className="char-name highlight">{Name}</span>
                            <span className="char-level">Lv. {CharacterLevel} | S{SkillLevels.sequence}</span>
                            <div className="import-teammates-inline">
                                {Array.from({ length: 2 }).map((_, i) => {
                                    const t = teammates[i];

                                    return t ? (
                                        <img
                                            key={i}
                                            src={`/assets/splash/${t}.webp`}
                                            alt={t.Name}
                                            title={t.Name}
                                            className="header-icon overview teammate-icon"
                                        />
                                    ) : (
                                        <div key={i} className="team-icon empty-slot overview" />
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div
                        className="import-skill-tracker"
                        style={{ '--accent-color': attributeColor }}
                    >
                        {Object.entries(SkillLevels)
                            .filter(([key]) => key !== 'sequence')
                            .map(([skillKey, level]) => (
                                <div key={skillKey} className="skill-bar">
                                    <span className="skill-label">{skillKey}</span>
                                    <div
                                        className="skill-bar-fill"
                                        style={{ '--level': level }}
                                    />
                                    <span className="skill-value">Lv.{level}</span>
                                </div>
                            ))}
                    </div>
                </div>

                {/* Weapon info */}
                <div className="import-weapon-block echo-buff">
                    {weapon.weaponId ? (
                        <>
                            <img
                                src={weaponIconPath}
                                alt="Weapon"
                                loading="lazy"
                                decoding="async"
                                className="weapon-icon-import gear-icon overview-weapon"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = '/assets/weapon-icons/default.webp';
                                    e.currentTarget.classList.add('fallback-icon');
                                }}
                            />
                            <div className="import-weapon-info">
                                <span className="weapon-name highlight">{weapon.weaponEffectName}</span>
                                <div style={{ display: 'flex', flexDirection: 'row', gap: '0.5rem', justifyContent: 'center' }} >
                                    <span className="weapon-rank">R{weapon.weaponRank}</span>
                                    <span className="weapon-level">Lv. {weapon.weaponLevel}</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="weapon-placeholder">No Weapon Equipped</div>
                    )}
                </div>
            </div>

            {/* Echo grid */}
            <div className="import-echo-grid">
                {echoSlots.map((echo, i) => (
                    <div key={i} className="import-echo-slot echo-buff">
                        {echo ? (
                            <>
                                <img
                                    src={echo.icon}
                                    alt={echo.name}
                                    className="gear-icon overview-weapon echo-icon import"
                                />
                                <div className="echo-info">
                                    <span className="echo-name">{echo.name}</span>
                                </div>
                                <div className="cost-set-wrapper echo-buff">
                                    {echo?.selectedSet && (
                                        <img
                                            src={setIconMap[echo.selectedSet]}
                                            alt={`Set ${echo.selectedSet}`}
                                            className="echo-set-icon overview"
                                        />
                                    )}
                                    <span className="echo-slot-cost-badge bag overview">{echo.cost}</span>
                                </div>
                            </>
                        ) : (
                            <div className="empty-echo-slot">
                                <span className="empty-text">Empty Slot</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}