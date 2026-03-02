export const formatDescription = (desc, param = [], currentSliderColor = '#888') => {
    if (!desc) return '';

    desc = desc
        .replace(/<size=\d+>|<\/size>/g, '')
        .replace(/<color=[^>]+>|<\/color>/g, '')
        .replace(/<a\s+href=.*?>/gi, '')
        .replace(/<\/a>/gi, '')
        .replace(/\n/g, '<br>');

    desc = desc.replace(/\{Cus:[^}]*S=([^ ]+)\s+P=([^ ]+)\s+SapTag=(\d+)[^}]*\}/g, (_, singular, plural, tagIndex) => {
        const value = parseFloat(param[parseInt(tagIndex, 10)]);
        return value === 1 ? singular : plural;
    });

    const fixedHighlights = {
        'Spectro Frazzle': 'rgb(202,179,63)',
        'Aero Erosion': 'rgb(15,205,160)',
        'Havoc Bane': 'rgb(172,9,96)',
        'Fusion Burst': 'rgb(197,52,79)',
        'Electro Flare': 'rgb(167,13,209)',
        'Glacio Chafe': 'rgb(62,189,227)'
    };

    Object.entries(fixedHighlights).forEach(([word, color]) => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        desc = desc.replace(regex, `<span style="color: ${color}; font-weight: bold;">${word}</span>`);
    });

    desc = desc.replace(/{(\d+)}/g, (_, index) => param[index] ?? `{${index}}`);
    desc = desc.replace(/\{Cus:Ipt,[^}]*Touch=([^ ]+)\s+PC=([^ ]+)\s+Gamepad=([^ }]+)[^}]*\}/g, (_, touch, pc, gamepad) => {
        const inputs = new Set([touch, pc, gamepad]);
        return Array.from(inputs).join('/');
    });

    return desc;
};