import React, { useEffect, useMemo, useState } from 'react';
import { attributeColors } from '@shared/utils/attributeHelpers.js';
import EnemyMenu from './EnemyMenu.jsx';

const defaultEnemyResLocal = () => ({
    0: 20,
    1: 60,
    2: 20,
    3: 20,
    4: 20,
    5: 20,
    6: 20
});

const elementLabels = ['Physical', 'Glacio', 'Fusion', 'Electro', 'Aero', 'Spectro', 'Havoc'];

const elementKeys = ['physical', 'glacio', 'fusion', 'electro', 'aero', 'spectro', 'havoc'];

const enemyClassMap = { 1: "Common", 2: "Elite", 3: "Overlord", 4: "Calamity" }

const applyToaResMap = (resMap = {}) => {
    const updatedRes = {};
    Object.keys(resMap).forEach(key => {
        const numericVal = Number(resMap[key]);
        const isNumeric = Number.isFinite(numericVal);
        if (isNumeric && numericVal === 10) updatedRes[key] = 20;
        else if (isNumeric && numericVal === 40) updatedRes[key] = 60;
        else updatedRes[key] = isNumeric ? numericVal : resMap[key];
    });
    return updatedRes;
};

const normalizeEnemyRes = (enemy, fallbackRes = {}) => {
    const res = enemy?.baseData?.res ?? fallbackRes ?? {};
    const normalizedRes = { ...defaultEnemyResLocal() };
    for (let i = 0; i <= 6; i++) {
        if (typeof res?.[i] === 'number') normalizedRes[i] = res[i];
        else if (typeof res?.[String(i)] === 'number') normalizedRes[i] = res[String(i)];
    }
    return normalizedRes;
};

const buildResForProfile = (enemy, currentRes, toaActive) => {
    const baseRes = normalizeEnemyRes(enemy, currentRes);
    return toaActive ? applyToaResMap(baseRes) : baseRes;
};

const getResValue = (enemy, elementId) => {
    const res = enemy?.baseData?.res ?? {};
    if (typeof res?.[elementId] === 'number') return res[elementId];
    if (typeof res?.[String(elementId)] === 'number') return res[String(elementId)];
    return null;
};

export default function EnemyPane({
    enemyProfile,
    setEnemyProfile,
    enemy,
    enemies,
    allEnemies: allEnemiesProp,
    enemyMap: enemyMapProp,
    customEnemies = [],
    setCustomEnemies,
    combatState,
    setCombatState,
    menuRef
}) {
    const [menuOpen, setMenuOpen] = useState(false);

    const enemyLevel = Math.min(Math.max(Number(enemyProfile?.level ?? 90), 1), 120);
    const tuneStrain = enemyProfile?.status?.tuneStrain ?? 0;
    const enemyId = String(enemyProfile?.id ?? '');

    const mergedEnemies = useMemo(() => [...enemies, ...(customEnemies ?? [])], [enemies, customEnemies]);
    const allEnemies = allEnemiesProp ?? mergedEnemies;

    const enemyMap = useMemo(() => {
        if (enemyMapProp) return enemyMapProp;
        const map = {};
        allEnemies.forEach(e => {
            const key = String(e?.Id ?? e?.id ?? e?.monsterId ?? '');
            if (key) map[key] = e;
        });
        return map;
    }, [enemyMapProp, allEnemies]);

    const resolvedEnemy = enemy ?? enemyMap[enemyId] ?? null;
    const enemyIcon = resolvedEnemy?.Icon ?? '/assets/weapon-icons/default.webp';

    useEffect(() => {
        if (!resolvedEnemy || resolvedEnemy?.Class == null) return;
        setEnemyProfile(prev => {
            const prevProfile = prev ?? {};
            if (prevProfile.class === resolvedEnemy.Class) return prevProfile;
            return {
                ...prevProfile,
                class: resolvedEnemy.Class
            };
        });
    }, [resolvedEnemy?.Class, resolvedEnemy?.Id, setEnemyProfile]);

    const handleLevelChange = (val) => {
        const clamped = Math.min(120, Math.max(1, Number(val)));
        setEnemyProfile(prev => ({
            ...(prev ?? {}),
            level: clamped
        }));
    };

    const handleEnemySelect = (id) => {
        const nextId = String(id);
        const selected = enemyMap[nextId];
        setEnemyProfile(prev => {
            const prevProfile = prev ?? {};
            const resToStore = buildResForProfile(selected, prevProfile.res, prevProfile.toa);
            return {
                ...prevProfile,
                id: nextId,
                level: prevProfile?.level ?? 100,
                res: resToStore,
                class: selected?.Class ?? prevProfile?.class ?? 4,
                toa: prevProfile?.toa ?? true,
                status: prevProfile?.status ?? { tuneStrain: 0 }
            };
        });
        setMenuOpen(false);
    };

    const handleToaToggle = (isToa) => {
        setEnemyProfile(prev => {
            const prevProfile = prev ?? {};
            const nextRes = buildResForProfile(resolvedEnemy, prevProfile.res, isToa);
            let level = isToa ? 100 : 90;
            return {
                ...prevProfile,
                toa: isToa,
                res: nextRes,
                level,
                status: prevProfile?.status
            };
        });
    };

    const handleTuneStrainChange = (val) => {
        const clamped = Math.min(10, Math.max(0, Number(val)));
        setEnemyProfile(prev => {
            const prevProfile = prev ?? {};
            const prevStatus = prevProfile.status ?? {};
            if ((prevStatus.tuneStrain ?? 0) === clamped) return prevProfile;
            return {
                ...prevProfile,
                status: {
                    ...prevStatus,
                    tuneStrain: clamped
                }
            };
        });
    };

    const handleDebuffChange = (key, val, max = 60) => {
        const clamped = Math.min(max, Math.max(0, Number(val)));
        setCombatState(prev => ({ ...prev, [key]: clamped }));
    };

    const resEntries = elementLabels.map((label, idx) => {
        const val =
            getResValue({ baseData: { res: enemyProfile?.res } }, idx) ??
            getResValue(resolvedEnemy, idx);
        if (val == null) return null;
        const attrKey = elementKeys[idx] ?? 'all';
        return {
            label,
            value: val,
            color: attributeColors[attrKey] ?? '#777',
            icon: `/assets/attributes/attributes alt/${attrKey}.webp`,
            isPhysical: attrKey === 'physical',
            id: idx
        };
    }).filter(Boolean);

    const handleCustomResChange = (elementId, val) => {
        const clamped = Math.min(100, Math.max(0, Number(val)));
        const nextProfile = {
            ...(enemyProfile ?? {}),
            res: {
                ...(enemyProfile?.res ?? {}),
                [elementId]: clamped
            }
        };
        setEnemyProfile(nextProfile);
        setCustomEnemies(prev => {
            const currentId = String(enemyProfile?.id ?? '000000000');
            const next = (prev ?? []).map(e => {
                const id = String(e?.Id ?? e?.id ?? e?.monsterId ?? '');
                if (id === currentId) {
                    return {
                        ...e,
                        baseData: {
                            ...(e?.baseData ?? {}),
                            res: {
                                ...(e?.baseData?.res ?? {}),
                                [elementId]: clamped
                            }
                        }
                    };
                }
                return e;
            });
            return next.length ? next : prev;
        });
    };

    return (
        <div className="character-settings enemy-pane">
            <div className="echo-buff" style={{ position: 'relative' }}>
                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                    {!resolvedEnemy?.custom ? (
                        <span
                            className="toggle-effect-button"
                            onClick={() => {
                                const customExisting = allEnemies.find(e => e?.custom);
                                if (customExisting) {
                                    const existingId = String(customExisting?.Id ?? customExisting?.id ?? customExisting?.monsterId ?? '000000000');
                                    handleEnemySelect(existingId);
                                    return;
                                }
                                const baseRes = buildResForProfile(resolvedEnemy, enemyProfile?.res, enemyProfile?.toa);
                                const newId = '000000000';
                                const customEnemy = {
                                    Id: newId,
                                    Name: 'Custom Enemy',
                                    Class: resolvedEnemy?.Class ?? 1,
                                    Element: 0,
                                    ElementArray: [0],
                                    Icon: `/assets/enemies/${newId}.webp`,
                                    baseData: { res: baseRes },
                                    Stats: resolvedEnemy?.Stats ?? {},
                                    custom: true
                                };
                                setCustomEnemies([customEnemy]);
                                setEnemyProfile(prev => ({
                                    ...(prev ?? {}),
                                    id: newId,
                                    res: baseRes,
                                    toa: prev?.toa ?? true,
                                    level: prev?.level ?? 100,
                                    status: prev?.status ?? { tuneStrain: 0 },
                                    class: customEnemy.Class
                                }));
                            }}
                        >EDIT</span>
                    ) : (<span></span>)}
                    {!resolvedEnemy?.custom ? (<span></span>) : (
                        <span
                className="toggle-effect-button delete"
                onClick={() => {
                    if (!resolvedEnemy?.custom) return;
                    const currentId = String(resolvedEnemy?.Id ?? resolvedEnemy?.id ?? resolvedEnemy?.monsterId ?? '');
                    setCustomEnemies(prev => prev.filter(e => String(e?.Id ?? e?.id ?? e?.monsterId ?? '') !== currentId));
                    const fallbackId = '340000240';
                    const fallbackEnemy = enemyMap[fallbackId];
                    const baseRes = buildResForProfile(fallbackEnemy, fallbackEnemy?.baseData?.res ?? defaultEnemyResLocal(), enemyProfile?.toa);
                    setEnemyProfile(prev => ({
                        ...(prev ?? {}),
                        id: fallbackId,
                        toa: prev?.toa ?? false,
                        res: baseRes,
                                    status: prev?.status ?? { tuneStrain: 0 },
                                    class: fallbackEnemy?.Class ?? prev?.class ?? 1
                                }));
                            }}
                        >DELETE</span>)}
                </div>

                <div className="header-with-icon" style={{ gap: '1rem', margin: '1rem', marginTop: 'unset'}}>
                    <div
                        className={`weapon-icon-wrapper rarity-${resolvedEnemy?.Rarity ?? 1}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setMenuOpen(prev => !prev)}
                        ref={menuRef}
                >
                    <img
                        src={enemyIcon}
                        style={{ filter: enemyId === '000000000' ? 'grayscale(1) brightness(0.6)' : 'unset'}}
                        alt={resolvedEnemy?.Name ?? 'Enemy'}
                        className="header-icon"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/assets/enemies/default.webp';
                            }}
                        />
                    </div>
                    <div
                        style={{ display: 'flex', width: '100%', height: '100%', flexDirection: 'column', gap: '0.5rem',
                        fontWeight: 'bold', fontSize: '1.25rem',}}>
                        <span>{resolvedEnemy?.Name ?? 'Select an enemy'} - {enemyClassMap[resolvedEnemy?.Class] ?? ''}</span>
                        {resolvedEnemy?.custom && (
                            <div className="slider-group" style={{ display: 'flex', flexDirection: 'row', margin: 'unset', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {[1,2,3,4].map(cls => (
                                    <label key={cls} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                                        <input
                                            type="radio"
                                            name="custom-class"
                                            value={cls}
                                            checked={resolvedEnemy?.Class === cls}
                                            onChange={() => {
                                                setEnemyProfile(prev => ({ ...(prev ?? {}), class: cls }));
                                                setCustomEnemies(prev => prev.map(e => {
                                                    const id = String(e?.Id ?? e?.id ?? e?.monsterId ?? '');
                                                    if (id !== '000000000') return e;
                                                    return { ...e, Class: cls };
                                                }));
                                            }}
                                        />
                                        <span>{enemyClassMap[cls]}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                        <div className="slider-group" style={{ marginBottom: 'unset' }}>
                            <div className="slider-label-with-input">
                                <label htmlFor="enemy-level">Enemy Level</label>
                                <input
                                    id="enemy-level"
                                    type="number"
                                    min="1"
                                    max="120"
                                    className="character-level-input"
                                    value={enemyLevel}
                                    onChange={(e) => handleLevelChange(e.target.value)}
                                />
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="120"
                                value={enemyLevel}
                                onChange={(e) => handleLevelChange(e.target.value)}
                                style={{
                                    '--slider-color': '#777777',
                                    '--slider-fill': `${((enemyLevel - 1) / 119) * 100}%`
                                }}
                            />
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                    <strong>Resistances</strong>
                    <div className="buff-grid"
                         style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: '0.5rem', padding: 'unset' }}>
                        {resEntries.length === 0 && (
                            <div style={{ opacity: 0.6 }}>No resistance data for this enemy.</div>
                        )}
                        {resEntries.map(entry => (
                            <div
                                key={entry.label}
                                className="echo-buff res-pill"
                                style={{ padding: '0.25rem 0.5rem', borderRadius: '8px', alignItems: 'center' }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.125rem' }}>
                                    <img
                                        src={entry.icon}
                                        alt={entry.label}
                                        style={{ width: '1rem', height: '1rem', filter: entry.isPhysical ? 'grayscale(1) brightness(0.6)' : undefined }}
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = '/assets/attributes/attributes alt/physical.webp';
                                        }}
                                    />
                                    <span style={{ color: entry.color, fontWeight: 600, fontSize: '0.9rem' }}>{entry.label}</span>
                                </div>
                                {resolvedEnemy?.custom ? (
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={entry.value}
                                        onChange={(e) => handleCustomResChange(entry.id, e.target.value)}
                                        className="character-level-input"
                                        style={{ width: '85%', margin: 'unset' }}
                                    />
                                ) : (
                                    <span style={{ fontWeight: 700, justifySelf: 'right' }}>{entry.value}%</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="toggle custom-select small mode-switch"
                style={{ borderRadius: '10px' }}>
                    <div
                        className={`optimizer-toggle ${enemyProfile.toa ? 'active btn-primary' : ''}`}
                        onClick={() => handleToaToggle(true)}
                    >
                        Endgame</div>
                    <div
                        className={`optimizer-toggle ${!enemyProfile.toa ? 'active btn-primary' : ''}`}
                        onClick={() => handleToaToggle(false)}
                    >
                        Overworld</div>
                </div>
            </div>

            <div className="echo-buff">
                <h3 className="enemy-subtitle">Tunability</h3>
                <div className="slider-group">
                    <div className="slider-label-with-input">
                        <label htmlFor="enemy-level">Tune Strain - Interfered</label>
                        <input
                            id="tune-strain-interfered"
                            type="number"
                            min="0"
                            max="10"
                            className="character-level-input"
                            value={tuneStrain}
                            onChange={(e) => handleTuneStrainChange(e.target.value)}
                        />
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="10"
                        value={tuneStrain}
                        onChange={(e) => handleTuneStrainChange(e.target.value)}
                        style={{
                            '--slider-color': '#d3d3d3',
                            '--slider-fill': `${(tuneStrain / 10) * 100}%`
                        }}
                    />
                </div>
            </div>

            <div className="echo-buff">
                <h3 className="enemy-subtitle">Negative Effects</h3>
                <div className="slider-group">
                    <div className="slider-label-with-input">
                        <label htmlFor="spectro-frazzle">Spectro Frazzle</label>
                        <input
                            id="spectro-frazzle"
                            type="number"
                            min="0"
                            max="60"
                            className="character-level-input"
                            value={combatState.spectroFrazzle ?? 0}
                            onChange={(e) => handleDebuffChange('spectroFrazzle', e.target.value)}
                        />
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="60"
                        value={combatState.spectroFrazzle ?? 0}
                        onChange={(e) => handleDebuffChange('spectroFrazzle', e.target.value)}
                        style={{
                            '--slider-color': 'rgb(202,179,63)',
                            '--slider-fill': `${((combatState.spectroFrazzle ?? 0) / 60) * 100}%`
                        }}
                    />
                </div>

                <div className="slider-group">
                    <div className="slider-label-with-input">
                        <label htmlFor="aero-erosion">Aero Erosion</label>
                        <input
                            id="aero-erosion"
                            type="number"
                            min="0"
                            max="6"
                            className="character-level-input"
                            value={combatState.aeroErosion ?? 0}
                            onChange={(e) => handleDebuffChange('aeroErosion', e.target.value)}
                        />
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="12"
                        value={combatState.aeroErosion ?? 0}
                        onChange={(e) => handleDebuffChange('aeroErosion', e.target.value)}
                        style={{
                            '--slider-color': 'rgb(15,205,160)',
                            '--slider-fill': `${((combatState.aeroErosion ?? 0) / 12) * 100}%`
                        }}
                    />
                </div>

                <div className="slider-group">
                    <div className="slider-label-with-input">
                        <label htmlFor="havoc-bane">Havoc Bane</label>
                        <input
                            id="havoc-bane"
                            type="number"
                            min="0"
                            max="6"
                            className="character-level-input"
                            value={combatState.havocBane ?? 0}
                            onChange={(e) => handleDebuffChange('havocBane', e.target.value)}
                        />
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="6"
                        value={combatState.havocBane ?? 0}
                        onChange={(e) => handleDebuffChange('havocBane', e.target.value)}
                        style={{
                            '--slider-color': 'rgb(172,9,96)',
                            '--slider-fill': `${((combatState.havocBane ?? 0) / 6) * 100}%`
                        }}
                    />
                </div>

                <div className="slider-group">
                    <div className="slider-label-with-input">
                        <label htmlFor="electro-flare">Electro Flare</label>
                        <input
                            id="electro-flare"
                            type="number"
                            min="0"
                            max="13"
                            className="character-level-input"
                            value={combatState.electroFlare ?? 0}
                            onChange={(e) => handleDebuffChange('electroFlare', e.target.value)}
                        />
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="13"
                        value={combatState.electroFlare ?? 0}
                        onChange={(e) => handleDebuffChange('electroFlare', e.target.value)}
                        style={{
                            '--slider-color': 'rgb(167,13,209)',
                            '--slider-fill': `${((combatState.electroFlare ?? 0) / 13) * 100}%`
                        }}
                    />
                </div>
            </div>
            <EnemyMenu
                enemies={allEnemies}
                menuOpen={menuOpen}
                setMenuOpen={setMenuOpen}
                selectedEnemyId={enemyId}
                handleEnemySelect={handleEnemySelect}
                menuRef={menuRef}
            />
        </div>
    );
}
