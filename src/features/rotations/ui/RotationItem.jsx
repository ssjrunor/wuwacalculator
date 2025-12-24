import React, {useEffect, useMemo, useState} from 'react';
import {Eye, EyeClosed, Lock, LockOpen, Pencil, Trash2, Power, PowerOff} from 'lucide-react';
import {useSortable} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import {attributeColors} from "@/utils/attributeHelpers.js";
import {useDraggable, useDroppable} from '@dnd-kit/core';

export default function RotationItem({
                                         id,
                                         index,
                                         entry,
                                         onMultiplierChange,
                                         onEdit,
                                         onDelete,
                                         setRotationEntries,
                                         currentSliderColor,
                                         allSkillResults,
                                         handleBlockMultiplierChange,
                                         rotationEntries,
                                         overBlockId,
                                         draggedId,
                                         onHideEntries,
                                         blockPreviewMode,
                                         removeEntryFromBlock = null
                             }) {
    const isBeingDragged = draggedId === id;

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString({
            ...transform,
            scaleX: 1,
            scaleY: 1,
        }),
        transition,
    };

    const itemType = entry?.type === 'block' ? 'block' : 'skill';

    const multiplier = entry.multiplier ?? 1;
    const match = allSkillResults.find(s => s.name === entry.label && s.tab === entry.tab);
    let normal = 0;
    let crit = 0;
    let avg = 0;
    let heal = 0;
    let shield = 0;

    if (entry.entries && entry.entries.length > 0) {
        for (const subRef of entry.entries) {
            const subEntry = rotationEntries.find(e => e.id === subRef.id);
            if (!subEntry) continue;

            const match = allSkillResults.find(
                s => s.name === subEntry.label && s.tab === subEntry.tab
            );

            const multiplier = subEntry.multiplier ?? 1;

            const source = subEntry.locked && subEntry.snapshot
                ? subEntry.snapshot
                : {
                    normal: match?.normal ?? 0,
                    crit: match?.crit ?? 0,
                    avg: match?.avg ?? 0
                };

            const scaledAvg = source.avg * multiplier;
            normal += source.normal * multiplier;
            crit += source.crit * multiplier;
            avg += scaledAvg;
            if (subEntry.detail === "Healing") {
                heal += scaledAvg;
            } else if (subEntry.detail === "Shielding") {
                shield += scaledAvg;
            }
        }
    } else {
        const match = allSkillResults.find(
            s => s.name === entry.label && s.tab === entry.tab
        );

        const multiplier = entry.multiplier ?? 1;

        const source = entry.locked && entry.snapshot
            ? entry.snapshot
            : {
                normal: match?.normal ?? 0,
                crit: match?.crit ?? 0,
                avg: match?.avg ?? 0
            };

        const scaledAvg = source.avg * multiplier;

        normal = source.normal * multiplier;
        crit = source.crit * multiplier;
        avg = scaledAvg;
    }

    const toggleLock = (entry) => {
        setRotationEntries(prev => {
            const copy = [...prev];
            const idx = copy.findIndex(e => e.id === entry.id);
            if (idx === -1) return prev;

            const item = copy[idx];
            const locked = !item.locked;

            const match = allSkillResults.find(
                s => s.name === item.label && s.tab === item.tab
            );

            copy[idx] = {
                ...item,
                locked,
                snapshot: locked && match
                    ? {
                        avg: match.avg,
                        crit: match.crit,
                        normal: match.normal,
                        tab: item.tab,
                        label: item.label,
                        isSupportSkill: match.isSupportSkill,
                        supportColor: match.supportColor,
                        element: match.element
                    }
                    : undefined
            };

            return copy;
        });
    };

    const toggleDisabled = (entry) => {
        setRotationEntries(prev => {
            return prev.map(e =>
                e.id === entry.id
                    ? { ...e, disabled: !Boolean(e.disabled) }
                    : e
            );
        });
    };

    if (itemType === 'skill') return (
        <RotationSkillItem
            index={index}
            entry={entry}
            onMultiplierChange={onMultiplierChange}
            onEdit={onEdit}
            onDelete={onDelete}
            currentSliderColor={currentSliderColor}
            style={style}
            normal={normal}
            crit={crit}
            avg={avg}
            attributes={attributes}
            listeners={listeners}
            setNodeRef={setNodeRef}
            toggleLock={toggleLock}
            match={match}
            multiplier={multiplier}
            isBeingDragged={isBeingDragged}
            blockPreviewMode={blockPreviewMode}
            removeEntryFromBlock={removeEntryFromBlock}
            toggleDisabled={toggleDisabled}
        />
    );
    else if (itemType === 'block') return (
        <RotationBlockItem
            currentSliderColor={currentSliderColor}
            setRotationEntries={setRotationEntries}
            onDelete={onDelete}
            entry={entry}
            style={style}
            attributes={attributes}
            listeners={listeners}
            setNodeRef={setNodeRef}
            handleBlockMultiplierChange={handleBlockMultiplierChange}
            allSkillResults={allSkillResults}
            normal={normal}
            crit={crit}
            avg={avg}
            shield={shield}
            heal={heal}
            rotationEntries={rotationEntries}
            draggedId={draggedId}
            overBlockId={overBlockId}
            onHideEntries={onHideEntries}
            onEdit={onEdit}
        />
    );
}

function RotationBlockItem ({
                                currentSliderColor,
                                onDelete,
                                setRotationEntries,
                                entry,
                                handleBlockMultiplierChange,
                                allSkillResults,
                                normal,
                                crit,
                                avg,
                                heal,
                                shield,
                                attributes,
                                listeners,
                                setNodeRef,
                                style,
                                rotationEntries,
                                overBlockId,
                                draggedId,
                                onHideEntries,
                                onEdit
                            }) {
    const isBlockDragged =
        draggedId && rotationEntries.find(e => e.id === draggedId)?.type === "block";
    const { setNodeRef: setDropRef, isOver } = useDroppable({
        id: `block-drop-${entry.id}`,
        disabled: isBlockDragged,
        data: { type: 'block', blockId: entry.id },
    });
    const shouldShowDropEffect = isOver && !isBlockDragged;
    const multiplier = entry.multiplier ?? 1;

    const [shouldHide, setShouldHide] = React.useState(true);
    const [shouldSHow, setShouldShow] = React.useState(true);

    useEffect(() => {
        if (entry.entries.length >= 5 && !entry.hideEntries && shouldHide) {
            onHideEntries(entry);
            setShouldHide(false);
        }
        if (entry.entries.length < 5 && entry.hideEntries && shouldSHow) {
            onHideEntries(entry);
            setShouldShow(false);
        }
    }, [entry.entries.length]);

    const toggleLockAllEntriesInBlock = (block) => {
        if (!block?.entries?.length) return;
        setRotationEntries(prev => {
            const allLocked = block.entries.every(ref => {
                const sub = prev.find(e => e.id === ref.id);
                return sub?.locked;
            });
            return prev.map(entry => {
                if (entry.id === block.id) return entry;
                const isInBlock = block.entries.some(ref => ref.id === entry.id);
                if (!isInBlock) return entry;
                const match = allSkillResults.find(
                    s => s.name === entry.label && s.tab === entry.tab
                );

                if (allLocked) {
                    return { ...entry, locked: false, snapshot: undefined };
                } else {
                    return {
                        ...entry,
                        locked: true,
                        snapshot: match
                            ? {
                                avg: match.avg,
                                crit: match.crit,
                                normal: match.normal,
                                tab: entry.tab,
                                label: entry.label,
                                isSupportSkill: match.isSupportSkill,
                                supportColor: match.supportColor,
                                element: match.element,
                            }
                            : undefined,
                    };
                }
            });
        });
    };

    const allLocked = useMemo(() => {
        if (!entry?.entries?.length) return false;
        return entry.entries.every(ref => {
            const sub = rotationEntries.find(e => e.id === ref.id);
            return sub?.locked;
        });
    }, [entry?.entries, rotationEntries]);

    useEffect(() => {
        if (!entry) return;
        setRotationEntries(prev =>
            prev.map(e =>
                e.id === entry.id ? { ...e, allLocked } : e
            )
        );
    }, [allLocked]);

    const toggleDisabledAllEntriesInBlock = (block) => {
        if (!block?.entries?.length) return;
        setRotationEntries(prev => {
            const allDisabled = block.entries.every(ref => {
                const sub = prev.find(e => e.id === ref.id);
                return sub?.disabled;
            });
            const newDisabledState = !allDisabled;

            return prev.map(entry => {
                if (entry.id === block.id) {
                    return {
                        ...entry,
                        entries: block.entries.map(ref => ({ id: ref.id })),
                    };
                }
                const isInBlock = block.entries.some(ref => ref.id === entry.id);
                if (isInBlock) {
                    return {
                        ...entry,
                        disabled: newDisabledState,
                    };
                }
                return entry;
            });
        });
    };

    const [allDisabled, setAllDisabled] = useState(false);

    useEffect(() => {
        if (!entry?.entries?.length) return;
        const refs = entry.entries.map(ref => ref.id);
        const disabledStates = rotationEntries
            .filter(e => refs.includes(e.id))
            .map(e => e.disabled);
        setAllDisabled(disabledStates.every(Boolean));
    }, [rotationEntries, entry]);

    return (
        <div
            ref={setNodeRef}
            style={{ ...style, pointerEvents: 'auto' }}
            {...attributes}
            {...listeners}
            className={`rotation-block-wrapper ${isOver ? 'hovered' : ''} ${allDisabled ? 'disabled' : ''}`}
        >
            <div className={`rotation-item rotation-block ${entry.hideEntries ? 'brief' : 'not-brief'} ${allLocked ? 'locked' : ''}`}
                 style={{
                     pointerEvents: 'auto',
                     touchAction: 'none',
                 }}>
                <div className="block-header">
                    <h4 className="highlight">{entry.label}
                        {multiplier > 1 ? ` (x${multiplier})` : ''}
                    </h4>

                    {entry.entries.length > 0 && (
                        <>
                            <div
                                className="block-icon-button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleLockAllEntriesInBlock(entry);
                                }}
                            >
                                <LockOpen
                                    className={`block-icon lock-open ${allLocked ? "hidden" : "visible"}`}
                                    size={17}
                                />
                                <Lock
                                    className={`block-icon lock-closed ${allLocked ? "visible" : "hidden"}`}
                                    size={17}
                                />
                            </div>
                            <div
                                className="block-icon-button power"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleDisabledAllEntriesInBlock(entry);
                                }}
                            >
                                <Power
                                    className={`block-icon lock-open ${allDisabled ? "hidden" : "visible"}`}
                                    size={17}
                                />
                                <PowerOff
                                    className={`block-icon lock-closed ${allDisabled ? "visible" : "hidden"}`}
                                    size={17}
                                />
                            </div>
                            <div
                                className="block-icon-button"
                                onClick={() => onHideEntries(entry)}
                            >
                                <Eye
                                    className={`block-icon eye-open ${entry.hideEntries ? "hidden" : "visible"}`}
                                    size={20}
                                />
                                <EyeClosed
                                    className={`block-icon eye-closed ${entry.hideEntries ? "visible" : "hidden"}`}
                                    size={20}
                                />
                            </div>
                        </>
                    )}

                    <div className="rotation-multiplier-inline" onClick={(e) => e.stopPropagation()}>
                        <label style={{ fontSize: '13px' }}>×</label>
                        <input
                            type="number"
                            min="1"
                            max="99"
                            className="character-level-input"
                            value={multiplier}
                            onChange={(e) => handleBlockMultiplierChange(entry.id, parseFloat(e.target.value) || 1)}
                            style={{ width: '40px', fontSize: '13px', marginLeft: '4px', textAlign: 'right' }}
                        />
                    </div>
                </div>
                <div
                    className={`block-body echo-buff ${shouldShowDropEffect && isOver ? 'drag-over' : ''} ${entry.hideEntries ? 'collapsed' : 'expanded'}`}
                    ref={setDropRef}
                >
                    {!entry.hideEntries ? (
                        <>
                            {entry.entries?.map(subRef => (
                                <BlockSubItem
                                    key={subRef.id}
                                    subRef={subRef}
                                    entryId={entry.id}
                                    rotationEntries={rotationEntries}
                                    allSkillResults={allSkillResults}
                                    currentSliderColor={currentSliderColor}
                                    entry={entry}
                                    overBlockId={overBlockId}
                                />
                            ))}
                            {shouldShowDropEffect && overBlockId === entry.id && draggedId && (
                                <div className="block-drop-placeholder">
                                    <BlockSubItem
                                        key={`ghost-${draggedId}`}
                                        subRef={{ id: draggedId }}
                                        entryId={entry.id}
                                        rotationEntries={rotationEntries}
                                        allSkillResults={allSkillResults}
                                        currentSliderColor={currentSliderColor}
                                        entry={entry}
                                        isGhostPreview={true}
                                        overBlockId={overBlockId}
                                    />
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="rotation-item"
                        style={{ pointerEvents: 'none' }}>
                            <div className="rotation-header">
                                <span
                                    className="entry-name"
                                >
                                    {entry.entries.length} hidden item{entry.entries.length > 1 ? 's' : ''}
                                </span>

                                <div className="block-mini-value">
                                    <div className="block-footer rotation-values">
                                        {(normal !== 0 && avg !== 0 && crit !== 0) && (
                                            <div className="value-cell">
                                                <span className="value-label">Normal</span>
                                                <span className="value">{Math.round(normal).toLocaleString()}</span>
                                                <span className="value-label">Crit</span>
                                                <span className="value">{Math.round(crit).toLocaleString()}</span>
                                                <span className="value-label">Avg</span>
                                                <span className="value avg">{Math.round(avg).toLocaleString()}</span>
                                            </div>
                                        )}

                                        {(heal !== 0) && (
                                            <div className="value-cell">
                                                <span className="value-label" style={{ color: 'limegreen', fontWeight: 'bold' }}>Healing</span>
                                                <span className="value avg" style={{ color: 'limegreen', fontWeight: 'bold' }}>
                                                    {Math.round(heal).toLocaleString()}</span>
                                            </div>
                                        )}
                                        {(shield !== 0) && (
                                            <div className="value-cell">
                                                <span className="value-label" style={{ color: '#838383', fontWeight: 'bold' }}>Shield</span>
                                                <span className="value avg" style={{ color: '#838383', fontWeight: 'bold' }}>
                                                    {Math.round(shield).toLocaleString()}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                {!entry.hideEntries && (
                    <div className="block-footer rotation-values">
                        {(normal !== 0 && avg !== 0 && crit !== 0) && (
                            <>
                                <div className="value-cell">
                                    <span className="value-label">Normal</span> -
                                    <span className="value">{Math.round(normal).toLocaleString()}</span>
                                </div>
                                <div className="value-cell">
                                    <span className="value-label">Crit</span> -
                                    <span className="value">{Math.round(crit).toLocaleString()}</span>
                                </div>
                                <div className="value-cell">
                                    <span className="value-label">Avg</span> -
                                    <span className="value avg">{Math.round(avg).toLocaleString()}</span>
                                </div>
                            </>
                        )}

                        {(heal !== 0) && (
                            <div className="value-cell">
                                <span className="value-label" style={{ color: 'limegreen', fontWeight: 'bold' }}>Healing</span>
                                <span style={{ color: 'limegreen', fontWeight: 'bold' }}>-</span>
                                <span className="value avg" style={{ color: 'limegreen', fontWeight: 'bold' }}>
                                    {Math.round(heal).toLocaleString()}</span>
                            </div>
                        )}
                        {(shield !== 0) && (
                            <div className="value-cell">
                                <span className="value-label" style={{ color: '#838383', fontWeight: 'bold' }}>Shield</span>
                                <span style={{ color: '#838383', fontWeight: 'bold' }}>-</span>
                                <span className="value avg" style={{ color: '#838383', fontWeight: 'bold' }}>
                                    {Math.round(shield).toLocaleString()}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <div className="rotation-actions external-actions" onClick={(e) => e.stopPropagation()}>
                <button className="rotation-button" title="Edit" onClick={() => onEdit(entry)} disabled={allDisabled}
                        style={{ pointerEvents: allDisabled ? 'none' : 'auto' }}>
                    <Pencil size={18} />
                </button>
                <button className="rotation-button" title="Delete" onClick={() => onDelete(entry)} disabled={allDisabled}
                        style={{ pointerEvents: allDisabled ? 'none' : 'auto' }}>
                    <Trash2 size={18} />
                </button>
            </div>
        </div>
    );
}

export function BlockSubItem({
                          subRef,
                          entryId,
                          rotationEntries,
                          allSkillResults,
                          currentSliderColor,
                          entry,
                          isGhostPreview = false,
                          overBlockId
                      }) {
    const subEntry = rotationEntries.find(e => e.id === subRef.id);

    if (!subEntry) return null;

    const dragProps = isGhostPreview
        ? { setNodeRef: null, listeners: {}, attributes: {}, transform: null, transition: null, isDragging: false }
        : useDraggable({
            id: subEntry.id,
            data: { type: "skill", fromBlockId: entryId },
        });

    const { setNodeRef, listeners, attributes, transform, transition, isDragging } = dragProps;
    const isDraggingOut = isDragging && !overBlockId;
    const shouldHideOriginal = isDraggingOut || isDragging;
    const isDraggingIntoBlock = isDragging && overBlockId;

    const style = {
        transform: shouldHideOriginal ? 'none' : transform ? CSS.Transform.toString(transform) : undefined,
        opacity: isGhostPreview ? 0.5 : 1,
        transition: isDragging ? 'none' : transition,
        pointerEvents: isGhostPreview ? 'none' : undefined,
    };

    const match = allSkillResults.find(
        s => s.name === subEntry.label && s.tab === subEntry.tab
    );

    const multiplier = (subEntry.multiplier ?? 1) / (entry.multiplier ?? 1);
    const source = match
        ? {
            normal: match.normal ?? 0,
            crit: match.crit ?? 0,
            avg: match.avg ?? 0,
        }
        : { normal: 0, crit: 0, avg: 0 };

    const normal = source.normal * multiplier;
    const crit = source.crit * multiplier;
    const avg = source.avg * multiplier;

    if (!subEntry) return null;

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            style={{
                ...style,
                opacity: isDraggingOut ? 0.5 : style.opacity,
                transform: isDraggingOut ? 'scale(1.05)' : style.transform,
                visibility: shouldHideOriginal ? 'hidden' : 'visible',
            }}
            className="rotation-item"
        >
            <div className="rotation-header">
                <span
                    className="entry-name"
                    style={{
                        color: match?.isSupportSkill
                            ? match.supportColor ?? currentSliderColor
                            : attributeColors[subEntry.element] ?? currentSliderColor,
                    }}
                >
                    {subEntry.label}
                    {multiplier > 1 ? ` (x${multiplier})` : ""}
                </span>

                <div className="block-mini-value">
                    <div className="block-footer rotation-values">
                        {match?.isSupportSkill ? (
                            <>
                                <span
                                    className="value-label"
                                    style={{ color: match.supportColor, fontWeight: "bold" }}
                                >
                                  {match.supportLabel}
                                </span>
                                <span></span>
                                <span></span>
                                <span
                                    className="value avg"
                                    style={{ color: match.supportColor, fontWeight: "bold" }}
                                >
                                  {Math.round(avg)}
                                </span>
                            </>
                        ) : (
                            <>
                                <span className="value-label">Normal</span>
                                <span className="value">{Math.round(normal).toLocaleString()}</span>
                                <span className="value-label">Crit</span>
                                <span className="value">{Math.round(crit).toLocaleString()}</span>
                                <span className="value-label">Avg</span>
                                <span className="value avg">{Math.round(avg).toLocaleString()}</span>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function RotationSkillItem ({
                                index,
                                entry,
                                onMultiplierChange,
                                onEdit,
                                onDelete,
                                currentSliderColor,
                                style,
                                normal,
                                crit,
                                avg,
                                attributes,
                                listeners,
                                setNodeRef,
                                toggleLock,
                                match,
                                multiplier,
                                isBeingDragged,
                                blockPreviewMode,
                                removeEntryFromBlock,
                                toggleDisabled
                            }) {
    return (
        <div
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            style={{
                ...style,
                opacity: isBeingDragged ? 0 : 1,
                transform: isBeingDragged ? 'scale(0.9)' : style.transform,
                transition: 'opacity 0.15s ease, transform 0.15s ease',
            }}

            className={`rotation-item-wrapper ${entry.locked ? 'locked' : ''} ${entry.disabled ? 'disabled' : ''}`}
        >
            {blockPreviewMode && (
                <button
                    className="remove-substat-button"
                    title="Remove"
                    style={{ fontSize: '2rem', padding: '0 0.5rem'}}
                    onClick={(e) => {
                        e.stopPropagation();
                        removeEntryFromBlock();
                    }}
                >
                    −
                </button>
            )}

            <div className={`rotation-item ${entry.locked ? 'locked' : ''}`}
            style={{ marginLeft: blockPreviewMode ? '0.5rem' : 'unset' }}>
                <div className="rotation-header">
                    <div style={{ display: 'flex', flexDirection: 'row' }}>
                        {match?.isSupportSkill ? (
                            <span
                                className="entry-name"
                                style={{
                                    color: match.supportColor ?? currentSliderColor,
                                }}
                            >
                            {entry.label}
                                {multiplier > 1 ? ` (x${multiplier})` : ''}
                        </span>
                        ) : (
                            <span
                                className="entry-name"
                                style={{
                                    color: attributeColors[entry.element] ?? currentSliderColor,
                                }}
                            >
                            {entry.label}
                                {multiplier > 1 ? ` (x${multiplier})` : ''}
                        </span>
                        )}
                        <div
                            className="block-icon-button"
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleLock(entry);
                            }}
                        >
                            <LockOpen
                                className={`block-icon lock-open ${entry.locked ? "hidden" : "visible"}`}
                                size={17}
                            />
                            <Lock
                                className={`block-icon lock-closed ${entry.locked ? "visible" : "hidden"}`}
                                size={17}
                            />
                        </div>
                        <div
                            className="block-icon-button power"
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleDisabled(entry);
                            }}
                        >
                            <Power
                                className={`block-icon lock-open ${entry.disabled ? "hidden" : "visible"}`}
                                size={17}
                            />
                            <PowerOff
                                className={`block-icon lock-closed ${entry.disabled ? "visible" : "hidden"}`}
                                size={17}
                            />
                        </div>
                    </div>

                    <span className="entry-type-detail">
                        {entry.iconPath && (
                            <img
                                src={entry.iconPath}
                                alt=""
                                className="skill-type-icon"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                }}
                                loading="lazy"
                            />
                        )}
                        <span className="entry-detail-text">{entry.detail}</span>
                    </span>
                </div>
                <div className="rotation-values">
                    {match?.isSupportSkill ? (
                        <div className="value-cell">
                            <span
                                className="value-label"
                                style={{
                                    color: match.supportColor,
                                    fontWeight: 'bold'
                                }}
                            >
                              {match.supportLabel}
                            </span>
                            <span style={{ color: match.supportColor, fontWeight: 'bold' }}>-</span>
                            <span className="value avg" style={{
                                color: match.supportColor,
                                fontWeight: 'bold'
                            }}>
                                {Math.round(avg)}
                            </span>
                        </div>
                    ) : (
                        <>
                            <div className="value-cell">
                                <span className="value-label">Normal</span> -
                                <span className="value">{Math.round(normal).toLocaleString()}</span>
                            </div>
                            <div className="value-cell">
                                <span className="value-label">Crit</span> -
                                <span className="value">{Math.round(crit).toLocaleString()}</span>
                            </div>
                            <div className="value-cell">
                                <span className="value-label">Avg</span> -
                                <span className="value avg">{Math.round(avg).toLocaleString()}</span>
                            </div>
                        </>

                    )}
                    <div className="rotation-multiplier-inline" onClick={(e) => e.stopPropagation()}>
                        <label style={{ fontSize: '13px' }}>×</label>
                        <input
                            type="number"
                            min="1"
                            max="99"
                            className="character-level-input"
                            value={multiplier}
                            disabled={blockPreviewMode}
                            onChange={(e) =>
                                onMultiplierChange(entry, parseInt(e.target.value) || 1)
                            }
                            style={{ width: '40px', fontSize: '13px', marginLeft: '4px', textAlign: 'right',
                            opacity: blockPreviewMode ? 0.7 : 1, cursor: blockPreviewMode ? 'not-allowed' : 'auto'}}
                        />
                    </div>
                </div>
            </div>
            <div className="rotation-actions external-actions" onClick={(e) => e.stopPropagation()}>
                <button className="rotation-button" title="Edit" onClick={() => onEdit(entry)}>
                    <Pencil size={18} />
                </button>
                <button className="rotation-button" title="Delete" onClick={() => onDelete(entry)}>
                    <Trash2 size={18} />
                </button>
            </div>
        </div>
    );
}