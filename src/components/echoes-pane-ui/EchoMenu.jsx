import React, {useEffect, useState} from 'react';
import {setIconMap} from "../../constants/echoSetData.jsx";
import { imageCache } from '../../pages/calculator.jsx';

export default function EchoMenu({ echoes, handleEchoSelect, menuRef, menuOpen, setMenuOpen, onClickOut = null }) {
    const [selectedCost, setSelectedCost] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSet, setSelectedSet] = useState(null);

    const [isVisible, setIsVisible] = useState(false);
    const [isAnimatingOut, setIsAnimatingOut] = useState(false);

    useEffect(() => {
        if (menuOpen) {
            setIsVisible(true);
            setIsAnimatingOut(false);
        } else if (isVisible) {
            setIsAnimatingOut(true);
            setTimeout(() => {
                setIsVisible(false);
                setIsAnimatingOut(false);
            }, 300);
        }
    }, [menuOpen]);

    const filteredEchoes = echoes.filter(echo => {
        const matchesCost = selectedCost === null || echo.cost === selectedCost;
        const matchesName = echo.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSet = selectedSet === null || (echo.sets || []).includes(selectedSet);
        return matchesCost && matchesName && matchesSet;
    });

    const [preloaded, setPreloaded] = useState(false);

    useEffect(() => {
        if (!menuOpen) return;

        const preloadAll = async () => {
            await Promise.all(
                echoes.map(echo => {
                    return new Promise(resolve => {
                        const img = new Image();
                        img.onload = resolve;
                        img.onerror = resolve;
                        img.src = echo.icon;
                    });
                })
            );
            setPreloaded(true);
        };

        setPreloaded(false);
        preloadAll();
    }, [menuOpen]);

    if (!isVisible || !preloaded) return null;

    return (
        <div
            className={`menu-overlay ${menuOpen ? 'show' : ''} ${isAnimatingOut ? 'hiding' : ''}`}
            onClick={onClickOut ? onClickOut : (e) => {
                setMenuOpen(false);
                e.stopPropagation();
            }}
        >
            <div
                ref={menuRef}
                className={`icon-menu-vertical ${menuOpen ? 'show' : ''} ${isAnimatingOut ? 'hiding' : ''}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="menu-header-with-buttons echo">
                    <div className="menu-header echo">Select Echo</div>
                    <div className="button-group-container echo">
                        {Object.entries(setIconMap).map(([setId, iconPath]) => (
                            <img
                                key={setId}
                                src={imageCache[iconPath]?.src || iconPath}
                                alt={`Set ${setId}`}
                                loading="eager"
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
                </div>

                <div className="menu-body">
                    {filteredEchoes.map((echo, i) => (
                        <div key={i} className="dropdown-item" onClick={() => handleEchoSelect(echo)}>
                            <div className="dropdown-main">
                                <img
                                    src={imageCache[echo.icon]?.src || echo.icon}
                                    alt={echo.name}
                                    className="icon-menu-img"
                                    loading="eager"
                                    onError={(e) => {
                                        e.currentTarget.onerror = null;
                                        e.currentTarget.src = '/assets/echoes/default.webp';
                                        e.currentTarget.classList.add('fallback-icon');
                                    }}
                                />
                                <span className="dropdown-label">{echo.name}</span>
                            </div>
                            <div className="echo-meta">
                                <div className="echo-slot-cost-badge menu">Cost {echo.cost}</div>
                                <div className="set-icons-row">
                                    {echo.sets?.map(setId => (
                                        <img
                                            key={setId}
                                            src={imageCache[setIconMap[setId]]?.src || setIconMap[setId]}
                                            alt={`Set ${setId}`}
                                            className="set-icon menu"
                                            loading="eager"
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}