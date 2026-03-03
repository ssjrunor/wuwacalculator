export const formatDescription = (desc, param = [], currentSliderColor = '#888') => {
    if (!desc) return '';

    const hasFontBoldClass = (tag) => {
        const quotedClassMatch = tag.match(/\bclass\s*=\s*(['"])(.*?)\1/i);
        if (quotedClassMatch && /\bfont-bold\b/i.test(quotedClassMatch[2])) {
            return true;
        }

        const unquotedClassMatch = tag.match(/\bclass\s*=\s*([^\s>]+)/i);
        return Boolean(unquotedClassMatch && /\bfont-bold\b/i.test(unquotedClassMatch[1]));
    };

    const stripInjectedMarkup = (text) => {
        const normalized = text.replace(/(?:<br\s*\/?>\s*)+/gi, '\n');
        const tagRegex = /<\/?[^>]+>/gi;
        const spanStack = [];
        let result = '';
        let lastIndex = 0;
        let match;

        while ((match = tagRegex.exec(normalized))) {
            result += normalized.slice(lastIndex, match.index);
            const tag = match[0];

            if (/^<span\b/i.test(tag)) {
                const isBoldSpan = hasFontBoldClass(tag);
                spanStack.push(isBoldSpan);
                if (isBoldSpan) result += '<span class="highlight">';
            } else if (/^<\/span\s*>/i.test(tag)) {
                const isBoldSpan = spanStack.pop();
                if (isBoldSpan) result += '</span>';
            } else if (/^<strong\b[^>]*>/i.test(tag)) {
                result += '<span class="highlight">';
            } else if (/^<\/strong\s*>/i.test(tag)) {
                result += '</span>';
            }

            lastIndex = tagRegex.lastIndex;
        }

        result += normalized.slice(lastIndex);
        return result;
    };

    desc = desc
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n');

    desc = stripInjectedMarkup(desc)
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n[ \t]+/g, '\n')
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
