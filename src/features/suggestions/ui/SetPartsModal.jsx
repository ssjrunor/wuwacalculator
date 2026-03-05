import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { echoSetList, setIconMap } from '@shared/constants/echoSetData2.js';
import {
    getCompactCharSetPart,
    isCompactCharSetData,
    withCompactCharSetUpdates,
} from '@shared/constants/charSetData.js';
import DropdownSelect from '@shared/ui/common/DropdownSelect.jsx';
import './styles/set-parts-modal.css';

const PIECE_FILTERS = {
    all: 'All Effects',
    two: '2pc Effects',
    three: '3pc Effects',
    five: '5pc Effects',
};

const SORT_OPTIONS = {
    idAsc: 'Set ID (Asc)',
    idDesc: 'Set ID (Desc)',
    nameAsc: 'Set Name (A-Z)',
    nameDesc: 'Set Name (Z-A)',
    partsDesc: 'Most Conditions First',
};

function inferPartType(setMeta, partKey = '') {
    if (partKey === 'twoPiece') return 'two';
    if (partKey === 'threePiece') return 'three';
    if (partKey === 'fivePiece') return 'five';

    if (setMeta?.fivePiece) return 'five';
    if (setMeta?.threePiece) return 'three';
    if (setMeta?.twoPiece) return 'two';
    return 'other';
}

function resolvePartDesc(setMeta, part = {}) {
    if (part.key === 'twoPiece') return part.desc ?? setMeta?.twoPiece ?? '2pc effect';
    if (part.key === 'threePiece') return part.desc ?? setMeta?.threePiece ?? '3pc effect';
    if (part.key === 'fivePiece') return part.desc ?? setMeta?.fivePiece ?? '5pc effect';
    return part.desc ?? part.key;
}

export default function SetPartsModal({
    open,
    onClose,
    charId,
    setCharacterRuntimeStates,
    characterRuntimeStates,
    title = 'Set Effect Parts',
    rerun = null
}) {
    const [isClosing, setIsClosing] = useState(false);
    const [query, setQuery] = useState('');
    const [pieceFilter, setPieceFilter] = useState('all');
    const [sortBy, setSortBy] = useState('idAsc');
    const globalToggleRef = useRef(null);
    const runtimeSetData = characterRuntimeStates?.[charId]?.setData ?? null;
    const activeSelection = isCompactCharSetData(runtimeSetData) ? runtimeSetData : null;
    const canEdit = Boolean(charId) && typeof setCharacterRuntimeStates === 'function' && Boolean(activeSelection);

    const handleClose = useCallback(() => {
        setIsClosing(true);
        setTimeout(() => {
            onClose?.();
            setIsClosing(false);
        }, 300);
    }, [onClose]);

    useEffect(() => {
        if (!open) return undefined;

        const onEsc = (e) => {
            if (e.key === 'Escape') {
                handleClose();
            }
        };

        window.addEventListener('keydown', onEsc);
        return () => window.removeEventListener('keydown', onEsc);
    }, [open, handleClose]);

    useEffect(() => {
        if (open) setIsClosing(false);
    }, [open]);

    const normalizedSets = useMemo(() => {
        return [...echoSetList].map((setMeta) => {
            const parts = (setMeta.parts ?? []).map((part) => {
                const desc = resolvePartDesc(setMeta, part);
                return {
                    ...part,
                    desc,
                    trigger: part.trigger ?? 'Triggered by set effect conditions.',
                    partType: inferPartType(setMeta, part.key),
                };
            });

            return {
                ...setMeta,
                icon: setIconMap?.[setMeta.id],
                parts,
            };
        });
    }, []);

    const filteredSets = useMemo(() => {
        const term = query.trim().toLowerCase();

        const searched = normalizedSets
            .map((setMeta) => {
                const filteredParts = setMeta.parts.filter((part) => {
                    if (pieceFilter !== 'all' && part.partType !== pieceFilter) return false;

                    if (!term) return true;

                    return (
                        setMeta.name.toLowerCase().includes(term) ||
                        String(setMeta.id).includes(term) ||
                        part.key.toLowerCase().includes(term) ||
                        part.desc.toLowerCase().includes(term)
                    );
                });

                return {
                    ...setMeta,
                    visibleParts: filteredParts,
                };
            })
            .filter((setMeta) => setMeta.visibleParts.length > 0);

        const sorted = [...searched];
        sorted.sort((a, b) => {
            if (sortBy === 'idAsc') return a.id - b.id;
            if (sortBy === 'idDesc') return b.id - a.id;
            if (sortBy === 'nameAsc') return a.name.localeCompare(b.name);
            if (sortBy === 'nameDesc') return b.name.localeCompare(a.name);
            if (sortBy === 'partsDesc') return b.visibleParts.length - a.visibleParts.length;
            return 0;
        });

        return sorted;
    }, [normalizedSets, query, pieceFilter, sortBy]);

    const commitSetData = useCallback((nextSetData) => {
        if (!charId || typeof setCharacterRuntimeStates !== 'function' || !isCompactCharSetData(nextSetData)) return;

        setCharacterRuntimeStates((prev) => {
            const prevChar = prev?.[charId] ?? {};
            return {
                ...prev,
                [charId]: {
                    ...prevChar,
                    setData: nextSetData,
                },
            };
        });
    }, [charId, setCharacterRuntimeStates]);

    const getChecked = (setId, partKey) => {
        return getCompactCharSetPart(
            activeSelection,
            setId,
            partKey,
            false
        );
    };

    const visibleStats = useMemo(() => {
        let total = 0;
        let checked = 0;

        for (const setMeta of filteredSets) {
            for (const part of setMeta.visibleParts) {
                total += 1;
                if (getChecked(setMeta.id, part.key)) checked += 1;
            }
        }

        return {
            total,
            checked,
            allChecked: total > 0 && checked === total,
            someChecked: checked > 0 && checked < total,
        };
    }, [filteredSets, activeSelection]);

    useEffect(() => {
        if (!globalToggleRef.current) return;
        globalToggleRef.current.indeterminate = visibleStats.someChecked;
    }, [visibleStats.someChecked]);

    function useDebouncedCallback(fn, delayMs) {
        const fnRef = useRef(fn);

        useEffect(() => {
            fnRef.current = fn;
        }, [fn]);

        const timerRef = useRef(null);

        const debounced = useCallback(
            (...args) => {
                if (typeof fnRef.current !== "function") {
                    if (timerRef.current) {
                        clearTimeout(timerRef.current);
                        timerRef.current = null;
                    }
                    return;
                }
                if (timerRef.current) clearTimeout(timerRef.current);
                timerRef.current = setTimeout(() => {
                    timerRef.current = null;
                    const f = fnRef.current;
                    if (typeof f === "function") f(...args);
                }, delayMs);
            },
            [delayMs]
        );

        const cancel = useCallback(() => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        }, []);

        useEffect(() => cancel, [cancel]);

        return [debounced, cancel];
    }

    const [rerunDebounced] = useDebouncedCallback(rerun, 500);

    const togglePart = (setId, partKey, checked) => {
        if (!activeSelection) return;
        const next = withCompactCharSetUpdates(activeSelection, [{ setId, partKey, checked }]);
        commitSetData(next);
        rerunDebounced();
    };

    const applyVisible = (checked) => {
        if (!activeSelection) return;
        const updates = [];
        for (const setMeta of filteredSets) {
            for (const part of setMeta.visibleParts) {
                updates.push({ setId: setMeta.id, partKey: part.key, checked });
            }
        }
        const next = withCompactCharSetUpdates(activeSelection, updates);
        commitSetData(next);
        rerunDebounced();
    };

    if (!open && !isClosing) return null;

    return (
        <div
            className={`skills-modal-overlay ${isClosing ? 'closing' : ''}`}
            onClick={handleClose}
        >
            <div
                className={`skills-modal-content changelog-modal guides set-parts-modal ${isClosing ? 'closing' : ''}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="set-parts-modal-header">
                    <div>
                        <h2 className="section-title" style={{ margin: 0 }}>{title}</h2>
                        <p className="set-parts-subtitle">
                            Toggle each set effect part that should be considered during optimization.
                        </p>
                    </div>
                    <span className="echo-buff set-parts-count-pill">
                        {filteredSets.length} sets
                    </span>
                </div>

                <div className="set-parts-controls buffs-box">
                    <input
                        type="text"
                        className="character-level-input set-parts-search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search set, part key, or description..."
                    />

                    <DropdownSelect
                        width="100%"
                        className="set-parts-select"
                        options={Object.entries(PIECE_FILTERS).map(([value, label]) => ({
                            value,
                            label,
                        }))}
                        value={pieceFilter}
                        onChange={setPieceFilter}
                    />

                    <DropdownSelect
                        width="100%"
                        className="set-parts-select"
                        options={Object.entries(SORT_OPTIONS).map(([value, label]) => ({
                            value,
                            label,
                        }))}
                        value={sortBy}
                        onChange={setSortBy}
                    />
                </div>

                <div className="set-parts-list echo-buff">
                    <div className="set-parts-columns-header">
                        <span className="set-parts-columns-left">
                            <label className="modern-checkbox set-parts-global-toggle">
                                <input
                                    ref={globalToggleRef}
                                    type="checkbox"
                                    checked={visibleStats.allChecked}
                                    disabled={visibleStats.total === 0 || !canEdit}
                                    onChange={(e) => applyVisible(e.target.checked)}
                                />
                            </label>
                            <span>Set</span>
                        </span>
                        <span>Conditions</span>
                    </div>

                    {filteredSets.length === 0 && (
                        <p className="set-parts-empty">No sets match the current filters.</p>
                    )}

                    {filteredSets.map((setMeta) => (
                        <div key={setMeta.id} className="set-parts-row buffs-box">
                            <div className="set-parts-set-column">
                                <div className="set-parts-set-header">
                                    {setMeta.icon && (
                                        <img
                                            src={setMeta.icon}
                                            alt={setMeta.name}
                                            className="set-parts-icon"
                                        />
                                    )}
                                    <div>
                                        <div className="set-parts-name">{setMeta.name}</div>
                                        <div className="set-parts-meta">Set #{setMeta.id}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="set-parts-part-column">
                                {setMeta.visibleParts.map((part) => (
                                    <label
                                        key={`${setMeta.id}-${part.key}`}
                                        className="modern-checkbox set-parts-part-row"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={getChecked(setMeta.id, part.key)}
                                            disabled={!canEdit}
                                            onChange={(e) =>
                                                togglePart(setMeta.id, part.key, e.target.checked)
                                            }
                                        />

                                        <div className="set-parts-part-text">
                                            <div className="set-parts-part-desc">{part.desc}</div>
                                            <div className="set-parts-part-trigger">{part.trigger}</div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="modal-footer set-parts-footer">
                    <button className="edit-substat-button btn-primary echoes" onClick={handleClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
