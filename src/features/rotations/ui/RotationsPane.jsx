import React, {useEffect, useMemo, useReducer, useState} from 'react';
import {ArrowDownToLine, ArrowUpToLine, Pencil, Trash2} from 'lucide-react';
import {
    closestCenter,
    DndContext,
    DragOverlay,
    PointerSensor,
    pointerWithin,
    useDndMonitor,
    useDroppable,
    useSensor,
    useSensors
} from '@dnd-kit/core';
import {arrayMove, SortableContext, verticalListSortingStrategy} from '@dnd-kit/sortable';
import {restrictToFirstScrollableAncestor} from '@dnd-kit/modifiers';
import RotationItem, {BlockSubItem} from "./RotationItem.jsx";
import {buildRotation, getSkillDamageCache, makeEntry} from '@shared/utils/skillDamageCache.js';
import {getPersistentValue, setPersistentValue, usePersistentState} from "@shared/hooks/usePersistentState.js";
import {calculateRotationTotals} from "./Rotations.jsx";
import NotificationToast from "@/shared/ui/common/NotificationToast.jsx";
import {isEqual} from "lodash";
import GuidesModal from "@/shared/ui/common/GuideModal.jsx";
import ConfirmationModal from "@/shared/ui/common/ConfirmationModal.jsx";
import Select from 'react-select';
import SkillMenu, {tabDisplayOrder} from "./SkillMenu.jsx";
import PlainModal from "@/shared/ui/common/PlainModal.jsx";

const errorMessages = [
    "Pro Tip: Try using this on {character} instead, unless you enjoy seeing these alerts.",
    "Oops! Wrong character. {character} is waiting for you.",
    "Nice try, but this file belongs to {character}.",
    "Plot twist: this rotation is secretly for {character}.",
    "Error 404: Correct character not found. Did you mean to use this on {character}?",
    "Wrong file, buddy. this belongs to {character}.",
    "Rotation mismatch! The prophecy says it belongs to {character}.",
    "No match found. {character} is probably the right choice.",
    "You can’t force this rotation, it only vibes with {character}.",
    "{current} and {character} don't share the same skill set unfortunately.",
];

const errorMessagesNoChar = [
    "This rotation doesn’t belong here. Maybe try one for {current}?",
    "Rotation mismatch! {current} looks confused.",
    "Oops! Wrong character file. But hey, you could try making one for {current}.",
    "You can’t force this rotation, i'm sure {current} thinks so too.",
    "No match found. {current} thinks you're just messing around.",
    "If i let you load this in you may break the app... and we don't want that right?"
]

const sortKeyOptions = [
    { value: 'date', label: 'Date Added' },
    { value: 'name', label: 'Name' },
    { value: 'dmg', label: 'Total DMG' },
];

const sortOrderOptions = [
    { value: 'desc', label: 'Descending' },
    { value: 'asc', label: 'Ascending' },
];

export default function RotationsPane({
                                          currentSliderColor,
                                          activeCharacter,
                                          rotationEntries,
                                          setRotationEntries,
                                          characterRuntimeStates,
                                          setActiveCharacter,
                                          setCharacterRuntimeStates,
                                          setActiveCharacterId,
                                          setTeam,
                                          setSliderValues,
                                          setCharacterLevel,
                                          setCustomBuffs,
                                          setTraceNodeBuffs,
                                          setBaseCharacterState,
                                          setCombatState,
                                          characters,
                                          savedRotations,
                                          setSavedRotations,
                                          charId,
                                          setSavedTeamRotations,
                                          savedTeamRotations,
                                          smartFilter,
                                          setSmartFilter,
                                          skillResults,
                                          groupedSkillOptions: groupedSkillOptionsProp
                                      }) {
    const [showToast, setShowToast] = useState(false);
    const [popupMessage, setPopupMessage] = useState({
        icon: null,
        message: null,
        color: null
    });

    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmMessage, setConfirmMessage] = useState({
        title: null,
        message: null,
        confirmLabel: null,
        cancelLabel: null,
        onConfirm: () => {},
        onCancel: () => {}
    });

    const [viewMode, setViewMode] = useState('new');
    const [showSkillOptions, setShowSkillOptions] = useState(false);
    const [expandedTabs, setExpandedTabs] = useState(() =>
        Object.fromEntries(tabDisplayOrder.map(key => [key, true]))
    );
    const [forceUpdate] = useReducer(x => x + 1, 0);
    const sensors = useSensors(useSensor(PointerSensor, {
        activationConstraint: { distance: 5 }
    }));
    const allSkillResults = characterRuntimeStates[charId]?.allSkillResults ?? skillResults ?? getSkillDamageCache();
    const runtime = characterRuntimeStates[charId];
    const precomputedGroups = runtime?.groupedSkillOptions;
    const groupedSkillOptions = useMemo(() => {
        if (groupedSkillOptionsProp) return groupedSkillOptionsProp;
        if (precomputedGroups && Object.keys(precomputedGroups).length > 0)
            return precomputedGroups;

        const allSkills = (allSkillResults ?? []).filter(skill => skill.visible !== false);
        const groups = {};

        for (const skill of allSkills) {
            const tab = skill.tab ?? 'unknown';
            if (!groups[tab]) groups[tab] = [];
            groups[tab].push({
                name: skill.name,
                type: skill.skillType,
                tab,
                visible: skill.visible,
                element: skill.element ?? null,
            });
        }

        return groups;
    }, [groupedSkillOptionsProp, precomputedGroups, allSkillResults]);

    useEffect(() => {
        if (!charId || !groupedSkillOptions || groupedSkillOptionsProp) return;

        setCharacterRuntimeStates(prev => ({
            ...prev,
            [charId]: {
                ...prev[charId],
                groupedSkillOptions,
            },
        }));
    }, [charId, groupedSkillOptions, groupedSkillOptionsProp, setCharacterRuntimeStates]);

    const defaultRotationData = buildRotation(charId, groupedSkillOptions);
    const [sortKey, setSortKey] = usePersistentState('sortKey', 'date');
    const [sortOrder, setSortOrder] = usePersistentState('sortOrder', 'desc');
    const [editingId, setEditingId] = useState(null);
    const [editedName, setEditedName] = useState('');
    const [personalFilterCharId, setPersonalFilterCharId] = useState([]);
    const [teamFilterCharId, setTeamFilterCharId] = useState([]);
    useEffect(() => {
        let lastSeen = 0;
        const interval = setInterval(() => {
            const next = window.lastSkillCacheUpdate ?? 0;
            if (next > lastSeen) {
                lastSeen = next;
                forceUpdate();
            }
        }, 300);
        return () => clearInterval(interval);
    }, []);
    const toggleTab = (key) => {
        setExpandedTabs(prev => ({ ...prev, [key]: !prev[key] }));
    };
    const [editingEntry, setEditingEntry] = useState(null);
    function handleAddSkill(skill, entry) {
        const newEntryBase = makeEntry(skill);

        setRotationEntries(prev => {
            const copy = [...prev];
            if (editingEntry && editingEntry.id) {
                const targetIndex = copy.findIndex(e => e.id === editingEntry.id);

                if (targetIndex !== -1) {
                    const prevItem = copy[targetIndex];
                    const prevMultiplier = prevItem.multiplier ?? 1;
                    const prevSnapshot = prevItem.snapshot ?? undefined;
                    const prevBlockId = prevItem.blockId ?? null;

                    copy[targetIndex] = {
                        ...newEntryBase,
                        id: prevItem.id,
                        multiplier: prevMultiplier,
                        locked: prevItem.locked ?? false,
                        blockId: prevBlockId,
                        snapshot: prevSnapshot
                            ? {
                                avg: prevSnapshot.avg,
                                crit: prevSnapshot.crit,
                                normal: prevSnapshot.normal,
                                tab: skill.tab,
                                label: skill.label,
                                element: skill.element ?? null,
                            }
                            : undefined,
                    };
                } else {
                    copy.push(newEntryBase);
                }
            } else {
                copy.push(newEntryBase);
            }

            return copy;
        });

        setEditingEntry(null);
        setShowSkillOptions(false);
    }

    useEffect(() => {
        if (!charId) return;
        const savedRotation = characterRuntimeStates?.[charId]?.rotationEntries ?? [];

        const patched = savedRotation.map(entry => ({
            ...entry,
            createdAt: entry.createdAt ?? Date.now() + Math.random()
        }));

        setRotationEntries(patched);
    }, [charId]);

    useEffect(() => {
        if (!charId) return;
        setCharacterRuntimeStates(prev => ({
            ...prev,
            [charId]: {
                ...(prev[charId] ?? {}),
                rotationEntries: rotationEntries
            }
        }));
    }, [rotationEntries, charId]);

    const loadSavedRotation = (saved) => {
        const id = saved.characterId ?? saved.charId;
        const newCharacter = characters.find(c => String(c.Id ?? c.id ?? c.link) === String(id));
        if (!newCharacter) return;

        setActiveCharacter(newCharacter);
        setActiveCharacterId(id);

        setCharacterRuntimeStates(prev => ({
            ...prev,
            [id]: saved.fullCharacterState
        }));
        setTeam(saved.fullCharacterState.Team ?? [id, null, null]);
        setSliderValues(saved.fullCharacterState.SkillLevels ?? {});
        setCharacterLevel(saved.fullCharacterState.CharacterLevel ?? 1);
        setTraceNodeBuffs(saved.fullCharacterState.TraceNodeBuffs ?? {});
        setCustomBuffs(saved.fullCharacterState.CustomBuffs ?? {});
        setCombatState(saved.fullCharacterState.CombatState ?? {});
        setBaseCharacterState({ Stats: saved.fullCharacterState.Stats ?? {} });

        setRotationEntries(
            (saved.entries ?? saved.fullCharacterState.rotationEntries ?? []).map(e => ({
                ...e,
                createdAt: e.createdAt ?? Date.now() + Math.random()
            }))
        );

        const prevRuntime = getPersistentValue('characterRuntimeStates', {});
        const newRuntime = {
            ...prevRuntime,
            [id]: saved.fullCharacterState
        };
        setPersistentValue('characterRuntimeStates', newRuntime);
        setPersistentValue('activeCharacterId', id);
        setPopupMessage({
            message: 'Loaded Successfully~! (〜^∇^)〜',
            icon: '✔',
            color: { light: 'green', dark: 'limegreen' },
        });
        setShowToast(true);
    };

    const normalizedEntries = rotationEntries.map((entry, idx) => ({
        ...entry,
        createdAt: entry.createdAt ?? Date.now() + idx + Math.random()
    }));

    const [isClosing, setIsClosing] = useState(false);

    const closeMenu = () => {
        setIsClosing(true);
        setTimeout(() => {
            setShowSkillOptions(false);
            setIsClosing(false);
        }, 200);
    };

    const teamRotation = characterRuntimeStates[charId]?.teamRotation ?? {};
    const activeStates = characterRuntimeStates[charId]?.activeStates ?? {};

    const toggleKeys = ["teammateRotation-1", "teammateRotation-2"];
    const hasValidTeamRotation = (
        characterRuntimeStates[charId]?.Team?.length > 1 &&
        Object.keys(teamRotation).length > 0 &&
        (activeStates[toggleKeys[0]] || activeStates[toggleKeys[1]])
    );

    function getCharacterFilterOptions(fromEntries, characters) {
        const seenIds = new Set();

        for (const entry of fromEntries) {
            const id = String(entry.characterId ?? entry.charId);
            if (id) seenIds.add(id);
        }

        return characters
            .filter(char => seenIds.has(String(char.link)))
            .map(char => ({
                id: String(char.link),
                name: char.displayName
            }));
    }

    const filterOptions = useMemo(() =>
        getCharacterFilterOptions(savedRotations, characters), [savedRotations, characters]);

    const teamFilterOptions = useMemo(() =>
        getCharacterFilterOptions(savedTeamRotations, characters), [savedTeamRotations, characters]);

    useEffect(() => {
        if (!smartFilter) {
            setPersonalFilterCharId(prev =>
                prev.filter(id => String(id) !== String(charId))
            );
            setTeamFilterCharId(prev =>
                prev.filter(id => String(id) !== String(charId))
            );
            return;
        }
        const isInPersonal = filterOptions.some(opt => String(opt.id) === String(charId));

        setPersonalFilterCharId(prev => {
            const updated = new Set(prev.map(String));

            if (isInPersonal) {
                updated.add(String(charId));
            } else {
                updated.delete(String(charId));
            }
            return Array.from(updated);
        });

        const isInTeam = teamFilterOptions.some(opt => String(opt.id) === String(charId));
        setTeamFilterCharId(prev => {
            const updated = new Set(prev.map(String));

            if (isInTeam) {
                updated.add(String(charId));
            } else {
                updated.delete(String(charId));
            }
            return Array.from(updated);
        });
    }, [charId, filterOptions, teamFilterOptions, smartFilter]);

    function exportRotationEntries(rotationName, characterState) {
        const runtime = characterState ?? characterRuntimeStates[charId];
        const rotationEntries = runtime.rotationEntries ?? [];
        const cleanedEntries = rotationEntries.map(entry => {
            const { snapshot, ...rest } = entry;
            return {
                ...rest,
                locked: false
            };
        });

        const exportData = {
            charId: runtime.Id,
            character: runtime.Name,
            rotation: rotationName ?? runtime.Name,
            rotationEntries: cleanedEntries
        };

        const cleanedRotationName = rotationName
            ? String(rotationName)
                .replace(/, /g, '-')
                .replace(/,/g, '-')
                .replace(/\s+/g, '-')
                .replace(/[<>:"/\\|?*\x00-\x1F]/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '')
                .toLowerCase()
            : null;

        const now = new Date();
        const timestamp = now.toISOString().replace(/[:.]/g, '-');
        const characterName = runtime?.Name?.toLowerCase() || `char-${charId}`;

        const dataStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `rotation-${cleanedRotationName ?? characterName}-${timestamp}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    function importRotationEntries() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);

                    if (!data || !Array.isArray(data.rotationEntries) || typeof data.charId === 'undefined') {
                        setPopupMessage({
                            message: 'This isn\'t a rotation file... what were you trying to do...? (╹ -╹)?',
                            icon: '✘',
                            color: 'red'
                        });
                        setShowToast(true);
                        return;
                    }

                    if (data.charId !== charId) {
                        const currentChar = characterRuntimeStates[charId]?.Name || "this character";
                        const messagesComp = [...errorMessages, ...errorMessagesNoChar];
                        let msg = messagesComp[Math.floor(Math.random() * messagesComp.length)];

                        if (msg.includes("{character}") && data.character) {
                            msg = msg.replace("{character}", data.character);
                            msg = msg.replace("{current}", currentChar);
                        } else {
                            msg = errorMessagesNoChar[Math.floor(Math.random() * errorMessagesNoChar.length)];
                            msg = msg.replace("{current}", currentChar);
                        }

                        setPopupMessage({
                            message: msg + ' (ㆆ ᴗ ㆆ)',
                            icon: '✘',
                            color: 'red'
                        });
                        setShowToast(true);
                        return;
                    }

                    if (isEqual(data.rotationEntries, rotationEntries)) {
                        setPopupMessage({
                            message: 'Same rotation but you do you i guess~! ദ്ദി(˵ •̀ ᴗ - ˵ ) ✧',
                            icon: '✔',
                            color: { light: 'green', dark: 'limegreen' },
                        });
                        setShowToast(true);
                        return;
                    }

                    setRotationEntries(data.rotationEntries);
                    setPopupMessage({
                        message: 'Imported successfully~! (〜^∇^)〜',
                        icon: '✔',
                        color: { light: 'green', dark: 'limegreen' },
                    });
                    setShowToast(true);
                } catch (err) {
                    alert('Error reading file: ' + err.message);
                }
            };

            reader.readAsText(file);
        };

        input.click();
    }

    const [showGuide, setShowGuide] = useState(false);
    const [guideCategory, setGuideCategory] = useState(null);

    const openGuide = React.useCallback((category) => {
        setGuideCategory(category);
        setShowGuide(true);
    }, []);

    const options = filterOptions.map(opt => ({
        value: opt.id,
        label: opt.name
    }));

    function loadBuiltRotation () {
        const rotations = defaultRotationData?.builtRotations;
        if (!rotations || rotations.length === 0) {
            setPopupMessage({
                message: `${activeCharacter.displayName} doesn't have one yet... (˶º⤙º˶)`,
                icon: '❤',
                color: { light: 'green', dark: 'limegreen' },
                duration: 60000,
                prompt: {
                    message: 'DO IT YOURSELF~!',
                    action: () => {
                        if (viewMode !== 'new') setViewMode('new');
                        setShowSkillOptions(true);
                    }
                },
                onClose: () => setTimeout(() => setShowToast(false), 300)
            });
            setShowToast(true);
        } else {
            if (rotationEntries && rotationEntries.length > 0) {
                setConfirmMessage({
                    confirmLabel: 'Overwrite',
                    message: `This will overwrite the current rotation with <a href="${defaultRotationData?.link}" target="_blank" rel="noopener noreferrer">Prydwen's</a>. This action cannot be undone...`,
                    onConfirm: () => {
                        if (viewMode !== 'new') setViewMode('new');
                        setRotationEntries(rotations);
                        setPopupMessage({
                            message: 'Loaded~! (〜^∇^)〜',
                            icon: '✔',
                            color: { light: 'green', dark: 'limegreen' },
                        });
                        setShowToast(true);
                    },
                });
            } else {
                setConfirmMessage({
                    title: 'Load in basic rotation ( ദ്ദി ˙ᗜ˙ )',
                    message: `This will load in <a href="${defaultRotationData?.link}" target="_blank" rel="noopener noreferrer">Prydwen's</a> standard rotation for this character.`,
                    onConfirm: () => {
                        if (viewMode !== 'new') setViewMode('new');
                        setRotationEntries(rotations);
                        setPopupMessage({
                            message: 'Loaded~! (〜^∇^)〜',
                            icon: '✔',
                            color: { light: 'green', dark: 'limegreen' },
                        });
                        setShowToast(true);
                    },
                });
            }
            setShowConfirm(true);
        }
    }

    function handleAddEntryToBlock(blockId, skill) {
        setRotationEntries(prev => {
            return prev.map(item => {
                if (item.id === skill.id) {
                    return { ...item, blockId };
                }
                return item;
            });
        });
    }

    function handleBlockMultiplierChange(blockId, newBlockMultiplier) {
        setRotationEntries(prev => {
            const block = prev.find(e => e.id === blockId);
            if (!block) return prev;

            const subIds = (block.entries ?? []).map(ref => ref.id);

            return prev.map(entry => {
                if (entry.id === blockId) {
                    return {
                        ...entry,
                        multiplier: newBlockMultiplier,
                    };
                }

                if (subIds.includes(entry.id)) {
                    const originalMultiplier = entry.originalMultiplier ?? entry.multiplier ?? 1;
                    return {
                        ...entry,
                        originalMultiplier,
                        multiplier: originalMultiplier * newBlockMultiplier,
                    };
                }

                return entry;
            });
        });
    }

    function removeEntryFromBlock(entryId, fromBlockId) {
        setRotationEntries(prev => {
            if (!entryId || !fromBlockId) return prev;
            return prev.map(entry => {
                if (entry.id === entryId) {
                    const parentBlock = prev.find(b => b.id === fromBlockId);
                    const blockMultiplier = parentBlock?.multiplier ?? 1;
                    const newMultiplier = entry.blockId
                        ? (entry.multiplier ?? 1) / blockMultiplier
                        : entry.multiplier;
                    return {
                        ...entry,
                        blockId: null,
                        multiplier: newMultiplier,
                    };
                }
                if (entry.id === fromBlockId) {
                    const filteredEntries = entry.entries?.filter(ref => ref.id !== entryId) ?? [];
                    return {
                        ...entry,
                        entries: filteredEntries,
                    };
                }
                return entry;
            });
        });
    }

    const { setNodeRef: setTopDropRef } = useDroppable({
        id: 'rotation-top-zone',
        data: { type: 'top' }
    });

    const [modalOpen, setModalOpen] = useState(false);
    const [editingBlockId, setEditingBlockId] = useState(null);
    const [isEditingBlockName, setIsEditingBlockName] = useState(false);

    const editingBlock = useMemo(
        () => rotationEntries.find(e => e.id === editingBlockId),
        [rotationEntries, editingBlockId]
    );
    const [editedBlockName, setEditedBlockName] = useState(editingBlock?.label ?? "New Block");

    return (
        <div className="rotation-pane">
            <div className="rotation-view-toggle">
                <button className={`view-toggle-button ${viewMode === 'new' ? 'active' : ''}`} onClick={() => setViewMode('new')}>
                    New
                </button>
                <button className={`view-toggle-button ${viewMode === 'saved' ? 'active' : ''}`} onClick={() => setViewMode('saved')}>
                    Saved
                </button>
                <button
                    className={`view-toggle-button ${viewMode === 'team' ? 'active' : ''}`}
                    onClick={() => setViewMode('team')}
                >
                    Team
                </button>
                <div className="rotation-control-buttons"
                     style={{ marginLeft: 'auto', display: 'flex', gap: '1rem'}}>
                    <button
                        onClick={loadBuiltRotation}
                        className="btn-primary echoes">
                        Basic
                    </button>
                    <button onClick={() => openGuide('Rotations')} className="btn-primary echoes">
                        See Guide
                    </button>
                </div>
            </div>

            {viewMode === 'new' && (
                <>
                    <h2 className="panel-title">
                        Rotation

                        <div style={{ display: 'flex', justifyContent: 'flex-end', flexDirection: 'row', gap: '1rem' }}>
                            <button
                                className="download-btn rotation-button screenshot"
                                style={{ padding: '6px 12px' }}
                                onClick={() => exportRotationEntries(characterRuntimeStates[charId].Name + ' unnamed')}
                            >
                                <ArrowUpToLine size={16} strokeWidth={3} />
                                <span className="label">Export</span>
                            </button>
                            <button
                                className="download-btn rotation-button screenshot"
                                style={{ padding: '6px 12px' }}
                                onClick={importRotationEntries}
                            >
                                <ArrowDownToLine size={16} strokeWidth={3} />
                                <span className="label">Import</span>
                            </button>
                        </div>
                    </h2>

                    <div className="rotation-controls">
                        <div className="rotation-buttons-left">
                            <button className="rotation-button" onClick={() => setShowSkillOptions(true)}>+ Skill</button>
                            <button
                                className="rotation-button"
                                onClick={() => {
                                    const newBlock = {
                                        id: crypto.randomUUID(),
                                        createdAt: Date.now(),
                                        label: 'New Block',
                                        multiplier: 1,
                                        entries: [],
                                        type: 'block'
                                    };
                                    setRotationEntries(prev => [...prev, newBlock]);
                                }}
                            >
                                + Block
                            </button>
                            <button className="rotation-button clear"
                                    onClick={() => {
                                        if (!rotationEntries || rotationEntries?.length === 0) {
                                            setPopupMessage({
                                                message: 'You\'re trying to clear nothing... maybe add something first~? (゜。゜)',
                                                icon: '❤',
                                                color: { light: 'green', dark: 'limegreen' },
                                                duration: 60000,
                                                prompt: {
                                                    message: 'Add Something~',
                                                    action: () => {
                                                        setShowSkillOptions(true);
                                                    }
                                                },
                                                onClose: () => setTimeout(() => setShowToast(false), 300)
                                            });
                                            setShowToast(true);
                                        } else {
                                            setConfirmMessage({
                                                confirmLabel: 'Clear Rotation',
                                                onConfirm: () => {
                                                    setRotationEntries([]);
                                                    setPopupMessage({
                                                        message: 'Cleared~! (〜^∇^)〜',
                                                        icon: '✔',
                                                        color: { light: 'green', dark: 'limegreen' },
                                                    });
                                                    setShowToast(true);
                                                },
                                            });
                                            setShowConfirm(true);
                                        }
                                    }}
                            >
                                Clear
                            </button>
                        </div>
                        <button
                            className="rotation-button add-button"
                            title="Save Rotation"
                            onClick={() => {
                                if (!rotationEntries || rotationEntries?.length === 0) {
                                    setPopupMessage({
                                        message: 'You\'re trying to save nothing... maybe add something first~? (゜。゜)',
                                        icon: '❤',
                                        color: { light: 'green', dark: 'limegreen' },
                                        duration: 60000,
                                        prompt: {
                                            message: 'Add Something~',
                                            action: () => {
                                                setShowSkillOptions(true);
                                            }
                                        },
                                        onClose: () => setTimeout(() => setShowToast(false), 300)
                                    });
                                    setShowToast(true);
                                } else {
                                    const characterId = activeCharacter?.Id ?? activeCharacter?.id ?? activeCharacter?.link;
                                    const characterName = activeCharacter?.displayName ?? 'Unknown';
                                    const dateId = Date.now();

                                    const result = calculateRotationTotals( allSkillResults, rotationEntries )

                                    const newSaved = {
                                        id: dateId,
                                        characterId,
                                        characterName,
                                        entries: rotationEntries,
                                        total: result.total,
                                        breakdownMap: result.breakdownMap,
                                        supportTotals: result.supportTotals,
                                        fullCharacterState: characterRuntimeStates?.[characterId] ?? {}
                                    };
                                    setSavedRotations(prev => [...prev, newSaved]);

                                    setPopupMessage({
                                        message: 'Added to saves~! (〜^∇^)〜',
                                        icon: '✔',
                                        color: { light: 'green', dark: 'limegreen' },
                                    });
                                    setShowToast(true);
                                }
                            }}
                        >
                            ＋
                        </button>
                    </div>

                    <div ref={setTopDropRef} className="rotation-list-container">
                        <RotationDndWrapper
                            sensors={sensors}
                            rotationEntries={rotationEntries}
                            setRotationEntries={setRotationEntries}
                            normalizedEntries={normalizedEntries}
                            allSkillResults={allSkillResults}
                            currentSliderColor={currentSliderColor}
                            handleAddEntryToBlock={handleAddEntryToBlock}
                            handleBlockMultiplierChange={handleBlockMultiplierChange}
                            setShowSkillOptions={setShowSkillOptions}
                            setEditingEntry={setEditingEntry}
                            setModalOpen={setModalOpen}
                            setEditingBlockId={setEditingBlockId}
                            removeEntryFromBlock={removeEntryFromBlock}
                        />
                    </div>

                    <SkillMenu
                        open={showSkillOptions}
                        isClosing={isClosing}
                        closeMenu={closeMenu}
                        groupedSkillOptions={groupedSkillOptions}
                        expandedTabs={expandedTabs}
                        toggleTab={toggleTab}
                        handleAddSkill={handleAddSkill}
                    />
                </>
            )}

            {viewMode === 'saved' && (
                <>
                    <div style={{ display: 'flex', flexDirection: 'row' }}>
                        <h2 className="panel-title">Saved Rotations</h2>
                        <label
                            className='modern-checkbox'
                            style={{ fontSize: '1rem', gap: '0.3rem', fontWeight: 'bold', marginLeft: 'auto' }}
                        >
                            Smart Filter
                            <input
                                type="checkbox"
                                checked={smartFilter}
                                onChange={(e) => setSmartFilter(e.target.checked)}
                            />
                        </label>
                    </div>
                    <div className="sort-controls">
                        <label style={{ marginRight: '8px', fontWeight: 'bold' }}>Sort by:</label>
                        <Select
                            value={sortKeyOptions.find(opt => opt.value === sortKey)}
                            onChange={(opt) => setSortKey(opt.value)}
                            options={sortKeyOptions}
                            classNamePrefix="single-select custom-select"
                            placeholder="Sort by"
                        />
                        <Select
                            value={sortOrderOptions.find(opt => opt.value === sortOrder)}
                            onChange={(opt) => setSortOrder(opt.value)}
                            options={sortOrderOptions}
                            classNamePrefix="single-select custom-select"
                            placeholder="Order"
                        />
                        <Select
                            isMulti
                            value={options.filter(o => personalFilterCharId.includes(o.value))}
                            onChange={(selected) => setPersonalFilterCharId(selected.map(s => s.value))}
                            options={options}
                            placeholder="Filter"
                            className="select"
                            classNamePrefix="custom-select"
                        />
                        <button
                            className="rotation-button clear"
                            onClick={() => {
                                if (!savedRotations || savedRotations?.length === 0) {
                                    setPopupMessage({
                                        message: 'You\'re trying to clear nothing... maybe save something first~? (゜。゜)',
                                        icon: '❤',
                                        color: { light: 'green', dark: 'limegreen' },
                                        duration: 60000,
                                        prompt: {
                                            message: 'Save a Rotation~',
                                            action: () => {
                                                setViewMode('new');
                                                if (rotationEntries.length === 0) setShowSkillOptions(true);
                                            }
                                        },
                                        onClose: () => setTimeout(() => setShowToast(false), 300)
                                    });
                                    setShowToast(true);
                                } else {
                                    setConfirmMessage({
                                        confirmLabel: 'Clear Saved Rotations',
                                        message: 'This will clear ALL saved rotations, not just the filtered out ones you\'re seeing. ' +
                                            'This action cannot be undone...',
                                        onConfirm: () => {
                                            setSavedRotations([]);
                                            setPopupMessage({
                                                message: 'Cleared~! (〜^∇^)〜',
                                                icon: '✔',
                                                color: { light: 'green', dark: 'limegreen' },
                                            });
                                            setShowToast(true);
                                        },
                                    });
                                    setShowConfirm(true);
                                }
                            }}
                            style={{ marginLeft: 'auto'}}
                        >Clear</button>

                    </div>
                    <div className="saved-rotation-list">
                        {savedRotations.length === 0 ? (
                            <p style={{ color: '#5c5c5c' }}>hmm...</p>
                        ) : (
                            [...savedRotations]
                                .filter(entry => {
                                    const charId = String(entry.characterId ?? entry.charId);
                                    return (
                                        personalFilterCharId.length === 0 ||
                                        personalFilterCharId.includes(charId)
                                    );
                                })
                                .sort((a, b) => {
                                    let valA, valB;
                                    switch (sortKey) {
                                        case 'name':
                                            valA = a.characterName?.toLowerCase() ?? '';
                                            valB = b.characterName?.toLowerCase() ?? '';
                                            break;
                                        case 'dmg':
                                            valA = a.total?.avg ?? 0;
                                            valB = b.total?.avg ?? 0;
                                            break;
                                        case 'date':
                                        default:
                                            valA = a.id;
                                            valB = b.id;
                                    }
                                    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
                                    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
                                    return 0;
                                })
                                .map((saved) => (
                                    <div key={saved.id} className="rotation-item-wrapper">
                                        <div className="rotation-item">
                                            <div className="rotation-header">
                                                {editingId === saved.id ? (
                                                    <input
                                                        type="text"
                                                        value={editedName}
                                                        onChange={(e) => setEditedName(e.target.value)}
                                                        onBlur={() => {
                                                            setSavedRotations(prev =>
                                                                prev.map(r =>
                                                                    r.id === saved.id
                                                                        ? { ...r, characterName: editedName }
                                                                        : r
                                                                )
                                                            );
                                                            setEditingId(null);
                                                        }}
                                                        autoFocus
                                                        className="entry-name-edit"
                                                    />
                                                ) : (
                                                    <span className="highlight">{saved.characterName}</span>
                                                )}
                                                <span className="entry-type-detail">
                                                    <span className="entry-detail-text">
                                                        {new Date(saved.id).toLocaleDateString(undefined, {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric'
                                                        })}
                                                    </span>
                                                </span>
                                            </div>

                                            <div className="rotation-values">
                                                <span className="value-label">Normal</span>
                                                <span className="value">{Math.round(saved.total.normal).toLocaleString()}</span>
                                                <span className="value-label">Crit</span>
                                                <span className="value">{Math.round(saved.total.crit).toLocaleString()}</span>
                                                <span className="value-label">Avg</span>
                                                    <span className="value avg" style={{ fontWeight: 'bold' }}>
                                                    {Math.round(saved.total.avg).toLocaleString()}
                                                </span>

                                                <button
                                                    className="rotation-button load-button"
                                                    title="Load Rotation"
                                                    onClick={() => loadSavedRotation(saved)}
                                                    style={{ marginLeft: 'auto' }}
                                                >
                                                    Load
                                                </button>

                                                <button
                                                    className="rotation-button"
                                                    title="Export Rotation"
                                                    onClick={() => {exportRotationEntries(saved.characterName, saved.fullCharacterState)}}
                                                >
                                                    Export
                                                </button>

                                            </div>
                                        </div>

                                        <div className="rotation-actions external-actions">
                                            <button
                                                className="rotation-button"
                                                title="Edit Name"
                                                onClick={() => {
                                                    setEditingId(saved.id);
                                                    setEditedName(saved.characterName);
                                                }}
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button
                                                className="rotation-button"
                                                title="Delete"
                                                onClick={() => {
                                                    setSavedRotations(prev =>
                                                        prev.filter((r) => r.id !== saved.id)
                                                    );
                                                }}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                        )}
                    </div>
                </>
            )}

            {viewMode === 'team' && (
                <>
                    <div style={{ display: 'flex', flexDirection: 'row' }}>
                        <h2 className="panel-title">Saved Team Rotations</h2>
                        <label
                            className='modern-checkbox'
                            style={{ fontSize: '1rem', gap: '0.3rem', fontWeight: 'bold', marginLeft: 'auto' }}
                        >
                            Smart Filter
                            <input
                                type="checkbox"
                                checked={smartFilter}
                                onChange={(e) => setSmartFilter(e.target.checked)}
                            />
                        </label>
                    </div>
                    <div className="sort-controls">
                        <label style={{ marginRight: '8px', fontWeight: 'bold' }}>Sort by:</label>
                        <Select
                            value={sortKeyOptions.find(opt => opt.value === sortKey)}
                            onChange={(opt) => setSortKey(opt.value)}
                            options={sortKeyOptions}
                            classNamePrefix="single-select custom-select"
                            placeholder="Sort by"
                        />
                        <Select
                            value={sortOrderOptions.find(opt => opt.value === sortOrder)}
                            onChange={(opt) => setSortOrder(opt.value)}
                            options={sortOrderOptions}
                            classNamePrefix="single-select custom-select"
                            placeholder="Order"
                        />
                        <Select
                            isMulti
                            value={options.filter(o => personalFilterCharId.includes(o.value))}
                            onChange={(selected) => setPersonalFilterCharId(selected.map(s => s.value))}
                            options={options}
                            placeholder="Filter"
                            className="select"
                            classNamePrefix="custom-select"
                        />
                    </div>
                    <div className="rotation-controls">
                        <div className="rotation-buttons-left">
                            {(savedRotations && savedRotations?.length !== 0) && (
                                <button className="rotation-button clear"
                                        onClick={() => {
                                            setConfirmMessage({
                                                confirmLabel: 'Clear Team Rotations',
                                                message: 'This will clear ALL saved team rotations, not just the filtered out ones you\'re seeing. ' +
                                                    'This action cannot be undone...',
                                                onConfirm: () => {
                                                    setSavedTeamRotations([]);
                                                    setPopupMessage({
                                                        message: 'Cleared~! (〜^∇^)〜',
                                                        icon: '✔',
                                                        color: { light: 'green', dark: 'limegreen' },
                                                    });
                                                    setShowToast(true);
                                                },
                                            });
                                            setShowConfirm(true);
                                        }}
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                        {!hasValidTeamRotation ? (
                            <span style={{ fontSize: '0.8rem', color: 'gray', marginLeft: 'auto', fontWeight: 'bold' }}>
                                No Team Rotation
                            </span>
                        ) : (
                            <button
                                className="rotation-button add-button"
                                disabled={!hasValidTeamRotation}
                                onClick={() => {
                                    const summary = characterRuntimeStates?.[charId]?.teamRotationSummary;
                                    if (!summary || Math.round(summary?.total?.avg ?? 0) === 0) return;

                                    const newEntry = {
                                        id: Date.now(),
                                        charId: charId,
                                        entries: rotationEntries,
                                        name: summary.name ?? characterRuntimeStates?.[charId]?.Name,
                                        total: summary.total,
                                        fullCharacterState: characterRuntimeStates?.[charId] ?? {}
                                    };
                                    setSavedTeamRotations(prev => [...prev, newEntry]);

                                    setPopupMessage({
                                        message: 'Added to team saves~! (〜^∇^)〜',
                                        icon: '✔',
                                        color: 'limegreen'
                                    });
                                    setShowToast(true);
                                }}
                            >
                                +
                            </button>
                        )}
                    </div>
                    <div className="saved-rotation-list team">
                        {(() => {
                            const summaries = [...savedTeamRotations]
                                .filter(entry => {
                                    const charId = String(entry.charId);
                                    return (
                                        teamFilterCharId.length === 0 ||
                                        teamFilterCharId.includes(charId)
                                    );
                                })
                                .sort((a, b) => {
                                    let valA, valB;

                                    switch (sortKey) {
                                        case 'name':
                                            valA = a.name?.toLowerCase() ?? '';
                                            valB = b.name?.toLowerCase() ?? '';
                                            break;
                                        case 'dmg':
                                            valA = a.total?.avg ?? 0;
                                            valB = b.total?.avg ?? 0;
                                            break;
                                        case 'date':
                                        default:
                                            valA = a.id;
                                            valB = b.id;
                                    }

                                    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
                                    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
                                    return 0;
                                });

                            if (summaries.length === 0) {
                                return <p style={{ color: '#5c5c5c' }}>hmm...</p>;
                            }

                            return summaries.map(({ charId, name, total, id, fullCharacterState, entries }) => (
                                <div key={id} className="rotation-item-wrapper">
                                    <div className="rotation-item">
                                        <div className="rotation-header">
                                            {editingId === id ? (
                                                <input
                                                    className="entry-name-edit"
                                                    value={editedName}
                                                    onChange={(e) => setEditedName(e.target.value)}
                                                    onBlur={() => {
                                                        setSavedTeamRotations(prev =>
                                                            prev.map(entry =>
                                                                entry.id === editingId ? { ...entry, name: editedName } : entry
                                                            )
                                                        );
                                                        setEditingId(null);
                                                    }}
                                                    autoFocus
                                                />
                                            ) : (
                                                <span className="highlight">{name}</span>
                                            )}
                                            <span className="entry-type-detail">
                                                {/*<span className="entry-detail-text">{characterRuntimeStates[charId]?.Name}'s team</span>*/}
                                                <span className="entry-detail-text">
                                                        {new Date(id).toLocaleDateString(undefined, {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric'
                                                        })}
                                                    </span>
                                            </span>
                                        </div>

                                        <div className="rotation-values">
                                            <span className="value-label">Normal</span>
                                            <span className="value">{Math.round(total.normal).toLocaleString()}</span>
                                            <span className="value-label">Crit</span>
                                            <span className="value">{Math.round(total.crit).toLocaleString()}</span>
                                            <span className="value-label">Avg</span>
                                            <span className="value avg" style={{ fontWeight: 'bold' }}>
                                                    {Math.round(total.avg).toLocaleString()}
                                                </span>
                                            <button
                                                className="rotation-button load-button"
                                                title="Load Rotation"
                                                onClick={() => loadSavedRotation({ charId, fullCharacterState, entries })}
                                                style={{ marginLeft: 'auto' }}
                                            >
                                                Load
                                            </button>

                                            <button
                                                className="rotation-button"
                                                title="Export Rotation"
                                                onClick={() => {exportRotationEntries(name, fullCharacterState)}}
                                            >
                                                Export
                                            </button>

                                        </div>
                                    </div>
                                    <div className="rotation-actions external-actions">
                                        <button
                                            className="rotation-button"
                                            title="Edit Name"
                                            onClick={() => {
                                                setEditingId(id);
                                                setEditedName(name ?? '');
                                            }}
                                        >
                                            <Pencil size={18} />
                                        </button>
                                        <button
                                            className="rotation-button"
                                            title="Delete"
                                            onClick={() =>
                                                setSavedTeamRotations(prev =>
                                                    prev.filter(entry => entry.id !== id)
                                                )
                                            }
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ));
                        })()}
                    </div>
                </>
            )}

            {showToast && popupMessage.message && (
                <NotificationToast
                    message={popupMessage.message}
                    icon={popupMessage.icon}
                    color={popupMessage.color}
                    duration={popupMessage.duration ?? 4000}
                    prompt={popupMessage.prompt ?? null}
                    onClose={
                        popupMessage.onClose
                            ? popupMessage.onClose
                            : () => setTimeout(() => setShowToast(false), 300)
                    }
                    position="top"
                    bold
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
                    currentSliderColor={currentSliderColor}
                />
            )}

            <PlainModal
                modalOpen={modalOpen}
                setModalOpen={setModalOpen}
                width="700px"
                className="rotation-block-preview"
            >
                <div className="block-preview-header" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginTop: '0.5rem' }}>
                    {isEditingBlockName ? (
                        <input
                            type="text"
                            value={editedBlockName}
                            onChange={(e) => setEditedBlockName(e.target.value)}
                            onBlur={() => {
                                setRotationEntries(prev =>
                                    prev.map(e =>
                                        e.id === editingBlock.id
                                            ? { ...e, label: editedBlockName || "New Block" }
                                            : e
                                    )
                                );
                                setIsEditingBlockName(false);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    setRotationEntries(prev =>
                                        prev.map(b =>
                                            b.id === editingBlock.id
                                                ? { ...b, label: editedBlockName || 'New Block' }
                                                : b
                                        )
                                    );
                                    setIsEditingBlockName(false);
                                } else if (e.key === 'Escape') {
                                    setEditedName(editingBlock.label ?? 'New Block');
                                    setIsEditingBlockName(false);
                                }
                            }}
                            autoFocus
                            className="entry-name-edit preset-name-edit"
                        />
                    ) : (
                        <h2
                            onClick={() => setIsEditingBlockName(true)}
                            style={{
                                cursor: "text",
                                fontWeight: "bold",
                                margin: 'unset'
                            }}
                        >
                            {editingBlock?.label || "New Block"}
                        </h2>
                    )}
                    <div
                        style={{ marginLeft: 'auto', marginBottom: 'unset', display: 'flex', flexDirection: 'row', gap: '0.75rem' }}
                    >
                        <div className="rotation-multiplier-inline">
                            <label style={{ fontSize: '1rem' }}>×</label>
                            <input
                                type="number"
                                min="1"
                                max="99"
                                className="character-level-input"
                                value={editingBlock?.multiplier}
                                onChange={(e) => handleBlockMultiplierChange(editingBlock.id, parseFloat(e.target.value) || 1)}
                                style={{ width: '4rem', fontSize: '1rem', marginLeft: '0.25rem', textAlign: 'right' }}
                            />
                        </div>
                        <button
                            className="btn-primary echoes"
                            onClick={() => {
                                setEditedBlockName(editingBlock.label ?? "New Block");
                                setIsEditingBlockName(true);
                            }}
                        >
                            Edit Name
                        </button>
                        <button
                            className="rotation-button clear echoes"
                            onClick={() => {
                                setRotationEntries(prev => {
                                    if (Array.isArray(editingBlock.entries)) {
                                        const subIds = new Set(editingBlock.entries.map(e => e.id));
                                        return prev.filter(e => !subIds.has(e.id) && e.id !== editingBlock.id);
                                    }
                                });
                                setModalOpen(false);
                            }}
                        >
                            Delete
                        </button>
                    </div>
                </div>
                {(() => {
                    let entriesToShow = normalizedEntries;

                    if (editingBlock && Array.isArray(editingBlock.entries)) {
                        entriesToShow = editingBlock.entries
                            .map(ref => rotationEntries.find(e => e.id === ref.id))
                            .filter(Boolean);
                    }
                    return (
                        <div className="block-entries-list echo-buff">
                            {entriesToShow.length > 0 ? (
                                <>
                                    {entriesToShow
                                        .filter(entry => {
                                            const match = allSkillResults.find(
                                                s => s.name === entry.label && s.tab === entry.tab
                                            );
                                            return match?.visible !== false && entry.blockId;
                                        })
                                        .map((entry, idx) => (
                                            <RotationItem
                                                key={entry.id}
                                                id={entry.id}
                                                index={idx}
                                                entry={entry}
                                                setRotationEntries={setRotationEntries}
                                                allSkillResults={allSkillResults}
                                                currentSliderColor={currentSliderColor}
                                                onAddEntryToBlock={handleAddEntryToBlock}
                                                handleBlockMultiplierChange={handleBlockMultiplierChange}
                                                rotationEntries={rotationEntries}
                                                onDelete={(entry) => {
                                                    setRotationEntries(prev => {
                                                        if (!entry) return prev;
                                                        let updated = prev.filter(e => e.id !== entry.id);
                                                        updated = updated.map(block => {
                                                            if (block.id === entry.blockId && Array.isArray(block.entries)) {
                                                                return {
                                                                    ...block,
                                                                    entries: block.entries.filter(sub => sub.id !== entry.id),
                                                                };
                                                            }
                                                            return block;
                                                        });
                                                        return updated;
                                                    });
                                                }}
                                                onEdit={(entry) => {
                                                    setEditingEntry(entry);
                                                    setShowSkillOptions(true);
                                                }}
                                                onHideEntries={(entry) => {
                                                    setRotationEntries(prev =>
                                                        prev.map(e =>
                                                            e.id === entry.id
                                                                ? { ...e, hideEntries: !Boolean(e.hideEntries) }
                                                                : e
                                                        )
                                                    );
                                                }}
                                                onMultiplierChange={(i, val) => {
                                                    const updated = [...rotationEntries];
                                                    updated[i].multiplier = val;
                                                    setRotationEntries(updated);
                                                }}
                                                setModalOpen={setModalOpen}
                                                blockPreviewMode={true}
                                                removeEntryFromBlock={() => removeEntryFromBlock(entry.id, editingBlockId)}
                                            />
                                        ))}
                                </>
                            ) : (
                                <span className="empty-message" style={{ alignSelf: 'center', justifySelf: 'center' }}>Empty...</span>
                            )}

                        </div>
                    );
                })()}
            </PlainModal>
        </div>
    );
}

function RotationDndWrapper({
                                sensors,
                                rotationEntries,
                                setRotationEntries,
                                normalizedEntries,
                                allSkillResults,
                                currentSliderColor,
                                handleAddEntryToBlock,
                                handleBlockMultiplierChange,
                                setShowSkillOptions,
                                setEditingEntry,
                                setModalOpen,
                                setEditingBlockId,
                                removeEntryFromBlock
                            }) {
    const [draggedId, setDraggedId] = useState(null);
    const [draggedItem, setDraggedItem] = useState(null);
    const [overBlockId, setOverBlockId] = useState(null);
    const isBlockDragged = draggedItem?.type === "block";

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={iosLikeCollision}
            modifiers={[restrictToFirstScrollableAncestor]}
            onDragEnd={({ active, over }) => {
                if (!over) return;
                const activeId = active.id;
                const overId = over.id || over.data?.current?.blockId;
                const fromBlockId = active.data?.current?.fromBlockId;
                if (activeId === overId) return;
                setRotationEntries(prev => {
                    const draggedItem = prev.find(i => i.id === activeId);
                    const overBlock = over?.data?.current?.type === "block"
                        ? prev.find(b => b.id === over.data.current.blockId)
                        : null;
                    if (draggedItem?.type === "block" && overBlock) return prev;
                    let updated = [...prev];
                    if (overBlock) {
                        const blockId = overBlock.id;
                        const blockMultiplier = overBlock.multiplier ?? 1;
                        if (fromBlockId && fromBlockId !== blockId) {
                            updated = updated.map(item =>
                                item.id === fromBlockId
                                    ? { ...item, entries: item.entries?.filter(ref => ref.id !== activeId) ?? [] }
                                    : item
                            );
                        }
                        updated = updated.map(item => {
                            if (item.id === activeId) {
                                const oldBlock = prev.find(b => b.id === fromBlockId);
                                const oldMult = oldBlock?.multiplier ?? 1;
                                const baseMult =
                                    item.blockId && fromBlockId
                                        ? (item.multiplier ?? 1) / oldMult
                                        : (item.multiplier ?? 1);
                                const newMultiplier = baseMult * blockMultiplier;
                                return {
                                    ...item,
                                    blockId,
                                    multiplier: newMultiplier,
                                };
                            }
                            if (item.id === blockId) {
                                const alreadyIn = item.entries?.some(ref => ref.id === activeId);
                                if (alreadyIn) return item;
                                return {
                                    ...item,
                                    entries: [...(item.entries ?? []), { id: activeId }],
                                };
                            }
                            return item;
                        });
                        return updated;
                    }
                    if (fromBlockId && (!over || over.data?.current?.type !== "block")) {
                        const oldBlock = prev.find(b => b.id === fromBlockId);
                        const blockMultiplier = oldBlock?.multiplier ?? 1;
                        updated = updated.map(entry => {
                            if (entry.id === activeId) {
                                const newMultiplier = (entry.multiplier ?? 1) / blockMultiplier;
                                return {
                                    ...entry,
                                    blockId: null,
                                    multiplier: newMultiplier,
                                };
                            }
                            if (entry.id === fromBlockId) {
                                return {
                                    ...entry,
                                    entries: entry.entries?.filter(ref => ref.id !== activeId) ?? [],
                                };
                            }
                            return entry;
                        });
                        return updated;
                    }
                    const oldIndex = normalizedEntries.findIndex(e => e.id === activeId);
                    const newIndex = normalizedEntries.findIndex(e => e.id === over.id);
                    if (oldIndex !== -1 && newIndex !== -1) {
                        updated = arrayMove(updated, oldIndex, newIndex);
                    }
                    return updated;
                });
            }}
        >
            <InnerDndMonitor
                setDraggedId={setDraggedId}
                setDraggedItem={setDraggedItem}
                setOverBlockId={setOverBlockId}
                rotationEntries={rotationEntries}
            />

            <SortableContext
                items={normalizedEntries.map(e => e.id)}
                strategy={verticalListSortingStrategy}
            >
                {normalizedEntries
                    .filter(entry => {
                        const match = allSkillResults.find(
                            s => s.name === entry.label && s.tab === entry.tab
                        );
                        return match?.visible !== false && !entry.blockId;
                    })
                    .map((entry, idx) => (
                        <RotationItem
                            key={entry.id}
                            id={entry.id}
                            index={idx}
                            entry={entry}
                            setRotationEntries={setRotationEntries}
                            allSkillResults={allSkillResults}
                            currentSliderColor={currentSliderColor}
                            onAddEntryToBlock={handleAddEntryToBlock}
                            handleBlockMultiplierChange={handleBlockMultiplierChange}
                            rotationEntries={rotationEntries}
                            draggedId={draggedId}
                            overBlockId={overBlockId}
                            onDelete={(entry) => {
                                setRotationEntries(prev => {
                                    if (!entry) return prev;
                                    if (entry.type === 'block' && Array.isArray(entry.entries)) {
                                        const subIds = new Set(entry.entries.map(e => e.id));
                                        return prev.filter(e => !subIds.has(e.id) && e.id !== entry.id);
                                    }
                                    return prev.filter(e => e.id !== entry.id);
                                });
                            }}
                            onEdit={(entry) => {
                                if (entry.type === 'block') {
                                    setEditingBlockId(entry.id);
                                    setModalOpen(true);
                                    return;
                                }
                                setEditingEntry(entry);
                                setShowSkillOptions(true);
                            }}
                            onHideEntries={(entry) => {
                                setRotationEntries(prev =>
                                    prev.map(e =>
                                        e.id === entry.id
                                            ? { ...e, hideEntries: !Boolean(e.hideEntries) }
                                            : e
                                    )
                                );
                            }}
                            onMultiplierChange={(entry, val) => {
                                setRotationEntries(prev =>
                                    prev.map(e =>
                                        e.id === entry.id
                                            ? { ...e, multiplier: val }
                                            : e
                                    )
                                );
                            }}
                        />
                    ))}
            </SortableContext>
            {!isBlockDragged && (
                <DragOverlay>
                    {draggedItem ? (
                        <div
                            className={`rotation-item-overlay ${overBlockId ? "over-block" : ""}`}
                            style={{
                                opacity: overBlockId ? 0.4 : 1,
                                transform: `scale(${overBlockId ? 0.75 : 1})`,
                                filter: overBlockId ? "blur(1px)" : "none",
                                transition: "transform 0.3s ease, opacity 0.3s ease, filter 0.3s ease",
                                zIndex: 9999,
                            }}
                        >
                            <BlockSubItem
                                key={`ghost-${draggedId}`}
                                subRef={{ id: draggedId }}
                                entryId={draggedItem.id}
                                rotationEntries={rotationEntries}
                                allSkillResults={allSkillResults}
                                currentSliderColor={currentSliderColor}
                                entry={draggedItem}
                                isGhostPreview={true}
                                overBlockId={overBlockId}
                            />
                        </div>
                    ) : null}
                </DragOverlay>
            )}
            <GlobalDragCursor />
        </DndContext>
    );
}

function InnerDndMonitor({ setDraggedId, setDraggedItem, setOverBlockId, rotationEntries }) {
    useDndMonitor({
        onDragStart: ({ active }) => {
            setDraggedId(active.id);
            setDraggedItem(rotationEntries.find(e => e.id === active.id) || null);
        },
        onDragOver: ({ over }) => {
            if (over?.data?.current?.type === 'block') {
                setOverBlockId(over.data.current.blockId);
            } else {
                setOverBlockId(null);
            }
        },
        onDragEnd: () => {
            setDraggedId(null);
            setDraggedItem(null);
            setOverBlockId(null);
        },
    });
    return null;
}

function iosLikeCollision(args) {
    const pointer = pointerWithin(args);
    if (pointer.length > 0) return pointer;
    return closestCenter(args);
}

function GlobalDragCursor() {
    useDndMonitor({
        onDragStart: () => {
            document.body.style.cursor = 'grabbing';
        },
        onDragEnd: () => {
            document.body.style.cursor = '';
        },
        onDragCancel: () => {
            document.body.style.cursor = '';
        },
    });
    return null;
}
