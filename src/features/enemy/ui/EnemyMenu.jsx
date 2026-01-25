import React, { useEffect, useMemo, useState } from 'react';
import { imageCache } from '@/pages/Calculator.jsx';

export default function EnemyMenu({
                                      enemies = [],
                                      menuOpen,
                                      setMenuOpen,
                                      menuRef,
                                      handleEnemySelect,
                                   }) {
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimatingOut, setIsAnimatingOut] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedElement, setSelectedElement] = useState(null);
    const [selectedClass, setSelectedClass] = useState(null);

    const elementFilters = [
        { id: 0, label: 'Physical', icon: '/assets/attributes/attributes alt/physical.webp' },
        { id: 1, label: 'Glacio', icon: '/assets/attributes/attributes alt/glacio.webp' },
        { id: 2, label: 'Fusion', icon: '/assets/attributes/attributes alt/fusion.webp' },
        { id: 3, label: 'Electro', icon: '/assets/attributes/attributes alt/electro.webp' },
        { id: 4, label: 'Aero', icon: '/assets/attributes/attributes alt/aero.webp' },
        { id: 5, label: 'Spectro', icon: '/assets/attributes/attributes alt/spectro.webp' },
        { id: 6, label: 'Havoc', icon: '/assets/attributes/attributes alt/havoc.webp' },
    ];
    const iconStyleForElement = (id) => (id === 0 ? { filter: 'grayscale(1) brightness(0.6)' } : {});

    const classFilters = [
        { id: 1, label: 'Common' },
        { id: 2, label: 'Elite' },
        { id: 3, label: 'Overlord' },
        { id: 4, label: 'Calamity' }
    ];

    useEffect(() => {
        if (menuOpen) {
            setIsVisible(true);
            setIsAnimatingOut(false);
        } else if (isVisible) {
            setIsAnimatingOut(true);
            const timer = setTimeout(() => {
                setIsVisible(false);
                setIsAnimatingOut(false);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [menuOpen, isVisible]);

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        return enemies.filter(e => {
            const matchesSearch =
                term.length === 0 ||
                (e?.Name ?? '').toLowerCase().includes(term) ||
                String(e?.Id ?? e?.id ?? e?.monsterId ?? '').includes(term);
            const matchesElement = selectedElement == null || e?.Element === selectedElement;
            const matchesClass = selectedClass == null || e?.Class === selectedClass;
            return matchesSearch && matchesElement && matchesClass;
        });
    }, [enemies, search, selectedElement, selectedClass]);

    if (!isVisible) return null;

    return (
        <div
            className={`menu-overlay ${menuOpen ? 'show' : ''} ${isAnimatingOut ? 'hiding' : ''}`}
            onClick={() => setMenuOpen(false)}
        >
            <div
                ref={menuRef}
                className={`icon-menu-vertical ${menuOpen ? 'show' : ''} ${isAnimatingOut ? 'hiding' : ''}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="menu-header-with-buttons">
                    <div className="menu-header">Select Enemy</div>
                    <input
                        type="text"
                        className="character-level-input"
                        placeholder="Search enemy..."
                        value={search}
                        style={{ width: '100%' }}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <div className="button-group-container">
                        <div className="weapon-button-group">
                            {elementFilters.map(opt => (
                                <button
                                    key={opt.id}
                                    className={`attribute-button ${selectedElement === opt.id ? 'selected' : ''}`}
                                    onClick={() => setSelectedElement(prev => prev === opt.id ? null : opt.id)}
                                    title={opt.label}
                                >
                                    <img
                                        src={imageCache?.[opt.icon]?.src || opt.icon}
                                        alt={opt.label}
                                        loading="eager"
                                        style={iconStyleForElement(opt.id)}
                                    />
                                </button>
                            ))}
                        </div>
                        <div className="attribute-button-group">
                            {classFilters.map(opt => (
                                <button
                                    key={opt.id}
                                    className={`class-toggle ${selectedClass === opt.id ? 'selected' : ''}`}
                                    onClick={() => setSelectedClass(prev => prev === opt.id ? null : opt.id)}
                                    title={opt.label}
                                >
                                    <span>{opt.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="menu-body">
                        {filtered.length > 0 ? (
                            filtered.map((entry, i) => {
                                const id = String(entry?.Id ?? entry?.id ?? entry?.monsterId ?? '');
                                const icon = entry.Icon ?? '/assets/weapon-icons/default.webp';
                                const elem = elementFilters.find(f => f.id === entry?.Element) ?? elementFilters[0];
                                const attrIcon = imageCache?.[elem.icon]?.src || elem.icon;
                                return (
                                    <div key={i} className="dropdown-item" onClick={() => handleEnemySelect(id)}>
                                        <div className="dropdown-item-content">
                                            <div className="dropdown-main">
                                                <img
                                                    src={icon}
                                                    style={{ filter: id === '000000000' ? 'grayscale(1) brightness(0.6)' : 'unset'}}
                                                    alt={entry?.Name ?? 'Enemy'}
                                                    className={`icon-menu-img rarity-${entry?.Rarity ?? 1}`}
                                                    loading="eager"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = '/assets/weapon-icons/default.webp';
                                                    }}
                                                />
                                                <span className="dropdown-label">
                                                    {entry?.Name ?? 'Unknown'}
                                                </span>
                                            </div>
                                            <div className="dropdown-icons">
                                                <img
                                                    src={attrIcon}
                                                    alt="Element"
                                                    style={{ filter: attrIcon.includes('physical') ? 'grayscale(1) brightness(0.6)' : 'unset' }}
                                                    className="mini-icon"
                                                    loading="eager"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = '/assets/attributes/attributes alt/physical.webp';
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p style={{ padding: '0.5rem' }}>No enemies match your filters.</p>
                        )}
                </div>
            </div>
        </div>
    );
}
