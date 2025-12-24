import React, {useEffect, useRef, useState} from 'react';

export default function WeaponMenu({
                                       weapons,
                                       handleWeaponSelect,
                                       menuOpen,
                                       menuRef,
                                       setMenuOpen,
                                       selectedRarities,
                                       setSelectedRarities
                                   }) {

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

    const filteredWeapons = weapons.filter(w => selectedRarities.includes(w.Rarity ?? 1));

    const formatStat = (stat) => {
        if (!stat) return '-';
        let value = stat.Value;
        if (stat.IsRatio) return `${(value * 100).toFixed(0)}%`;
        if (stat.IsPercent) return `${(value / 100).toFixed(0)}%`;
        return value.toFixed(0);
    };

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
                    <div className="menu-header">Select Weapon</div>
                    <div className="button-group-container">
                        <div className="rarity-stars">
                            {[5, 4, 3, 2, 1].map((rarity) => (
                                <span
                                    key={rarity}
                                    className={`star ${selectedRarities.includes(rarity) ? 'active' : ''}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const next = selectedRarities.includes(rarity)
                                            ? selectedRarities.filter(r => r !== rarity)
                                            : [...selectedRarities, rarity];
                                        setSelectedRarities(next);
                                    }}
                                >
                                {rarity}★
                            </span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="menu-body">
                    {filteredWeapons.map((weapon, i) => {
                        const level1 = weapon.Stats?.["0"]?.["1"];
                        const level90 = weapon.Stats?.["6"]?.["90"];

                        const baseAtk1 = level1?.[0]?.Value ?? 0;
                        const baseAtk90 = level90?.[0]?.Value ?? 0;

                        const stat1 = level1?.[1] ?? null;
                        const stat90 = level90?.[1] ?? null;

                        return (
                            <div key={i} className="dropdown-item" onClick={() => handleWeaponSelect(weapon)}>
                                <img
                                    src={`/assets/weapon-icons/${weapon.Id}.webp`}
                                    alt={weapon.Name}
                                    className={`weapon-menu-icon rarity-${weapon.Rarity ?? 1}`}
                                    loading="lazy"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = '/assets/weapon-icons/default.webp';
                                        e.currentTarget.classList.add('fallback-icon');
                                    }}
                                />
                                <div>
                                    <span className="dropdown-label">{weapon.Name}</span>
                                    <div className="dropdown-subtext">
                                        ATK: {baseAtk1.toFixed(0)} - {baseAtk90.toFixed(0)}<br />
                                        {stat1?.Name ?? 'Stat'}: {formatStat(stat1)} - {formatStat(stat90)}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}