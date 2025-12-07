import React, {useEffect, useState} from 'react';
import { setIconMap } from "../../constants/echoSetData2.js";
import weaponsRaw from "../../data/weapons.json";
import {attributeColors, elementToAttribute} from "../../utils/attributeHelpers.js";
import weapons from '../../data/weaponDetails.json';
import {getEchoScores, getTop5SubstatScoreDetails} from "../../utils/echoHelper.js";
import {EchoGridPreview} from "../overview-ui/OverviewDetailPane.jsx";
import {getEquippedEchoesScoreDetails} from "../echoes-pane-ui/EchoesPane.jsx";
import {imageCache} from "../../pages/calculator.jsx";

export default function ImportOverviewMini({ importPreview, isOpen, onClose, onConfirm, confirmLabel = 'Confirm Import' }) {
    if (!importPreview) return null;
    const [isClosing, setIsClosing] = useState(false);
    const getImageSrc = (icon) => imageCache[icon]?.src || icon;
    const { Id: charId, Name, CharacterLevel, CombatState, equippedEchoes = [], activeStates, SkillLevels, Attribute, Team } = importPreview;
    const weapon = CombatState || {};
    const teammates = (Team?.slice(1) || []).slice(-2);

    const weaponMap = {};
    (weaponsRaw ?? []).forEach(w => {
        weaponMap[w.id] = w;
    });

    const weaponId = weapon.weaponId;
    const weaponDetail = (weapons ?? []).find(w => String(w.Id) === String(weaponId)) ?? null;

    const weaponIconPath = weaponId
        ? `/assets/weapon-icons/${weaponId}.webp`
        : '/assets/weapon-icons/default.webp';

    const echoSlots = [...equippedEchoes];
    while (echoSlots.length < 5) echoSlots.push(null);

    const attributeColor =
        attributeColors[elementToAttribute[Attribute]] || 'rgba(32,191,185,0.89)';

    const maxScore = getTop5SubstatScoreDetails(charId).total;

    const buildScore = getEquippedEchoesScoreDetails(
        charId,
        { [charId]: { ...importPreview, equippedEchoes: equippedEchoes } }
    );
    const maxBuildScore = maxScore * 5;
    const percentScore = (buildScore.total / maxBuildScore) * 100;

    useEffect(() => {
        if (isOpen) setIsClosing(false);
    }, [isOpen]);

    if (!isOpen && !isClosing) return null;

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose?.();
            setIsClosing(false);
        }, 300);
    };

    return (
        <div
            className={`skills-modal-overlay ${isClosing ? 'closing' : ''}`}
            onClick={handleClose}
        >
            <div
                className={`skills-modal-content settings-import changelog-modal guides ${isClosing ? 'closing' : ''}`}
                onClick={(e) => e.stopPropagation()}
            >
                <h2>Import Preview</h2>
                <h3 style={{ margin: 'unset'}} >You’re about to import the following character:</h3>

                <div className="import-overview-header">
                    {/* Character cluster */}
                    <div className="import-character echo-buff">
                        <div className="charInfo">
                            <img
                                src={`/assets/sprite/${importPreview.Id}.webp`}
                                alt={Name}
                                className="header-icon overview main-char-icon"
                            />
                            <div className="import-character-info">
                                <span className="char-name highlight">{Name}</span>
                                <span className="char-level">Lv. {CharacterLevel} S{SkillLevels.sequence}</span>
                                <div className="import-teammates-inline">
                                    {Array.from({ length: 2 }).map((_, i) => {
                                        const t = teammates[i];

                                        return t ? (
                                            <img
                                                key={i}
                                                src={`/assets/sprite/${t}.webp`}
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
                                    <span className="weapon-name highlight">{weaponDetail.Name ?? weapon.weaponEffectName}</span>
                                    <div style={{ display: 'flex', flexDirection: 'row', gap: '0.5rem', justifyContent: 'center' }} >
                                        <span className="weapon-level">Lv. {weapon.weaponLevel} R{weapon.weaponRank}</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="weapon-placeholder">No Weapon Equipped</div>
                        )}
                    </div>
                </div>

                {/* Echo grid */}
                <div className="import-echo-grid echo-buff">
                    <div
                        className="echo-grid guides"
                    >
                        {[...Array(5)].map((_, index) => {
                            const echo = equippedEchoes[index] ?? null;
                            const score = (getEchoScores(charId, echo).totalScore / maxScore) * 100;

                            return (
                                <div
                                    key={index}
                                    className="echo-tile overview inherent-skills-box"
                                >
                                    <EchoGridPreview
                                        echo={echo}
                                        getImageSrc={getImageSrc}
                                        score={score}
                                        setIconMap={setIconMap}
                                        className={'settings-import-preview'}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="modal-footer" style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        className="edit-substat-button btn-primary echoes"
                        onClick={handleClose}
                    >
                        Cancel
                    </button>
                    {onConfirm && (
                        <button
                            className="edit-substat-button btn-primary echoes"
                            onClick={() => {
                                onConfirm();
                                handleClose();
                            }}
                        >
                            {confirmLabel}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
