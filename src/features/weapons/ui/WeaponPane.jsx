import React, { useEffect, useRef, useState } from 'react';
import WeaponMenu from './WeaponMenu.jsx';
import { getWeaponUIComponent } from '@/data/weapons/ui/index.js';
import {preloadImages} from "@/pages/Calculator.jsx";
import {highlightKeywordsInText, statKeywords} from "@/constants/echoSetData.jsx";

export function mapExtraStatToCombat(stat) {
    if (!stat || !stat.Name) return {};

    const value = stat.Value ?? 0;
    const name = stat.Name.toLowerCase();

    const scaled = stat.IsRatio ? value * 100 : stat.IsPercent ? value / 100 : value;

    switch (name) {
        case 'atk': return stat.IsRatio ? { atkPercent: scaled } : { atk: scaled };
        case 'hp': return stat.IsRatio ? { hpPercent: scaled } : { hp: scaled };
        case 'def': return stat.IsRatio ? { defPercent: scaled } : { def: scaled };
        case 'crit. rate': return { critRate: scaled };
        case 'crit. dmg': return { critDmg: scaled };
        case 'energy regen': return { energyRegen: scaled };
        default: return {};
    }
}

export default function WeaponPane({
                                       activeCharacter,
                                       combatState,
                                       setCombatState,
                                       weapons,
                                       characterRuntimeStates,
                                       setCharacterRuntimeStates,
                                       weaponList,
                                       weaponById,
                                       weaponIconPaths,
                                       weaponKeywords
                                   }) {
    const filteredWeapons = weaponList ?? Object.values(weapons)
        .filter(
            (weapon) =>
                typeof weapon.Id === 'number' &&
                String(weapon.Id).length >= 8 &&
                (activeCharacter?.weaponType == null || weapon.Type === activeCharacter.weaponType)
        )
        .sort((a, b) => (b.Rarity ?? 0) - (a.Rarity ?? 0));
    const weaponId = combatState.weaponId;
    const activeWeaponIconPath = weaponId
        ? `/assets/weapon-icons/${weaponId}.webp`
        : '/assets/weapon-icons/default.webp';
    const [weaponMenuOpen, setWeaponMenuOpen] = useState(false);
    const weaponMenuRef = useRef(null);
    const weaponTriggerRef = useRef(null);
    const charId = activeCharacter?.Id ?? activeCharacter?.id ?? activeCharacter?.link;
    const activeStates = characterRuntimeStates?.[charId]?.activeStates ?? {};

    const toggleState = (stateKey) => {
        setCharacterRuntimeStates(prev => ({
            ...prev,
            [charId]: {
                ...(prev[charId] ?? {}),
                activeStates: {
                    ...(prev[charId]?.activeStates ?? {}),
                    [stateKey]: !(prev[charId]?.activeStates?.[stateKey] ?? false)
                }
            }
        }));
    };
    const statIconMap = {
        'atk': '/assets/stat-icons/atk.png',
        'hp': '/assets/stat-icons/hp.png',
        'def': '/assets/stat-icons/def.png',
        'crit. rate': '/assets/stat-icons/critrate.png',
        'crit. dmg': '/assets/stat-icons/critdmg.png',
        'energy regen': '/assets/stat-icons/energyregen.png'
    };
    const selectedWeapon = weapons?.[weaponId] ?? null;
    const weaponLevel = combatState.weaponLevel ?? 1;
    const WeaponUI = getWeaponUIComponent(weaponId);
    const [selectedRarities, setSelectedRarities] = useState([1, 2, 3, 4, 5]);
    const handleWeaponSelect = (weapon) => {
        if (combatState.weaponId === weapon.Id) return;
        const levelData = weapon.Stats?.["0"]?.["1"] ?? weapon.Stats?.["0"]?.["0"];
        const baseAtk = levelData?.[0]?.Value ?? 0;
        const stat = levelData?.[1] ?? null;
        const mappedStat = mapExtraStatToCombat(stat);
        setCombatState(prev => ({
            ...prev,
            weaponId: weapon.Id,
            weaponLevel: 1,
            weaponBaseAtk: baseAtk,
            weaponStat: stat,
            weaponRarity: weapon.Rarity ?? 1,

            weaponEffect: weapon.Effect ?? null,
            weaponEffectName: weapon.EffectName ?? null,
            weaponParam: weapon.Param ?? [],
            weaponRank: 1,

            atkPercent: 0,
            defPercent: 0,
            hpPercent: 0,
            critRate: 0,
            critDmg: 0,
            energyRegen: 0,
            ...mappedStat
        }));
        setWeaponMenuOpen(false);
    };
    const handleLevelChange = (level) => {
        const weapon = weaponById?.[weaponId] ?? Object.values(weapons).find(w => w.Id === weaponId);
        if (!weapon) return;

        let tier = 0;
        if (level >= 80) tier = 6;
        else if (level >= 70) tier = 5;
        else if (level >= 60) tier = 4;
        else if (level >= 50) tier = 3;
        else if (level >= 40) tier = 2;
        else if (level >= 20) tier = 1;

        const stats = weapon.Stats?.[tier]?.[level];
        if (!stats) return;

        const baseAtk = Math.trunc(stats[0]?.Value ?? 0);
        const stat = stats[1] ?? null;

        const mappedStat = mapExtraStatToCombat(stat);

        setCombatState(prev => ({
            ...prev,
            weaponLevel: level,
            weaponBaseAtk: baseAtk,
            weaponStat: stat,
            ...mappedStat
        }));
    };

    useEffect(() => {
        const iconPaths = weaponIconPaths ?? filteredWeapons
            .map(w => `/assets/weapon-icons/${w.Id}.webp`)
            .filter(Boolean);

        preloadImages(iconPaths);
    }, [filteredWeapons, weaponIconPaths]);

    const keywords = weaponKeywords ?? (() => {
        const keys = statKeywords.flatMap(key => [
            `${key} DMG Bonus`,
            `${key} Damage Bonus`,
            `${key} DMG`,
            `${key} Damage`,
            key
        ]);
        keys.push('Negative Statuses', 'Negative Status');
        return keys;
    })();

    return (
        <>
            <div className="header-with-icon" style={{ paddingTop: '20px' }}>
                <div
                    className={`weapon-icon-wrapper rarity-${combatState.weaponRarity ?? 1}`}
                    onClick={() => setWeaponMenuOpen(prev => !prev)}
                    ref={weaponTriggerRef}
                >
                    <img
                        style={{backgroundColor: 'unset', filter: 'unset', opacity: 'unset'}}
                        src={activeWeaponIconPath}
                        alt="Weapon"
                        loading="lazy"
                        decoding="async"
                        className="header-icon"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/assets/weapon-icons/default.webp';
                            e.currentTarget.classList.add('fallback-icon');
                        }}
                    />
                </div>

                <div className="character-info-header">
                    <h2>
                        {selectedWeapon && (
                            <span style={{ paddingLeft: '20px',  fontWeight: 'bold', marginTop: '0.5rem' }}>
                                {selectedWeapon.Name}
                            </span>
                        )}
                    </h2>
                </div>

            </div>

            <div className="character-settings">
                <div className="weapon-header-row">
                    <div className="weapon-sliders-column">
                        <div className="weapon-slider">
                            <div className="slider-label-inline">
                                <label style={{ fontWeight: 'bold', marginRight: '8px' }}>Level</label>
                                <input
                                    type="number"
                                    className="character-level-input"
                                    value={weaponLevel}
                                    min="1"
                                    max="90"
                                    onChange={(e) => handleLevelChange(Number(e.target.value))}
                                />
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="90"
                                step="1"
                                value={weaponLevel}
                                onChange={(e) => handleLevelChange(Number(e.target.value))}
                                style={{
                                    '--slider-color': '#777777',
                                    '--slider-fill': `${((weaponLevel - 1) / 89) * 100}%`
                                }}
                            />
                        </div>

                        <div className="weapon-slider">
                            <div className="slider-label-inline">
                                <label style={{ fontWeight: 'bold', marginRight: '8px' }}>Rank</label>
                                <input
                                    type="number"
                                    className="character-level-input"
                                    value={combatState.weaponRank ?? 1}
                                    min="1"
                                    max="5"
                                    onChange={(e) => {
                                        const value = Math.max(1, Math.min(5, Number(e.target.value) || 1));
                                        setCombatState(prev => ({ ...prev, weaponRank: value }));
                                    }}
                                />
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="5"
                                step="1"
                                value={combatState.weaponRank ?? 1}
                                onChange={(e) => {
                                    setCombatState(prev => ({ ...prev, weaponRank: Number(e.target.value) }));
                                }}
                                style={{
                                    '--slider-color': '#777777',
                                    '--slider-fill': `${(((combatState.weaponRank ?? 1) - 1) / 4) * 100}%`
                                }}
                            />
                        </div>
                    </div>

                </div>
            </div>
            <div className="inherent-skills-box">
                <div className="slider-group">
                    <div className="slider-label-with-input" style={{
                        display: 'flex', alignItems: 'center', gap: '8px'
                    }}>
                        <div
                            style={{
                                width: 20,
                                height: 20,
                                backgroundColor: '#999',
                                WebkitMaskImage: `url(${statIconMap['atk']})`,
                                maskImage: `url(${statIconMap['atk']})`,
                                WebkitMaskRepeat: 'no-repeat',
                                maskRepeat: 'no-repeat',
                                WebkitMaskSize: 'contain',
                                maskSize: 'contain'
                            }}
                        />
                        <label style={{ fontWeight: 'bold', fontSize: '16px' }}>ATK:</label>
                        <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
                            {combatState.weaponBaseAtk ?? 0}
                        </span>
                    </div>
                </div>

                {combatState.weaponStat && (
                    <div style={{ fontWeight: 'bold', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                            style={{
                                width: 20,
                                height: 20,
                                backgroundColor: '#999',
                                WebkitMaskImage: `url(${statIconMap[combatState.weaponStat.Name.toLowerCase()] ?? '/assets/icons/default.png'})`,
                                maskImage: `url(${statIconMap[combatState.weaponStat.Name.toLowerCase()] ?? '/assets/icons/default.png'})`,
                                WebkitMaskRepeat: 'no-repeat',
                                maskRepeat: 'no-repeat',
                                WebkitMaskSize: 'contain',
                                maskSize: 'contain'
                            }}
                        />
                        <span>{formatStatValue(combatState.weaponStat)}</span>
                    </div>
                )}
            </div>
            {WeaponUI ? (
                <div className="inherent-skills-box">
                    <h4 className={'highlight'} style={{ marginBottom: '0.5rem' }}>{combatState.weaponEffectName ?? 'Effect'}</h4>
                    <WeaponUI
                        combatState={combatState}
                        setCombatState={setCombatState}
                        activeStates={activeStates}
                        toggleState={toggleState}
                        characterRuntimeStates={characterRuntimeStates}
                        setCharacterRuntimeStates={setCharacterRuntimeStates}
                        currentParamValues={getCurrentParamValues(combatState.weaponParam, combatState.weaponRank)}
                        charId={charId}
                        keywords={keywords}
                    />
                </div>
            ) : (
                combatState.weaponEffect && (
                    <div className="inherent-skills-box">
                        <h4 className={'highlight'} style={{ marginBottom: '0.5rem' }}>{combatState.weaponEffectName ?? 'Effect'}</h4>
                        <p>
                            {highlightKeywordsInText(formatEffectWithParams(
                                combatState.weaponEffect,
                                combatState.weaponParam,
                                combatState.weaponRank ?? 1
                            ), keywords)}
                        </p>
                    </div>
                )
            )}
            <WeaponMenu
                weapons={filteredWeapons}
                handleWeaponSelect={handleWeaponSelect}
                menuOpen={weaponMenuOpen}
                menuRef={weaponMenuRef}
                setMenuOpen={setWeaponMenuOpen}
                selectedRarities={selectedRarities}
                setSelectedRarities={setSelectedRarities}
                preFilteredWeapons={filteredWeapons}
            />
        </>

    );
}

function formatEffectWithParams(effect = '', param = [], rank = 1) {
    const index = Math.max(0, Math.min((rank ?? 1) - 1, 4));
    return effect.replace(/{(\d+)}/g, (_, group) => {
        const groupIndex = parseInt(group, 10);
        return param?.[groupIndex]?.[index] ?? `{${group}}`;
    });
}

export function getCurrentParamValues(param = [], rank = 1) {
    const index = Math.max(0, Math.min((rank ?? 1) - 1, 4));
    return param.map(group => group?.[index] ?? null);
}

export const formatStatValue = (stat) => {
    const name = stat?.Name ?? 'Stat';
    const value = stat?.Value ?? 0;
    const isRatio = stat?.IsRatio;
    const isPercent = stat?.IsPercent;

    let formattedValue = value;

    if (isRatio) {
        formattedValue = `${(value * 100).toFixed(2)}%`;
    } else if (isPercent) {
        formattedValue = `${(value / 100).toFixed(2)}%`;
    } else {
        formattedValue = value.toFixed(2);
    }

    return `${name}: ${formattedValue}`;
};
