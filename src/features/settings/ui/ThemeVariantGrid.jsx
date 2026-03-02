import React from 'react';

const THEME_PREVIEWS = {
    light: '#f9f9f9',
    'pastel-pink': 'linear-gradient(135deg, #ffe4e9 0%, #ffd8e0 100%)',
    'pastel-blue': 'linear-gradient(135deg, #e4f2ff 0%, #d8ebff 100%)',
    'vibrant-citrus': 'linear-gradient(135deg, #fff6ea 0%, #ffe083 55%, #ffb74d 100%)',
    'glassy-rainbow': 'linear-gradient(135deg, #ff9aa2 0%, #ffd3b6 28%, #fdffb6 50%, #caffbf 72%, #a0c4ff 100%)',
    dark: '#131922',
    'dark-alt': '#0b0f16',
    'cosmic-rainbow': 'linear-gradient(135deg, #0f1022 0%, #25356e 50%, #5f2a89 100%)',
    'scarlet-nebula': 'linear-gradient(135deg, #16080c 0%, #48131c 55%, #8c1d2d 100%)',
    'frosted-aurora': 'linear-gradient(135deg, rgba(240, 255, 255, 0.55) 0%, rgba(170, 220, 255, 0.45) 100%)',
};

const NEW_BADGES = new Set(['frosted-aurora']);

function toTitle(value) {
    return value
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

function buildBackgroundPreview(variant, backgroundImage) {
    if (variant !== 'frosted-aurora' || !backgroundImage) return null;
    return `linear-gradient(135deg, rgba(11, 17, 32, 0.18), rgba(11, 17, 32, 0.28)), url(${backgroundImage})`;
}

export default function ThemeVariantGrid({
    mode,
    value,
    onChange,
    variants,
    unselect = false,
    backgroundImage = null,
}) {
    const options = variants?.[mode] ?? [];
    if (options.length === 0) return null;

    return (
        <div className="theme-variant-grid" role="radiogroup" aria-label={`${mode} theme variants`}>
            {options.map((variant) => {
                const preview = THEME_PREVIEWS[variant] ?? '#888';
                const backgroundPreview = buildBackgroundPreview(variant, backgroundImage);
                const previewValue = backgroundPreview || preview;
                const isGradient = String(previewValue).includes('gradient') || String(previewValue).startsWith('url(');
                const isActive = !unselect && value === variant;

                return (
                    <button
                        key={`${mode}-${variant}`}
                        type="button"
                        className={`theme-swatch ${isGradient ? 'gradient' : 'plain'} ${isActive ? 'active' : ''}`}
                        style={{ '--preview-value': previewValue }}
                        onClick={() => onChange(variant)}
                        title={toTitle(variant)}
                        aria-label={toTitle(variant)}
                        aria-checked={isActive}
                        role="radio"
                    >
                        {NEW_BADGES.has(variant) && <span className="badge-new">NEW</span>}
                    </button>
                );
            })}
        </div>
    );
}
