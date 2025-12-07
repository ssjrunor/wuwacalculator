import React, { useEffect, useState } from 'react';
import { setIconMap } from '../../constants/echoSetData2.js';
import {getSubstatStepOptions, snapToNearestSubstatValue, validSubstatRanges} from "../../utils/echoHelper.js";

const ALL_SUBSTAT_KEYS = [
    'atkPercent', 'atkFlat', 'hpPercent', 'hpFlat',
    'defPercent', 'defFlat', 'critRate', 'critDmg',
    'energyRegen', 'basicAtk', 'heavyAtk', 'resonanceSkill', 'resonanceLiberation'
];


export function getSubstatRange(key) {
    return validSubstatRanges[key] ?? null;
}

export function getSubstatStep(key) {
    const range = getSubstatRange(key);
    if (!range) return 0.1;

    const rawStep = (range.max - range.min) / range.divisions;

    if (!key.endsWith('Flat')) {
        return Math.round(rawStep * 10) / 10;
    }
    return rawStep;
}

const formatStatKey = (key) => {
    const labelMap = {
        atkPercent: 'ATK%', atkFlat: 'ATK',
        hpPercent: 'HP%', hpFlat: 'HP',
        defPercent: 'DEF%', defFlat: 'DEF',
        critRate: 'Crit Rate', critDmg: 'Crit DMG',
        energyRegen: 'Energy Regen', basicAtk: 'Basic Attack DMG Bonus',
        heavyAtk: 'Heavy Attack DMG Bonus', resonanceSkill: 'Resonance Skill DMG Bonus',
        resonanceLiberation: 'Resonance Liberation DMG Bonus', healingBonus: 'Healing Bonus',
        aero: 'Aero DMG Bonus', spectro: 'Spectro DMG Bonus', fusion: 'Fusion DMG Bonus',
        glacio: 'Glacio DMG Bonus', havoc: 'Havoc DMG Bonus', electro: 'Electro DMG Bonus'
    };
    return labelMap[key] ?? key;
};

export default function EditSubstatsModal({
                                              isOpen,
                                              echo = {},
                                              substats = {},
                                              onClose,
                                              onSave,
                                              getValidMainStats = () => ({}),
                                              mainStats,
                                              selectedSet: selectedSetProp,
                                          }) {
    if (!isOpen || !echo || !echo.icon) return null;
    const [localSubstats, setLocalSubstats] = useState(Object.entries(substats));
    const [mainStat, setMainStat] = useState(Object.keys(mainStats)[0] || null);
    const [selectedSet, setSelectedSet] = useState(selectedSetProp ?? echo.sets?.[0] ?? null);
    const handleTypeChange = (index, newType) => {
        const isDuplicate = localSubstats.some(([key], i) =>
            key === newType && i !== index
        ) && newType !== mainStat;

        if (isDuplicate) return;

        const updated = [...localSubstats];
        updated[index][0] = newType;
        setLocalSubstats(updated);
    };

    const [isVisible, setIsVisible] = useState(false);
    const [isAnimatingOut, setIsAnimatingOut] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            setIsAnimatingOut(false);
        } else if (isVisible) {
            setIsAnimatingOut(true);
            setTimeout(() => {
                setIsVisible(false);
                setIsAnimatingOut(false);
            }, 300);
        }
    }, [isOpen]);

    const handleValueChange = (index, newValue) => {
        const [key] = localSubstats[index];
        const parsed = parseFloat(newValue);
        if (isNaN(parsed)) return;

        const validValues = getSubstatStepOptions(key);
        if (!validValues.length) return;

        const min = Math.min(...validValues);
        const max = Math.max(...validValues);
        const clamped = Math.max(min, Math.min(max, parsed));

        let snapped = snapToNearestSubstatValue(key, clamped);

        if (key.includes('%')) {
            snapped = parseFloat(snapped.toFixed(1));
        }

        const updated = [...localSubstats];
        updated[index][1] = snapped;
        setLocalSubstats(updated);
    };

    const handleAdd = () => {
        if (localSubstats.length < 5) {
            const defaultKey = 'atkPercent';
            const options = getSubstatStepOptions(defaultKey);
            const defaultValue = options.length > 0 ? options[0] : 0;
            setLocalSubstats([...localSubstats, [defaultKey, defaultValue]]);
        }
    };

    const handleRemove = (index) => {
        const updated = [...localSubstats];
        updated.splice(index, 1);
        setLocalSubstats(updated);
    };

    const handleSave = () => {
        if (!mainStat) return;

        const filteredSubstats = localSubstats;

        const mainStatsObject = {
            [mainStat]: getValidMainStats(echo.cost)[mainStat],
            ...(echo.cost === 1 ? { hpFlat: 2280 } :
                echo.cost === 3 ? { atkFlat: 100 } :
                    echo.cost === 4 ? { atkFlat: 150 } : {})
        };

        const validatedSubstats = filteredSubstats.map(([key, value]) => {
            const snapped = snapToNearestSubstatValue(key, value);
            return [key, snapped];
        });
        const subStatsObject = Object.fromEntries(validatedSubstats);

        onSave({
            ...echo,
            mainStats: mainStatsObject,
            subStats: subStatsObject,
            selectedSet,
        });

        onClose();
    };

    useEffect(() => {
        if (!echo || !echo.mainStats) return;

        setLocalSubstats(Object.entries(substats ?? {}));
        const mainStatKey = Object.keys(echo.mainStats ?? mainStats ?? {})[0] ?? null;
        setMainStat(mainStatKey);
        setSelectedSet(echo.selectedSet ?? echo.originalSets?.[0] ?? null);
    }, [substats, echo]);


    if (!isVisible || !echo || !echo.icon) return null;

    return (
        <div
            className={`menu-overlay ${isOpen ? 'show' : ''} ${isAnimatingOut ? 'hiding' : ''}`}
            onClick={() => {
                setIsAnimatingOut(true);
                setTimeout(() => {
                    setIsAnimatingOut(false);
                    onClose();
                }, 300);
            }}
        >
            <div
                className={`edit-substats-modal ${isOpen ? 'show' : ''} ${isAnimatingOut ? 'hiding' : ''}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <img src={echo.icon} className="modal-echo-icon" alt="" loading="lazy" />
                    <div>
                        <div className="modal-echo-name highlight">{echo.name}</div>
                        <div className="echo-slot-cost-badge">Cost {echo.cost}</div>
                        <div className="set-icon-toggle-group">
                            {echo.originalSets?.map(setId => (
                                <img
                                    key={setId}
                                    src={setIconMap[setId]}
                                    alt={`Set ${setId}`}
                                    className={`set-icon-toggle ${selectedSet === setId ? 'selected' : ''}`}
                                    onClick={() => setSelectedSet(setId)}
                                    loading="lazy"
                                />
                            ))}
                        </div>
                    </div>
                    <div className="main-stat-box">
                        <label htmlFor="main-stat-select" className="main-stat-label">Main Stat:</label>
                        <select
                            id="main-stat-select"
                            className="main-stat-select"
                            value={mainStat || ''}
                            onChange={(e) => setMainStat(e.target.value)}
                        >
                            <option value="" disabled>Select Main Stat</option>
                            {Object.keys(getValidMainStats(echo.cost)).map((key) => (
                                <option key={key} value={key}>
                                    {formatStatKey(key)}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="modal-body">
                    {localSubstats.map(([type, value], index) => (
                        <div className="substat-row" key={index}>
                            <button
                                className="remove-substat-button"
                                onClick={() => handleRemove(index)}
                                title="Remove substat"
                            >
                                −
                            </button>
                            <div className="substat-edit-row">
                                <div className="toggle-group">
                                    {ALL_SUBSTAT_KEYS.map(statKey => {
                                        const isSelectedElsewhere = localSubstats.some(([key], i) =>
                                            key === statKey && i !== index
                                        );
                                        return (
                                            <div
                                                key={statKey}
                                                className={`stat-toggle ${statKey === type ? 'active' : ''} ${isSelectedElsewhere ? 'disabled' : ''}`}
                                                onClick={() => !isSelectedElsewhere && handleTypeChange(index, statKey)}
                                            >
                                                {formatStatKey(statKey)}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <input
                                className="substat-input"
                                type="number"
                                step={ type === 'hpFlat' ? 10 : getSubstatStep(type)}
                                min={Math.min(...getSubstatStepOptions(type))}
                                max={Math.max(...getSubstatStepOptions(type))}
                                value={value}
                                onChange={(e) => {
                                    const updated = [...localSubstats];
                                    updated[index][1] = parseFloat(e.target.value) || 0;
                                    setLocalSubstats(updated);
                                }}
                                onBlur={(e) => handleValueChange(index, e.target.value)}
                            />
                        </div>
                    ))}

                    {localSubstats.length < 5 && (
                        <button className="add-substat" onClick={handleAdd}>+ Add Substat</button>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="edit-substat-button" onClick={() => {
                        setIsAnimatingOut(true);
                        setTimeout(() => {
                            setIsAnimatingOut(false);
                            onClose();
                        }, 300);
                    }}
                    >Cancel
                    </button>
                    <button
                        className="edit-substat-button"
                        onClick={handleSave}
                        disabled={!mainStat}
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}