import React, {useEffect, useRef, useState} from 'react';
import { highlightKeywordsInText, setIconMap } from '../../constants/echoSetData.jsx';
import {imageCache} from '../../pages/calculator.jsx';
import {
    formatStatKey,
    getEchoScores,
    getEchoStatsFromEquippedEchoes,
    getTop5SubstatScoreDetails
} from '../../utils/echoHelper.js';
import { statIconMap } from '../CharacterStats.jsx';
import { attributeColors } from '../../utils/attributeHelpers.js';
import {formatStatValue} from "../weapon-pane/WeaponPane.jsx";
import {getActiveStateWeapons} from "../../data/buffs/weaponBuffs.js";
import weaponsRaw from '../../data/weapons.json';
import {getActiveEchoes} from "../../data/buffs/applyEchoLogic.js";
import {getEquippedEchoesScoreDetails} from "../echoes-pane-ui/EchoesPane.jsx";
import {downloadFixedSizePNG} from "../../utils/ScreenshotUtil.js";
import {Download, Camera} from 'lucide-react';
import NotificationToast from "../utils-ui/NotificationToast.jsx";
import GuidesModal from "../utils-ui/GuideModal.jsx";
import ConfirmationModal from "../utils-ui/ConfirmationModal.jsx";

export default function OverviewDetailPane({
                                               character,
                                               runtime,
                                               splashArt,
                                               keywords,
                                               weapons,
                                               characters,
                                               switchLeftPane,
                                               setCharacterRuntimeStates,
                                               setSelectedId,
                                               handleCharacterSelect,
                                               handleReset,
                                               sortedCharacterIds,
                                               allRotations,
    theme
                                           }) {
    if (!character || !runtime) return null;

    const [popupMessage, setPopupMessage] = useState({
        icon: null,
        message: null,
        color: null,
    });

    const [showToast, setShowToast] = useState(false);

    let { displayName, level } = character;

    const paneRef = useRef(null);
    const handleDownload = async () => {
        await downloadFixedSizePNG(paneRef.current, {
            width: 1243,
            height: 1310,
            filename: `${displayName.toLowerCase()}-overview.png`,
        });
    };

    const handleCopyScreenshot = async () => {
        const { copied } = await downloadFixedSizePNG(paneRef.current, {
            width: 1243,
            height: 1310,
            filename: `${displayName.toLowerCase()}-overview.png`,
            copyToClipboard: true,
            shouldDownload: false
        });
        setPopupMessage({
            message: copied ? 'Screenshot copied to clipboard~! (〜^∇^)〜' :
                'Copied a data URL (image clipboard not supported (・_・;)).',
            icon: '✔',
            color: { light: 'green', dark: 'limegreen' },
        });
        setShowToast(true);
    };

    const weaponMap = {};
    (weaponsRaw ?? []).forEach(w => {
        weaponMap[w.id] = w;
    });
    const buffWeapons = getActiveStateWeapons(runtime.activeStates);
    const activeEchoes = getActiveEchoes(runtime.activeStates);
    level = runtime.CharacterLevel ?? level;
    const echoes = runtime.equippedEchoes ?? [];
    const weapon = runtime.CombatState ?? {};
    const weaponId = weapon.weaponId;
    const weaponDetail = weapons?.[weaponId] ?? null;
    const activeWeaponIconPath = weaponId
        ? `/assets/weapon-icons/${weaponId}.webp`
        : '/assets/weapon-icons/default.webp';
    const getImageSrc = (icon) => imageCache[icon]?.src || icon;
    const finalStats = runtime?.FinalStats ?? runtime.Stats ?? {};
    const statGroups = [
        [
            { label: 'ATK', key: 'atk' },
            { label: 'HP', key: 'hp' },
            { label: 'DEF', key: 'def' }
        ],
        [
            { label: 'Energy Regen', key: 'energyRegen' },
            { label: 'Crit Rate', key: 'critRate' },
            { label: 'Crit DMG', key: 'critDmg' },
            { label: 'Healing Bonus', key: 'healingBonus' }
        ],
        [
            'aero', 'glacio', 'spectro', 'fusion', 'electro', 'havoc'
        ].map(el => ({
            label: `${el.charAt(0).toUpperCase() + el.slice(1)} DMG Bonus`,
            key: `${el}DmgBonus`,
            color: attributeColors[el] ?? '#fff'
        })),
        [
            { label: 'Basic Attack DMG Bonus', key: 'basicAtk' },
            { label: 'Heavy Attack DMG Bonus', key: 'heavyAtk' },
            { label: 'Resonance Skill DMG Bonus', key: 'skillAtk' },
            { label: 'Resonance Liberation DMG Bonus', key: 'ultimateAtk' }
        ]
    ];

    const [selectedRotationIndex, setSelectedRotationIndex] = useState(0);
    const [selectedTeamRotationIndex, setSelectedTeamRotationIndex] = useState(0);
    const [personalBreakdownCycleIndex, setPersonalBreakdownCycleIndex] = useState(0);
    const rotationDmg = allRotations?.personalRotations?.[selectedRotationIndex]?.total;
    const teamRotationDmg = allRotations?.teamRotations?.[selectedTeamRotationIndex]?.total;

    function deleteCharacter() {
        const currentId = String(character.link);
        const remainingIds = sortedCharacterIds.filter(id => id !== currentId);

        if (remainingIds.length === 0 && currentId === '1506') {
            handleReset();
            return;
        }

        let nextId;
        const currentIndex = sortedCharacterIds.findIndex(id => id === currentId);

        const filtered = sortedCharacterIds.filter(id => id !== currentId);
        nextId = sortedCharacterIds[currentIndex + 1] ?? sortedCharacterIds[currentIndex - 1] ?? filtered[0];

        const nextCharacter = characters.find(c => String(c.link) === String(nextId));
        if (nextCharacter) {
            handleCharacterSelect(nextCharacter);
            setSelectedId(String(nextId));
        }

        setCharacterRuntimeStates(prev => {
            const updated = { ...prev };
            delete updated[currentId];
            setPopupMessage({
                message: displayName + ' has been evicted~! (〜^∇^)〜',
                icon: '✔',
                color: 'limegreen'
            });
            setShowToast(true);
            return updated;
        });
    }

    function formatNumber(num) {
        if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B';
        if (num >= 10000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 100000) return (num / 1000).toFixed(1) + 'K';
        return Math.round(num).toLocaleString();
    }

    const [contributorCycleIndex, setContributorCycleIndex] = useState(0);
    const handleCycleClick = () => {
        const contributors = allRotations.teamRotations[selectedTeamRotationIndex]?.contributors ?? {};
        const numContributors = Object.keys(contributors).length;
        setContributorCycleIndex((prev) => (prev + 1) % (numContributors + 1));
    };

    const displayValue = (key, val) => ['atk', 'hp', 'def'].includes(key) ? Math.floor(val) : `${val.toFixed(1)}%`;
    const maxScore = getTop5SubstatScoreDetails(character.link).total;

    const echoData = runtime?.equippedEchoes ?? [null, null, null, null, null];

    const echoStatTotals = getEchoStatsFromEquippedEchoes(echoData);

    const critRate = echoStatTotals.critRate ?? 0;
    const critDmg = echoStatTotals.critDmg ?? 0;
    let critValue = critRate * 2 + critDmg;
    const buildScore = getEquippedEchoesScoreDetails(character.link, { [character.link]: runtime });
    const maxBuildScore = maxScore * 5;
    const percentScore = (buildScore.total / maxBuildScore) * 100;

    const [showGuide, setShowGuide] = useState(false);
    const [guideCategory, setGuideCategory] = useState(null);

    const openGuide = React.useCallback((category) => {
        setGuideCategory(category);
        setShowGuide(true);
    }, []);

    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmMessage, setConfirmMessage] = useState({
        title: null,
        message: null,
        confirmLabel: null,
        cancelLabel: null,
        onConfirm: () => {},
        onCancel: () => {}
    });


    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', flexDirection: 'row', gap: '1rem', marginBottom: '1rem' }}>
                <button onClick={() => openGuide('Overview')} className="btn-primary echoes"
                        style={{ marginRight: 'auto'}}>
                    See Guide
                </button>
                {(theme === "background") ? (
                    <span>
                        (Switch off of the current theme to enable screenshots)
                    </span>
                ) : (
                    <>
                        <button
                            className="download-btn rotation-button screenshot"
                            onClick={handleCopyScreenshot}
                            disabled={theme === 'background'}
                        >
                            <Camera size={24} />
                            <span className="label">Copy screenshot</span>
                        </button>
                        <button
                            className="download-btn rotation-button screenshot"
                            onClick={handleDownload}
                            disabled={theme === 'background'}
                        >
                            <Download size={24} />
                            <span className="label">Download screenshot</span>
                        </button>
                    </>
                )}
            </div>

            <div ref={paneRef} >
                <div className="overview-panel-container inherent-skills-box" style={{margin: 'unset'}}>
                    <div className="character-portrait-section">
                        <div className="portrait-inner">
                            <div className="character-overview-details">
                                <span className="character-name highlight details" style={{ fontSize: '1.5rem', fontWeight:'bold', margin: 'unset' }}>{displayName}</span>
                                <span className="character-level">Lv.{level ?? 1}</span>
                            </div>
                            <div
                                className="character-portrait-content"
                                onClick={() => switchLeftPane('characters')}
                            >
                                <img
                                    src={splashArt || '/assets/sprite/default.webp'}
                                    alt={displayName}
                                    className="character-splash"
                                    onError={(e) => {
                                        e.currentTarget.onerror = null;
                                        e.currentTarget.src = '/assets/sprite/default.webp';
                                    }}
                                />
                            </div>
                            <div className="overview-weapon-details">
                                <span>Build Score — {percentScore > 0 ? percentScore.toFixed(1) : '??'}%</span> |
                                <span>Crit Value — {critValue.toFixed(1)}%</span>
                            </div>
                        </div>
                        <div className="overview-dmg">
                            {runtime?.FinalStats &&(
                                <div className="stats-grid overview" style={{marginTop: '0.5rem'}}>
                                    {statGroups.flat().map((stat, i) => {
                                        const val = finalStats[stat.key];
                                        return (
                                            <div key={stat.key ?? i} className="stat-row" style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between' }}>
                                                <div
                                                    className="stat-label"
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        ...(stat.color ? { color: stat.color } : {})
                                                    }}
                                                >
                                                    {statIconMap[stat.label] && (
                                                        <div
                                                            className="stat-icon"
                                                            style={{
                                                                width: 18,
                                                                height: 18,
                                                                backgroundColor: stat.color ?? '#999',
                                                                WebkitMaskImage: `url(${statIconMap[stat.label]})`,
                                                                maskImage: `url(${statIconMap[stat.label]})`,
                                                                WebkitMaskRepeat: 'no-repeat',
                                                                maskRepeat: 'no-repeat',
                                                                WebkitMaskSize: 'contain',
                                                                maskSize: 'contain'
                                                            }}
                                                        />
                                                    )}
                                                    {stat.label}
                                                </div>
                                                <div className="stat-total">
                                                    <span>{displayValue(stat.key, val)}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            <div className="rotations-overview-boxes">
                                {allRotations?.personalRotations?.length > 0 && (
                                    <div
                                        className="rotation-box inherent-skills-box"
                                        onClick={() => {
                                            const selected = allRotations.personalRotations[selectedRotationIndex];
                                            const skillKeys = Object.keys(selected?.breakdownMap ?? {});
                                            if (skillKeys.length > 0) {
                                                setPersonalBreakdownCycleIndex((prev) => (prev + 1) % (skillKeys.length + 1));
                                            }
                                        }}
                                    >
                                        <select
                                            className="box-header entry-detail-dropdown"
                                            value={selectedRotationIndex}
                                            onChange={(e) => {
                                                setSelectedRotationIndex(Number(e.target.value));
                                                setPersonalBreakdownCycleIndex(0);
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {allRotations.personalRotations.map((entry, index) => (
                                                <option key={entry.id} value={index}>
                                                    {entry.id === 'live'
                                                        ? "Rotation DMG"
                                                        : entry.name ?? `Saved #${index}`}
                                                </option>
                                            ))}
                                        </select>

                                        {(() => {
                                            const selected = allRotations.personalRotations[selectedRotationIndex];
                                            const skillKeys = Object.keys(selected?.breakdownMap ?? {});
                                            const hasBreakdown = skillKeys.length > 0;

                                            const selectedKey = hasBreakdown && personalBreakdownCycleIndex > 0
                                                ? skillKeys[personalBreakdownCycleIndex - 1]
                                                : null;

                                            const displayed = selectedKey
                                                ? selected?.breakdownMap?.[selectedKey]
                                                : selected?.total;

                                            const totalAvg = selected?.total?.avg ?? 0;
                                            const currentAvg = displayed?.avg ?? 0;
                                            const percent = selectedKey && totalAvg > 0
                                                ? `${((currentAvg / totalAvg) * 100).toFixed(1)}%`
                                                : null;

                                            return (
                                                <>
                                                    <div className="box-stat dashed-line">
                                                        <strong className="label">Normal</strong>
                                                        <div className="dash-separator" />
                                                        <div className="damage-tooltip-wrapper" data-tooltip={displayed?.normal?.toLocaleString()}>
                                                            <span className="value">{formatNumber(displayed?.normal)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="box-stat dashed-line">
                                                        <strong className="label">CRIT</strong>
                                                        <div className="dash-separator" />
                                                        <div className="damage-tooltip-wrapper" data-tooltip={displayed?.crit?.toLocaleString()}>
                                                            <span className="value">{formatNumber(displayed?.crit)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="box-stat dashed-line">
                                                        <strong className="label">AVG</strong>
                                                        <div className="dash-separator" />
                                                        <div className="damage-tooltip-wrapper" data-tooltip={displayed?.avg?.toLocaleString()}>
                                                            <span className="value avg">{formatNumber(displayed?.avg)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="overview-weapon-details">
                                                        {!selected?.breakdownMap ? (
                                                            <div
                                                                className="damage-tooltip-wrapper text"
                                                                data-tooltip={'Load in saved rotation and save again :3'}>
                                                                Re-save to see breakdown
                                                            </div>
                                                        ) : (
                                                            <>
                                                                {selectedKey ?? 'Total'}
                                                                {percent ? ` · ${percent}` : ''}
                                                            </>
                                                        )}
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                )}
                                {allRotations?.teamRotations?.length > 0 && (
                                    <div
                                        className="rotation-box inherent-skills-box"
                                        onClick={handleCycleClick}
                                    >
                                        <select
                                            className="box-header entry-detail-dropdown"
                                            style={{ width: '11.2rem' }}
                                            value={selectedTeamRotationIndex}
                                            onChange={(e) => {
                                                setSelectedTeamRotationIndex(Number(e.target.value));
                                                setContributorCycleIndex(0);
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {allRotations.teamRotations.map((entry, index) => (
                                                <option key={entry.id} value={index}>
                                                    {entry.id === 'live Team'
                                                        ? "Team Rotation DMG"
                                                        : entry.name ?? `Saved #${index}`}
                                                </option>
                                            ))}
                                        </select>

                                        {(() => {
                                            const selected = allRotations.teamRotations[selectedTeamRotationIndex];
                                            const contributors = selected?.contributors ?? {};
                                            const contributorIds = Object.keys(contributors);
                                            const contributorId = contributorIds[contributorCycleIndex - 1];
                                            const contributorCharacter = characters.find(c => String(c.link) === String(contributors[contributorId]?.id));

                                            const displayed = contributorCycleIndex === 0
                                                ? selected?.total
                                                : contributors[contributorId]?.total;

                                            const contributor = contributors?.[contributorId];
                                            const teamAvg = teamRotationDmg?.avg ?? 0;
                                            const percent = teamAvg > 0 && contributor?.total?.avg
                                                ? ((contributor?.total?.avg / teamAvg) * 100).toFixed(1)
                                                : null;

                                            return (
                                                <>
                                                    <div className="box-stat dashed-line">
                                                        <strong className="label">Normal</strong>
                                                        <div className="dash-separator" />
                                                        <div className="damage-tooltip-wrapper" data-tooltip={displayed?.normal?.toLocaleString()}>
                                                            <span className="value">{formatNumber(displayed?.normal)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="box-stat dashed-line">
                                                        <strong className="label">CRIT</strong>
                                                        <div className="dash-separator" />
                                                        <div className="damage-tooltip-wrapper" data-tooltip={displayed?.crit?.toLocaleString()}>
                                                            <span className="value">{formatNumber(displayed?.crit)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="box-stat dashed-line">
                                                        <strong className="label">AVG</strong>
                                                        <div className="dash-separator" />
                                                        <div className="damage-tooltip-wrapper" data-tooltip={displayed?.avg?.toLocaleString()}>
                                                            <span className="value avg">{formatNumber(displayed?.avg)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="overview-weapon-details">
                                                        {contributorCycleIndex === 0 ? 'Total' : `${contributorCharacter?.displayName ?? ''}`}
                                                        {percent ? ' · ' : ''}
                                                        {percent ? `${percent}%` : ''}
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="overview-gear">
                        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(25rem, 1fr))' }}>
                            <div
                                className="inherent-skills-box weapon-container"
                                onClick={() => switchLeftPane('weapon')}
                            >
                                <div className="gear-content">
                                    <img
                                        src={activeWeaponIconPath}
                                        alt="Weapon"
                                        loading="lazy"
                                        decoding="async"
                                        className="gear-icon overview-weapon"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = '/assets/weapon-icons/default.webp';
                                            e.currentTarget.classList.add('fallback-icon');
                                        }}
                                    />
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <div className="gear-title highlight" style={{ display: 'flex', alignSelf: 'flex-start' }}>
                                            {weaponDetail?.Name || 'No Weapon'}
                                        </div>
                                        <span className="gear-desc">
                                            {highlightKeywordsInText(formatWeaponEffect(weapon), keywords)}
                                        </span>
                                    </div>
                                </div>
                                {weapon.weaponStat && (
                                    <div className="overview-weapon-details">
                                        <span>Lv.{weapon.weaponLevel ?? 1} - R{weapon.weaponRank ?? 1}</span> |
                                        <span>{formatStatValue(weapon.weaponStat)}</span>
                                        <span>ATK: {weapon.weaponBaseAtk}</span>
                                    </div>
                                )}
                            </div>
                            <div
                                className="inherent-skills-box overview-teammates-box"
                                style={{ margin: 'unset', display: 'grid', gridTemplateColumns: '1fr minmax(10rem, 30%)' }}
                                onClick={() => switchLeftPane('teams')}
                            >
                                <div className="overview-teammates">
                                    <span className="character-level">Teammates</span>
                                    <div className="icon-body">
                                        {[1, 2].map(index => {
                                            const charId = runtime.Team?.[index];
                                            const character = characters.find(c => String(c.link) === String(charId));

                                            return (
                                                <div key={charId ?? index} className="team-slot-wrapper">
                                                    {character?.icon ? (
                                                        <img
                                                            src={character.icon}
                                                            alt={`Character ${index + 1}`}
                                                            className="header-icon overview"
                                                            style={{
                                                                width: '7rem',
                                                                height: '7rem',
                                                                pointerEvents: 'none'
                                                            }}
                                                            loading="lazy"
                                                        />
                                                    ) : (
                                                        <div className="team-icon empty-slot overview" />
                                                    )}
                                                    <div className="character-name highlight">
                                                        {character?.displayName ?? ''}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="overview-buffs-container">
                                    <div className="overview-buffs-container-item">
                                    <span className="character-level">
                                      Weapons{buffWeapons.length > 2 ? ` (+${buffWeapons.length - 2})` : ''}
                                    </span>

                                        <div>
                                            {buffWeapons.length === 0 ? (
                                                <div className="overview-buff-placeholder">hmm...</div>
                                            ) : (
                                                <>
                                                    {buffWeapons.slice(0, 2).map(({ id, value }) => {
                                                        const weaponData = weaponMap[id];
                                                        if (!weaponData) return null;

                                                        return (
                                                            <div key={`weapon-${id}`}>
                                                                <div className="echo-buff-header overview-buffs">
                                                                    <img
                                                                        src={`/assets/weapon-icons/${id}.webp`}
                                                                        alt={weaponData.name}
                                                                        className="echo-buff-icon overview-weapon mini"
                                                                        loading="lazy"
                                                                        onError={(e) => {
                                                                            e.target.onerror = null;
                                                                            e.currentTarget.src = '/assets/weapon-icons/default.webp';
                                                                            e.currentTarget.classList.add('fallback-icon');
                                                                        }}
                                                                    />
                                                                    <div
                                                                        className="character-name"
                                                                        style={{
                                                                            margin: 'unset',
                                                                            maxWidth: '65%',
                                                                            fontSize: '0.85rem',
                                                                            opacity: '0.7',
                                                                            fontWeight: 'bold',
                                                                            whiteSpace: 'nowrap',
                                                                            overflow: 'hidden',
                                                                            textOverflow: 'ellipsis',
                                                                        }}
                                                                        title={`R${value} ${weaponData.name}`}
                                                                    >
                                                                        R{value} {weaponData.name}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}

                                                    {/*{buffWeapons.length > 2 && (
                                                        <div className="echo-buff-header overview-buffs" style={{ opacity: 0.6 }}>
                                                            <div className="character-name" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                                                                Weapons (+{buffWeapons.length - 2})
                                                            </div>
                                                        </div>
                                                    )}*/}
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="overview-buffs-container-item">
                                    <span className="character-level">
                                      Set Buffs{activeEchoes.length > 2 ? ` (+${activeEchoes.length - 2})` : ''}
                                    </span>

                                        <div>
                                            {activeEchoes.length === 0 ? (
                                                <div className="overview-buff-placeholder">hmm...</div>
                                            ) : (
                                                <>
                                                    {activeEchoes.slice(0, 2).map(({ id, name, icon }) => (
                                                        <div key={`set-${id}`}>
                                                            <div className="echo-buff-header overview-buffs">
                                                                <img
                                                                    src={icon}
                                                                    alt={name}
                                                                    className="echo-buff-icon overview-weapon mini"
                                                                    loading="lazy"
                                                                    onError={(e) => {
                                                                        e.target.onerror = null;
                                                                        e.currentTarget.src = '/assets/echoes/default.webp';
                                                                        e.currentTarget.classList.add('fallback-icon');
                                                                    }}
                                                                />
                                                                <div
                                                                    className="character-name"
                                                                    style={{
                                                                        margin: 'unset',
                                                                        maxWidth: '65%',
                                                                        fontSize: '0.85rem',
                                                                        opacity: '0.7',
                                                                        fontWeight: 'bold',
                                                                        whiteSpace: 'nowrap',
                                                                        overflow: 'hidden',
                                                                        textOverflow: 'ellipsis',
                                                                    }}
                                                                    title={name}
                                                                >
                                                                    {name}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {/*{activeEchoes.length > 2 && (
                                                        <div className="echo-buff-header overview-buffs" style={{ opacity: 0.6 }}>
                                                            <div className="character-name" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                                                                Set Buffs (+{activeEchoes.length - 2})
                                                            </div>
                                                        </div>
                                                    )}*/}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="echo-grid">
                            {[...Array(5)].map((_, index) => {
                                const echo = echoes[index] ?? null;
                                const score = (getEchoScores(character.link, echo).totalScore / maxScore) * 100;
                                const cv = (echo?.subStats?.critRate ?? 0) * 2 + (echo?.subStats?.critDmg ?? 0);

                                return (
                                    <div
                                        key={index}
                                        className="echo-tile overview inherent-skills-box"
                                        style={{ margin: 'unset' }}
                                        onClick={() => switchLeftPane('echoes')}
                                    >
                                        <EchoGridPreview
                                            echo={echo}
                                            getImageSrc={getImageSrc}
                                            score={score}
                                            setIconMap={setIconMap}
                                            cv={cv}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <div className="delete-character-wrapper" style={{ padding: '2rem', textAlign: 'center' }}>
                <button
                    className="clear-button"
                    onClick={() => {
                        setConfirmMessage({
                            confirmLabel: 'Delete Character',
                            onConfirm: deleteCharacter
                        });
                        setShowConfirm(true);
                    }}
                >
                    Delete Character
                </button>
            </div>

            {showToast && popupMessage.message && (
                <NotificationToast
                    message={popupMessage.message}
                    icon={popupMessage.icon}
                    color={popupMessage.color}
                    onClose={() => setShowToast(false)}
                    position={'top'}
                    bold={true}
                    duration={3000}
                />
            )}

            <GuidesModal
                open={showGuide}
                category={guideCategory}
                onClose={() => setShowGuide(false)}
            />

            {showConfirm && (
                <ConfirmationModal
                    open={showConfirm}
                    title={confirmMessage.title}
                    message={confirmMessage.message}
                    confirmLabel={confirmMessage.confirmLabel}
                    onConfirm={confirmMessage.onConfirm}
                    onCancel={confirmMessage.onCancel}
                    onClose={() => setShowConfirm(false)}
                />
            )}

        </>
    );
}

function formatWeaponEffect(weapon) {
    const rank = weapon?.weaponRank - 1;
    const paramArrays = weapon?.weaponParam;
    let template = weapon?.weaponEffect ?? '';

    if (!Array.isArray(paramArrays) || typeof template !== 'string') return template;

    template = template
        .replace(/<size=\d+>|<\/size>/g, '')
        .replace(/<color=[^>]+>|<\/color>/g, '')
        .replace(/<a\s+href=.*?>/gi, '')
        .replace(/<\/a>/gi, '')
        .replace(/\n/g, '<br>');

    const param = []

    template = template.replace(/\{Cus:[^}]*S=([^ ]+)\s+P=([^ ]+)\s+SapTag=(\d+)[^}]*\}/g, (_, singular, plural, tagIndex) => {
        const value = parseFloat(param[parseInt(tagIndex, 10)]);
        return value === 1 ? singular : plural;
    });

    template = template.replace(/\{Cus:Ipt,[^}]*Touch=([^ ]+)\s+PC=([^ ]+)\s+Gamepad=([^ }]+)[^}]*\}/g, (_, touch, pc, gamepad) => {
        const inputs = new Set([touch, pc, gamepad]);
        return Array.from(inputs).join('/');
    });

    return template.replace(/\{(\d+)\}/g, (match, groupIndex) => {
        const paramGroup = paramArrays[+groupIndex];
        const value = Array.isArray(paramGroup) ? paramGroup[rank] : undefined;
        return value !== undefined ? value : match;
    });
}

export function EchoGridPreview({
                                    echo,
                                    getImageSrc,
                                    score = null,
                                    setIconMap,
                                    className = '',
                                    cv = null
                                }) {
    return (
        <>
            {echo ? (
                <>
                    <div className={`gear-header ${className}`}>
                        <div className={`echo-set-cost-header ${className}`}>
                            {echo?.selectedSet && (
                                <img
                                    src={setIconMap[echo.selectedSet]}
                                    alt={`Set ${echo.selectedSet}`}
                                    className={`echo-set-icon overview ${className}`}
                                />
                            )}
                            <div className={`echo-slot-cost-badge bag overview ${className}`}>{echo.cost}</div>
                        </div>
                        <div className={`cv-container-tooltip ${className}`} style={{ display: 'grid', gap: '4px' }}>
                            {score > 0 && (
                                <div data-tooltip={`Echo Score`}
                                    className={`damage-tooltip-wrapper cv-container overview-weapon-details echo-buff overview ${className}`}>
                                    {cv ? `Sc:` : ''} {score.toFixed(1)}%
                                </div>
                            )}
                            {cv > 0 && (
                                <div
                                    data-tooltip="Echo CV"
                                    className={`damage-tooltip-wrapper cv-container overview-weapon-details echo-buff overview ${className}`}
                                >
                                    CV: {cv.toFixed(1)}%
                                </div>
                            )}
                        </div>
                    </div>

                    <img
                        src={getImageSrc(echo.icon || '/assets/echoes/default.webp')}
                        alt={echo.name || 'Echo'}
                        className={`gear-icon ${className}`}
                        onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = '/assets/echoes/default.webp';
                        }}
                    />
                    <div className={`gear-title highlight ${className}`}>{echo.name || 'Echo'}</div>

                    <div className={`echo-stats-preview ${className}`} style={{ cursor: 'unset' }}>
                        <div className={`echo-bag-info-main ${className}`}>
                            {Object.entries(echo.mainStats ?? {}).map(([key, val]) => {
                                const label = formatStatKey(key);
                                const iconUrl = statIconMap[label];

                                return (
                                    <div key={key} className={`stat-row ${className}`}>
                                    <span className={`echo-stat-label ${className}`}>
                                        {iconUrl && (
                                            <div
                                                className={`stat-icon ${className}`}
                                                style={{
                                                    width: 12,
                                                    height: 12,
                                                    backgroundColor: '#999',
                                                    WebkitMaskImage: `url(${iconUrl})`,
                                                    maskImage: `url(${iconUrl})`,
                                                    WebkitMaskRepeat: 'no-repeat',
                                                    maskRepeat: 'no-repeat',
                                                    WebkitMaskSize: 'contain',
                                                    maskSize: 'contain',
                                                    display: 'inline-block',
                                                    marginRight: '0.125rem',
                                                    verticalAlign: 'middle',
                                                    paddingRight: '0.125rem',
                                                }}
                                            />
                                        )}
                                        {label}
                                    </span>
                                        <span className={`echo-stat-value ${className}`}>
                                            {key.endsWith('Flat') ? val : `${val?.toFixed(1)}%`}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                        {Object.entries(echo.subStats ?? {}).map(([key, val]) => {
                            const label = formatStatKey(key);
                            const iconUrl = statIconMap[label];

                            return (
                                <div key={key} className={`stat-row ${className}`}>
                                    <span className={`echo-stat-label ${className}`}>
                                        {iconUrl && (
                                            <div
                                                className={`stat-icon ${className}`}
                                                style={{
                                                    width: 12,
                                                    height: 12,
                                                    backgroundColor: '#999',
                                                    WebkitMaskImage: `url(${iconUrl})`,
                                                    maskImage: `url(${iconUrl})`,
                                                    WebkitMaskRepeat: 'no-repeat',
                                                    maskRepeat: 'no-repeat',
                                                    WebkitMaskSize: 'contain',
                                                    maskSize: 'contain',
                                                    display: 'inline-block',
                                                    marginRight: '0.125rem',
                                                    verticalAlign: 'middle',
                                                    paddingRight: '0.125rem',
                                                }}
                                            />
                                        )}
                                        {label}
                                    </span>
                                    <span className={`echo-stat-value ${className}`}>
                                        {key.endsWith('Flat') ? val : `${val?.toFixed(1)}%`}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </>
            ) : (
                <div className={`empty-echo-tile ${className}`}>Empty</div>
            )}
        </>
    );
}