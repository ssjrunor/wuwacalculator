// AppStatusModal.jsx
import React, { useEffect, useState } from 'react';
import '../../styles/appStatusModal.css';

const data = {
    lastUpdated: '03-01-2026',
    overallState: 'stable', // 'stable' | 'degraded' | 'wip'
    overallColor: '#22c55e',
    patchVersion: '3.0',
    calculatorState: 'Fully updated for the current patch.',
    coverage: [
        {
            title: 'Note',
            desc: 'HELLO EVERYONE & HAPPY NEW YEAR!\nOptimizer runs are now much faster on GPU (single-skill jumps from ~40M combos/sec to ~900M on capable devices) and memory usage has been trimmed. Speed still depends on your hardware and the GPU path. Suggestions now include combo/rotation handling alongside the Randomizer’s home in the Suggestions tab. Also, Mornye should work correctly in the optimizer; Suggestions fix is still pending.',
        },
        {
            title: 'Character Coverage',
            desc: 'All characters updated for the current patch.',
        },
        {
            title: 'Weapon Coverage',
            desc: 'All weapons updated for the current patch.',
        },
        {
            title: 'Echoes Coverage',
            desc: 'All echoes and sonata sets supported, with icons updated through 3.0.',
        },
        {
            title: 'Echo Generator',
            desc: 'Fixed and updated. Generates full sets with set filters, main echo focus, and ER targets.',
        },
        {
            title: 'Icons & Assets',
            desc: 'All 3.0 icons and assets have been added.',
        },
    ],
    knownIssues: [
        "Mornye is fixed in the optimizer but still not working in Suggestions.",
        "That's kinda it tbh.",
    ],
    recentChanges: [
        "Optimizer GPU path now massively faster for single-skill runs (~900M combos/sec on capable GPUs) with memory optimizations.",
        "Suggestions now handle combo/rotation inputs alongside the Randomizer in the Suggestions tab.",
        "Mornye behaves correctly in the optimizer (Suggestions fix pending).",
    ],
};

export default function AppStatusModal({ open, onClose }) {
    const [isClosing, setIsClosing] = useState(false);

    // Pull everything from `data`
    const {
        lastUpdated,
        overallState,
        overallColor,
        patchVersion,
        calculatorState,
        coverage,
        knownIssues,
        recentChanges,
    } = data;

    useEffect(() => {
        if (open) setIsClosing(false);
    }, [open]);

    if (!open && !isClosing) return null;

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose?.();
            setIsClosing(false);
        }, 300);
    };

    const overallLabel =
        {
            stable: 'All systems nominal',
            degraded: 'Partially updated',
            wip: 'Work in progress',
        }[overallState] ?? overallState;

    return (
        <div
            className={`skills-modal-overlay ${isClosing ? 'closing' : ''}`}
            onClick={handleClose}
        >
            <div
                className={`skills-modal-content changelog-modal guides app-status-modal ${isClosing ? 'closing' : ''}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="app-status-heading">
                    <div>
                        <p className="eyebrow">Calculator Status</p>
                        <h2 className="highlight section-title" style={{ margin: 0 }}>
                            Current State
                        </h2>
                    </div>
                    <div className="status-meta">
                        <span className="status-pill success">
                            <span
                                className="status-dot"
                                style={{ background: overallColor, marginRight: '0.4rem' }}
                            />
                            {overallLabel}
                        </span>
                        <span className="muted">Last updated: {lastUpdated}</span>
                    </div>
                </div>

                {/* Body */}
                <div className="changelog-entries main-echo-description guides app-status-body">
                    {/* Patch + coverage */}
                    <div className="app-status-grid">
                        <div className="status-card">
                            <div className="status-card-header">
                                <span className="status-label">Game Patch</span>
                                <span className="status-pill subtle">
                                    <a
                                        href="https://ww.hakush.in/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        v{patchVersion}
                                    </a>
                                </span>
                            </div>
                            <p className="status-note">{calculatorState}</p>
                        </div>

                        {Array.isArray(coverage) &&
                            coverage.map((item, idx) => (
                                <div className="status-card" key={idx}>
                                    <div className="status-card-header">
                                        <span className="status-label">{item.title}</span>
                                    </div>
                                    <p className="status-note">{item.desc}</p>
                                </div>
                            ))}
                    </div>

                    {/* Known issues + recent changes */}
                    <div className="status-footer">
                        <div className="status-window">
                            <p className="eyebrow"> ➲ Recent Changes</p>
                            {(!recentChanges || recentChanges.length === 0) ? (
                                <p className="status-note" style={{ margin: 0 }}>
                                    See full changelog for history.
                                </p>
                            ) : (
                                <ul className="status-list">
                                    {recentChanges.map((entry, idx) => (
                                        <li key={idx}>{entry}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div className="status-window">
                            <p className="eyebrow"> ➲ Known Issues & Limitations</p>
                            {(!knownIssues || knownIssues.length === 0) ? (
                                <p className="status-note" style={{ margin: 0 }}>
                                    None currently listed.
                                </p>
                            ) : (
                                <ul className="status-list">
                                    {knownIssues.map((issue, idx) => (
                                        <li key={idx}>{issue}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer buttons */}
                <div className="modal-footer" style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        className="edit-substat-button btn-primary echoes"
                        onClick={handleClose}
                    >
                        Close
                    </button>
                    <button
                        className="edit-substat-button btn-primary echoes"
                        onClick={() => {
                            window.location.href = '/changelog';
                        }}
                    >
                        See Changelog
                    </button>
                </div>
            </div>
        </div>
    );
}
