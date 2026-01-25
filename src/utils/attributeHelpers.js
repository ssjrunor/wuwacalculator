export const attributeColors = {
    glacio: 'rgb(62,189,227)',
    spectro: 'rgb(202,179,63)',
    havoc: 'rgb(172,9,96)',
    electro: 'rgb(167,13,209)',
    aero: 'rgb(15,205,160)',
    fusion: 'rgb(197,52,79)'
};

export const attributeIcons = {
    glacio: '/assets/attributes/glacio.png',
    spectro: '/assets/attributes/spectro.png',
    havoc: '/assets/attributes/havoc.png',
    electro: '/assets/attributes/electro.png',
    aero: '/assets/attributes/aero.png',
    fusion: '/assets/attributes/fusion.png'
};

export const elementToAttribute = {
    0: 'physical',
    1: 'glacio',
    2: 'fusion',
    3: 'electro',
    4: 'aero',
    5: 'spectro',
    6: 'havoc',
};

export function withOpacity(color, alpha = 0.5) {
    alpha = Math.max(0, Math.min(1, alpha)); // clamp 0–1

    if (typeof color !== 'string') return `rgba(0, 0, 0, ${alpha})`;

    color = color.trim();

    // Hex: #RGB or #RRGGBB
    if (color.startsWith('#')) {
        let hex = color.slice(1);

        // #RGB → #RRGGBB
        if (hex.length === 3) {
            hex = hex.split('').map(ch => ch + ch).join('');
        }

        if (hex.length === 6) {
            const r = parseInt(hex.slice(0, 2), 16);
            const g = parseInt(hex.slice(2, 4), 16);
            const b = parseInt(hex.slice(4, 6), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }

        // If it's some weird hex, bail to black-ish
        return `rgba(0, 0, 0, ${alpha})`;
    }

    // rgb(...) or rgba(...)
    const rgbMatch = color.match(
        /rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/
    );

    if (rgbMatch) {
        const r = Number(rgbMatch[1]);
        const g = Number(rgbMatch[2]);
        const b = Number(rgbMatch[3]);
        // ignore existing alpha, we overwrite with `alpha`
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    return `rgba(0, 0, 0, ${alpha})`;
}