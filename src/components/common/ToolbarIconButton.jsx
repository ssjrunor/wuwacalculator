import React from 'react';

export default function ToolbarIconButton({ iconName, onClick, altText, isDark }) {
    let iconPath;

    if (isDark) {
        iconPath = `/assets/icons/dark/${iconName}.png`;
    } else {
        iconPath = `/assets/icons/light/${iconName}.png`;
    }

    return (
        <button onClick={onClick} className="toolbar-icon-button">
            <img src={iconPath} alt={altText} style={{ maxWidth: 30, maxHeight: 30, minWidth: 30, minHeight: 30 }} loading='lazy' />
        </button>
    );
}

export function ToolbarSidebarButton({ iconName, label, onClick, selected, isDark }) {
    const iconPath = `/assets/icons/${isDark ? 'dark' : 'light'}/${iconName}.png`;

    return (
        <button
            className={`sidebar-button ${selected ? 'active' : ''}`}
            onClick={onClick}
        >
            <div className="icon-slot">
                <img src={iconPath} alt={label} style={{ maxWidth: 24, maxHeight: 24, minWidth: 24, minHeight: 24 }} loading='lazy' />
            </div>
            <div className="label-slot">
                <span className="label-text">{label}</span>
            </div>
        </button>
    );
}