import {deleteEchoPreset, updateEchoPreset} from "@/state/echoPresetStore.js";
import {X} from "lucide-react";
import { setIconMap } from "@/constants/echoSetData2.js";
import {imageCache} from "@/pages/Calculator.jsx";
import {getEchoScores, getTop5SubstatScoreDetails} from "@/utils/echoHelper.js";
import {getEquippedEchoesScoreDetails} from "@/features/echoes/ui/EchoesPane.jsx";
import React, {useEffect, useRef, useState} from "react";
import {EchoGridPreview} from "@/features/overview/ui/OverviewDetailPane.jsx";

export function PresetsView({
                         onEquipPreset,
                         setEditingPreset,
                         filteredPresets,
                         characters,
                         setViewingPreset,
                         setShowPresetModal,
                         setEditedPresetName, editedPresetName, editingPresetId, setEditingPresetId
                     }) {
    return (
        <div className="modal-body echo-grid presets">
            {filteredPresets.length === 0 ? (
                <h4 className="empty-message" style={{ fontStyle: 'italic', opacity: '0.6' }}>Empty...</h4>
            ) : (
                filteredPresets.map(preset => (
                    <PresetTile
                        key={preset.id}
                        preset={preset}
                        onEquipPreset={onEquipPreset}
                        setEditingPreset={setEditingPreset}
                        characters={characters}
                        setViewingPreset={setViewingPreset}
                        setShowPresetModal={setShowPresetModal}
                        setEditedPresetName={setEditedPresetName}
                        setEditingPresetId={setEditingPresetId}
                        editingPresetId={editingPresetId}
                        editedPresetName={editedPresetName}
                    />
                ))
            )}
        </div>
    );
}

function PresetTile({ preset, characters, setViewingPreset, setShowPresetModal }) {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
            }}
        >
            <div style={{ display: 'flex', flexDirection: 'row' }}>
                <h5 className="preset-name">{preset.name}</h5>
                <span className="preset-date overview-weapon-details"
                      style={{ marginLeft: 'auto', fontStyle: 'italic' }}>
                    {new Date(preset.createdAt).toLocaleDateString()}
                </span>
            </div>
            <div className="preset-tile dropdown-item"
                 onClick={() => {
                     setViewingPreset(preset);
                     setShowPresetModal(true);
                 }}
            >
                <div className="preset-echo-grid">
                    {preset.echoes.map((echo, i) =>
                        echo ? (
                            <div key={i} className="preset-echo-slot">
                                {echo.selectedSet && (
                                    <img
                                        src={setIconMap[echo.selectedSet]}
                                        alt={`Set ${echo.selectedSet}`}
                                        className="echo-set-icon-bag"
                                    />
                                )}
                                <img
                                    loading="lazy"
                                    src={imageCache?.[echo.icon]?.src || echo.icon}
                                    alt={echo.name}
                                    title={echo.name}
                                    className="echo-slot-icon"
                                    onError={(e) => {
                                        e.currentTarget.onerror = null;
                                        e.currentTarget.src = '/assets/echoes/default.webp';
                                        e.currentTarget.classList.add('fallback-icon');
                                    }}
                                />
                            </div>
                        ) : (
                            <div key={i} className="team-icon empty-slot overview" />
                        )
                    )}
                </div>
                <button
                    className="remove-teammate-button"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        deleteEchoPreset(preset.id);
                    }}
                >
                    <X size={20} strokeWidth={2.5} />
                </button>
                {preset.equipped?.length > 0 && (
                    <div className="preset-equipped">
                        {preset.equipped.map((charId) => {
                            const character = characters.find(c => String(c.link) === String(charId));
                            return (
                                <img
                                    key={charId}
                                    src={character.icon}
                                    alt={charId}
                                    className={`header-icon overview preset ${character.raw.Rarity === 5 ? 'five' : 'four'}`}
                                    style={{
                                        pointerEvents: 'none'
                                    }}
                                    loading="lazy"
                                />
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export function EchoPresetPreview({ open, onClose, preset, charId, getImageSrc, characterRuntimeStates, onEquipPreset,
                                      setEditingPresetId, setEditedPresetName, editingPresetId, editedPresetName, characters }) {
    if (!open) return null;

    const activeId = preset?.charId ?? charId;
    const echoes = preset?.echoes ?? [null, null, null, null, null];
    const runtimes =
        {
            ...characterRuntimeStates,
            [activeId]:
                {
                    ...characterRuntimeStates[activeId],
                    equippedEchoes: echoes
                }
        };

    const maxScore = getTop5SubstatScoreDetails(activeId).total;
    const buildScore = getEquippedEchoesScoreDetails(activeId, runtimes);
    const maxScoreCur = getTop5SubstatScoreDetails(charId).total;
    const buildScoreCur = getEquippedEchoesScoreDetails(charId,
        { [charId]: { ...characterRuntimeStates[charId], equippedEchoes: echoes } });

    const maxBuildScore = maxScore * 5;
    const percentScore = (buildScore.total / maxBuildScore) * 100;
    const maxBuildScoreCur = maxScoreCur * 5;
    const percentScoreCur = (buildScoreCur.total / maxBuildScoreCur) * 100;

    const [isClosing, setIsClosing] = useState(false);
    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsClosing(false);
            onClose?.();
        }, 300);
    };

    const inputRef = useRef(null);

    useEffect(() => {
        if (editingPresetId !== preset.id) return;

        function handleClickOutside(e) {
            if (inputRef.current && !inputRef.current.contains(e.target)) {
                updateEchoPreset(preset.id, { name: editedPresetName });
                setEditingPresetId(null);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [editingPresetId, preset.id, editedPresetName]);

    const displayName =
        characters.find(c => String(c.link) === String(preset?.charId ?? runtimes[activeId]?.id))?.displayName ?? 'Unknown';

    return (
        <div
            className={`skills-modal-overlay ${isClosing ? 'closing' : ''}`}
            onClick={(e) => {
                e.stopPropagation();
                handleClose();
            }}
        >
            <div
                className={`skills-modal-content preset-preview changelog-modal guides modal-main-content echo-preview-view ${isClosing ? 'closing' : ''}`}
                onClick={(e) => e.stopPropagation()}
            >
                {(preset.charName || runtimes[activeId].Name) && (
                    <span className="preset-date overview-weapon-details">
                        Created with {preset.charName ?? runtimes[activeId].Name} on {new Date(preset.createdAt).toLocaleDateString()}
                        {!sameDate(preset.createdAt, preset.updatedAt) ?
                            ` ✿ Last Updated: ${new Date(preset.updatedAt).toLocaleDateString()}` : ''}
                    </span>
                )}
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                    {editingPresetId === preset.id ? (
                        <input
                            ref={inputRef}
                            type="text"
                            value={editedPresetName}
                            onChange={(e) => setEditedPresetName(e.target.value)}
                            onBlur={() => {
                                updateEchoPreset(preset.id, { name: editedPresetName });
                                setEditingPresetId(null);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    updateEchoPreset(preset.id, { name: editedPresetName });
                                    setEditingPresetId(null);
                                } else if (e.key === 'Escape') {
                                    setEditingPresetId(null);
                                }
                            }}
                            autoFocus
                            className="entry-name-edit preset-name-edit"
                        />
                    ) : (
                        <h2>{preset.name}</h2>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 'auto', gap: '3px' }}>
                        <h4
                            style={{ marginBottom: 'unset', padding: '0.5rem 0.9rem' }}
                            className="echo-buff"
                        >
                            Build Score: {percentScoreCur > 0 ? percentScoreCur.toFixed(1) : '??'}%
                        </h4>
                        <span className="preset-date overview-weapon-details build-score">
                        {(charId !== activeId) && (
                            <>{percentScore > 0 ? percentScore.toFixed(1) : '??'}% for {displayName}</>
                        )}
                    </span>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                    <h3 >Echoes in this preset:</h3>
                    <div
                        style={{ marginLeft: 'auto', marginBottom: 'unset', display: 'flex', flexDirection: 'row', gap: '0.75rem' }}
                    >
                        <button
                            className="btn-primary echoes"
                            style={{ marginLeft: 'auto', marginBottom: 'unset' }}
                            onClick={() => {
                                setEditingPresetId(preset.id);
                                setEditedPresetName(preset.name);
                            }}
                        >
                            Edit Preset Name
                        </button>
                        <button
                            className="btn-primary echoes"
                            onClick={() => {
                                onEquipPreset(preset)
                            }}
                        >
                            Equip
                        </button>
                        <button
                            className="rotation-button clear echoes"
                            onClick={() => {
                                deleteEchoPreset(preset.id);
                                handleClose();
                            }}
                        >
                            Delete
                        </button>
                    </div>
                </div>

                <div
                    className="echo-grid main-echo-description guides"
                    style={{ marginBottom: '1rem' }}
                >
                    {[...Array(5)].map((_, index) => {
                        const echo = echoes[index] ?? null;
                        const score = echo
                            ? (getEchoScores(charId, echo).totalScore / maxScore) * 100
                            : 0;

                        return (
                            <div
                                key={index}
                                className="echo-tile overview inherent-skills-box echo-parser-preview"
                                style={{ margin: 'unset' }}
                            >
                                <EchoGridPreview
                                    echo={echo}
                                    getImageSrc={getImageSrc}
                                    score={score}
                                    setIconMap={setIconMap}
                                    className={'echo-parser-preview preset-preview'}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export function sameDate(t1, t2) {
    const d1 = new Date(t1);
    const d2 = new Date(t2);
    return (
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()
    );
}