import React from 'react';
import {imageCache} from "../../pages/calculator.jsx";

const weaponMap = {
    broadblade: 1,
    sword: 2,
    pistols: 3,
    gauntlets: 4,
    rectifier: 5
};

const getWeaponName = (value) => {
    const entry = Object.entries(weaponMap).find(([, val]) => val === value);
    return entry ? entry[0] : 'unknown';
};

export default function CharacterHeader({ activeCharacter, setMenuOpen, attributeIconPath, menuOpen, triggerRef, rarityMap, charId }) {
    const weaponName = getWeaponName(activeCharacter?.weaponType);
    const rarity = rarityMap[charId]

    return (
        <div className="header-with-icon">
            {activeCharacter && (
                <img
                    ref={triggerRef}
                    src={imageCache[activeCharacter.icon]?.src || activeCharacter.icon}
                    alt={activeCharacter.displayName}
                    className={`header-icon rarity-${rarity}`}
                    loading="eager"
                    onClick={() => setMenuOpen(!menuOpen)}
                />
            )}
            <div className="character-info-header">
                <h2>{activeCharacter?.displayName ?? "Character Info"}</h2>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {weaponName !== 'unknown' && (
                        <img
                            src={imageCache[`/assets/weapons/${weaponName}.webp`]?.src || `/assets/weapons/${weaponName}.webp`}
                            alt="weapon"
                            className="weapon-icon"
                            loading="eager"
                        />
                    )}
                    {attributeIconPath && (
                        <img
                            src={imageCache[attributeIconPath]?.src || attributeIconPath}
                            alt="attribute"
                            className="attribute-icon"
                            loading="eager"
                        />
                    )}
                </div>
            </div>
        </div>
    );
}