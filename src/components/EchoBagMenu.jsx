import React, {useEffect, useMemo, useState} from 'react';
import EditSubstatsModal from './EchoEditModal';
import {setIconMap} from "../constants/echoSetData";
import { isEqual } from 'lodash';
import {
    getEchoBag,
    subscribeEchoBag,
    updateEchoInBag,
    clearEchoBag
} from '../state/echoBagStore';
import {getValidMainStats} from "../utils/echoHelper.js";
import {imageCache} from "../pages/calculator.jsx";
import {
    buildPresetFilterOptions,
    clearEchoStore,
    getEchoPresets,
    subscribeEchoPresets,
} from "../state/echoPresetStore.js";
import Select from 'react-select';
import {usePersistentState} from "../hooks/usePersistentState.js";
import {EchoPresetPreview, PresetsView} from "./EchoPresets.jsx";
import {BagView} from "./EchoBag.jsx";

export function isEchoModified(oldEcho, updatedEcho) {
    return (
        oldEcho.selectedSet !== updatedEcho.selectedSet ||
        oldEcho.cost !== updatedEcho.cost ||
        !isEqual(oldEcho.mainStats, updatedEcho.mainStats) ||
        !isEqual(oldEcho.subStats, updatedEcho.subStats)
    );
}

const filterOptions = [
    { value: 'char', label: 'Character' },
    { value: 'equipped', label: 'Currently Equipped' },
];

export default function EchoBagMenu({
                                        onClose,
                                        onEquip,
                                        selectedSet,
                                        setSelectedSet,
                                        selectedCost,
                                        setSelectedCost,
                                        searchTerm,
                                        setSearchTerm,
                                        setConfirmMessage,
                                        setShowToast,
                                        setShowConfirm,
                                        setPopupMessage,
                                        viewMode,
                                        setViewMode,
                                        onEquipPreset,
                                        setEditingPreset,
                                        characters,
                                        getImageSrc,
                                        runtime,
                                        characterRuntimeStates,
                                        charId
                                    }) {
    const [echoBag, setEchoBag] = useState(getEchoBag());
    const [version, setVersion] = useState(0);
    const [editingEcho, setEditingEcho] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimatingOut, setIsAnimatingOut] = useState(false);
    const [preloaded, setPreloaded] = useState(false);
    const [didOpenOnce, setDidOpenOnce] = useState(false);
    const handleOverlayClick = () => {
        if (!editingEcho) {
            setIsAnimatingOut(true);
            setTimeout(() => {
                setIsVisible(false);
                onClose();
                setIsAnimatingOut(false);
            }, 300);
        }
    };
    const filteredEchoes = [...echoBag]
        .filter(echo => {
            const matchesCost = selectedCost === null || echo.cost === selectedCost;
            const matchesName = echo?.name?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesSet = selectedSet === null || echo.selectedSet === selectedSet;
            return matchesCost && matchesName && matchesSet;
        })
        .sort((a, b) => a.name.localeCompare(b.name));

    useEffect(() => {
        const unsubscribe = subscribeEchoBag(setEchoBag);
        return unsubscribe;
    }, []);

    const [echoPresets, setEchoPresets] = useState(getEchoPresets());
    useEffect(() => {
        const unsubscribe = subscribeEchoPresets(setEchoPresets);
        return unsubscribe;
    }, []);

    useEffect(() => {
        setIsVisible(true);
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setIsAnimatingOut(false);
            });
        });
    }, []);
    useEffect(() => {
        if (!isVisible || didOpenOnce) return;

        const preloadImages = async () => {
            const srcList = [];

            for (const echo of echoBag) {
                if (echo.icon) srcList.push(echo.icon);
                if (echo.selectedSet) srcList.push(setIconMap[echo.selectedSet]);
            }

            await Promise.all(
                srcList.map(src => new Promise(resolve => {
                    const img = new Image();
                    img.onload = resolve;
                    img.onerror = resolve;
                    img.src = src;
                }))
            );

            setPreloaded(true);
            setDidOpenOnce(true);
        };

        setPreloaded(false);
        preloadImages();
    }, [isVisible, echoBag, didOpenOnce]);

    const [filterOption, setFilterOption] = usePersistentState('filterOption', 'char');
    const { charOptions, equippedOptions } = useMemo(
        () => buildPresetFilterOptions(characters),
        [characters, echoPresets]
    );
    const [selectedFilters, setSelectedFilters] = React.useState([]);

    const currentFilterOptions =
        filterOption === 'char'
            ? charOptions
            : filterOption === 'equipped'
                ? equippedOptions
                : [];

    const filteredPresets = useMemo(() => {
        if (!filterOption || selectedFilters.length === 0) return echoPresets;

        if (filterOption === 'char') {
            return echoPresets.filter(p =>
                selectedFilters.includes(String(p.charId))
            );
        }

        if (filterOption === 'equipped') {
            return echoPresets.filter(p =>
                p.equipped?.some(id => selectedFilters.includes(String(id)))
            );
        }

        return echoPresets;
    }, [filterOption, selectedFilters, echoPresets]);

    const [viewingPreset, setViewingPreset] = useState(null);
    const [showPresetModal, setShowPresetModal] = useState(false);

    const [editingPresetId, setEditingPresetId] = useState(null);
    const [editedPresetName, setEditedPresetName] = useState('');

    if (!isVisible || (!preloaded && !didOpenOnce)) return null;

    return (
        <div
            className={`menu-overlay ${isAnimatingOut ? 'hiding' : 'show'}`}
            onClick={handleOverlayClick}
        >
            <div
                className={`edit-substats-modal echo-bag-modal ${isAnimatingOut ? 'hiding' : 'show'}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="menu-header-with-buttons echo">
                    <div className="echo-bag-header">
                        <div
                            className="rotation-view-toggle"
                        >
                            <button
                                className={`view-toggle-button echo-bag ${viewMode === 'echoes' ? 'active' : ''}`}
                                onClick={() => setViewMode('echoes')}>
                                Echoes
                            </button>
                            <button
                                className={`view-toggle-button echo-bag ${viewMode === 'presets' ? 'active' : ''}`}
                                onClick={() => setViewMode('presets')}
                            >
                                Presets
                            </button>
                        </div>
                        <div className="menu-header echo">{viewMode === 'echoes' ? 'Saved Echoes' : 'Saved Presets'}</div>
                        <button
                            className="rotation-button clear echoes"
                            onClick={() => {
                                const isBagView = viewMode === 'echoes';
                                const empty = isBagView ? echoBag.length === 0 : echoPresets.length === 0;

                                if (empty) {
                                    setPopupMessage({
                                        message: `Nothing to clear here... (´･ω･\`)`,
                                        icon: '💭',
                                        color: { light: 'orange', dark: 'gold' },
                                    });
                                    setShowToast(true);
                                    return;
                                }

                                setConfirmMessage({
                                    confirmLabel: `Clear ${isBagView ? 'Echo Bag' : 'Echo Presets'}`,
                                    cancelLabel: 'Nevermind',
                                    onConfirm: () => {
                                        if (isBagView) {
                                            clearEchoBag();
                                            setPopupMessage({
                                                message: 'Echo Bag cleared~ (〜^∇^)〜',
                                                icon: '✔',
                                                color: { light: 'green', dark: 'limegreen' },
                                            });
                                        } else {
                                            clearEchoStore();
                                            setPopupMessage({
                                                message: 'Presets cleared~! ✨',
                                                icon: '✔',
                                                color: { light: 'green', dark: 'limegreen' },
                                            });
                                        }
                                        setShowToast(true);
                                    },
                                });
                                setShowConfirm(true);
                            }}
                        >
                            Clear All
                        </button>
                    </div>
                    {viewMode === 'presets' ? (
                        <div className="button-group-container echo" style={{ gap: '0.5rem' }}>
                            <div style={{ fontWeight: 'bold'}}>Filter by:</div>
                            <Select
                                value={filterOptions.find(opt => opt.value === filterOption)}
                                onChange={(opt) => setFilterOption(opt.value)}
                                options={filterOptions}
                                classNamePrefix="single-select custom-select"
                                placeholder="Set Filter"
                            />
                            {filterOption && (
                                <Select
                                    isMulti
                                    value={currentFilterOptions.filter(o =>
                                        selectedFilters.includes(o.value)
                                    )}
                                    onChange={selected =>
                                        setSelectedFilters(selected.map(s => s.value))
                                    }
                                    options={currentFilterOptions}
                                    placeholder={'Select Character(s)'}
                                    className="select preset-filter"
                                    classNamePrefix="custom-select"
                                />
                            )}
                        </div>
                    ) : (
                        <div className="button-group-container echo">
                            {Object.entries(setIconMap).map(([setId, iconPath]) => (
                                <img
                                    key={setId}
                                    src={imageCache[iconPath]?.src || iconPath}
                                    alt={`Set ${setId}`}
                                    className={`set-icon-filter ${selectedSet === Number(setId) ? 'selected' : ''}`}
                                    onClick={() =>
                                        setSelectedSet(prev => prev === Number(setId) ? null : Number(setId))
                                    }
                                />
                            ))}
                            {[1, 3, 4].map(cost => (
                                <button
                                    key={cost}
                                    className={`echo-slot-cost-badge mini ${selectedCost === cost ? 'selected' : ''}`}
                                    onClick={() => setSelectedCost(prev => prev === cost ? null : cost)}
                                >
                                    C {cost}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                {viewMode === 'echoes' ? (
                    <BagView
                        onEquip={onEquip}
                        setEditingEcho={setEditingEcho}
                        echoBag={echoBag}
                        filteredEchoes={filteredEchoes}
                        selectedCost={selectedCost}
                        setSelectedCost={setSelectedCost}
                        selectedSet={selectedSet}
                        setSelectedSet={setSelectedSet}
                        getImageSrc={getImageSrc}
                    />
                ) : (
                    <PresetsView
                        onEquipPreset={onEquipPreset}
                        setEditingPreset={setEditingPreset}
                        filteredPresets={filteredPresets}
                        echoPresets={echoPresets}
                        characters={characters}
                        filterOption={filterOption}
                        setFilterOption={setFilterOption}
                        selectedFilters={selectedFilters}
                        currentFilterOptions={currentFilterOptions}
                        setSelectedFilters={setSelectedFilters}
                        setViewingPreset={setViewingPreset}
                        setShowPresetModal={setShowPresetModal}
                        setEditedPresetName={setEditedPresetName}
                        setEditingPresetId={setEditingPresetId}
                        editingPresetId={editingPresetId}
                        editedPresetName={editedPresetName}

                    />
                )}
            </div>

            {editingEcho && (
                <EditSubstatsModal
                    isOpen={true}
                    echo={editingEcho}
                    substats={editingEcho.subStats ?? {}}
                    mainStats={editingEcho.mainStats ?? {}}
                    getValidMainStats={getValidMainStats}
                    selectedSet={editingEcho.selectedSet ?? editingEcho.sets?.[0] ?? null}
                    onClose={() => setEditingEcho(null)}
                    onSave={(updatedEcho) => {
                        const originalEcho = echoBag.find(e => e.uid === editingEcho.uid);
                        if (!originalEcho) return;

                        const hasChanged = isEchoModified(originalEcho, updatedEcho);
                        const newUid = hasChanged
                            ? (typeof crypto !== 'undefined' && crypto.randomUUID
                                    ? crypto.randomUUID()
                                    : `${Date.now()}-${Math.random()}`
                            )
                            : originalEcho.uid;

                        updateEchoInBag({
                            ...updatedEcho,
                            uid: newUid,
                            oldUid: originalEcho.uid,
                        });
                        setVersion(v => v + 1);

                        setEditingEcho(null);
                    }}
                />
            )}
            {viewingPreset && (
                <EchoPresetPreview
                    open={showPresetModal}
                    preset={viewingPreset}
                    characters={characters}
                    charId={charId}
                    getImageSrc={getImageSrc}
                    characterRuntimeStates={characterRuntimeStates}
                    onClose={() => setShowPresetModal(false)}
                    onEquipPreset={onEquipPreset}
                    setEditedPresetName={setEditedPresetName}
                    setEditingPresetId={setEditingPresetId}
                    editingPresetId={editingPresetId}
                    editedPresetName={editedPresetName}
                />
            )}
        </div>
    );
}