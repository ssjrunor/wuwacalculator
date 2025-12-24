function formatStatEntries(stats) {
    return Object.keys(stats ?? {})
        .sort()
        .map((key) => `${key}:${stats[key]}`)
        .join(",");
}

function buildLoadoutSignature(echoes) {
    return (echoes ?? [])
        .map((echo) => {
            const cost = echo?.cost ?? 0;
            const main = formatStatEntries(echo?.mainStats ?? {});
            const sub = formatStatEntries(echo?.subStats ?? {});
            return `${cost}|${main}|${sub}`;
        })
        .join(";");
}

export function pickUniqueLoadoutResults(results, uniqueTarget) {
    const unique = [];
    const seen = new Set();

    for (const r of results) {
        const echoes = r?.echoes ?? [];
        if (!echoes.length) continue;
        const key = buildLoadoutSignature(echoes);
        if (seen.has(key)) continue;
        seen.add(key);
        unique.push(r);
        if (unique.length >= uniqueTarget) break;
    }

    return unique;
}
