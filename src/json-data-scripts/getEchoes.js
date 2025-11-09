import rawEchoes from '../data/echoes.json';

function formatEchoIconName(name = '') {
    return name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[-:]/g, ' ')
        .split(' ')
        .map((word, index) =>
            index === 0
                ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                : word.charAt(0).toUpperCase() + word.slice(1)
        )
        .join('') + '.png';
}

function formatDescription(desc = '', params = []) {
    return desc.replace(/\{(\d+)\}/g, (_, i) => {
        const val = params[+i];
        if (typeof val === 'number') {
            return val % 1 === 0 ? val : (val * 100).toFixed(1) + '%';
        }
        return val ?? `{${i}}`;
    });
}

export const echoes = rawEchoes.map(echo => {
    const id = String(echo.Id ?? echo.id);
    const name = echo.Name ?? 'Unknown Echo';
    const intensity = echo.IntensityCode;

    let cost = 4;
    if (intensity === 1) cost = 3;
    else if (intensity === 0) cost = 1;

    const iconFileName = formatEchoIconName(name);
    const localIcon = (!iconFileName.includes('StayTuned')) ? `/assets/echoes/${iconFileName}` : `/assets/echoes/${id}.png`;

    const descRaw = echo.Skill?.Desc ?? '';
    const paramValues = echo.Skill?.Param ?? [];
    const description = formatDescription(descRaw, paramValues);

    let sets = echo.Group ? Object.keys(echo.Group).map(Number) : [];

    if (id === "6000085") {
        sets.push(1, 2, 3, 4, 5, 6);
    }

    return {
        id,
        name,
        icon: localIcon,
        cost,
        description,
        rawDesc: descRaw,
        rawParams: paramValues,
        type: echo.Type ?? '',
        place: echo.Place ?? '',
        mainStats: echo.mainStats ?? {},
        subStats: echo.subStats ?? {},
        sets
    };
});