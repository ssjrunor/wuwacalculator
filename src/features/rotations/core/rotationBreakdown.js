export function buildRotationBreakdown(skillResults, allSkillLevels, rotationEntries) {
    const totals = { normal: 0, crit: 0, avg: 0 };
    const perTab = {};

    void allSkillLevels;

    if (!Array.isArray(rotationEntries) || !Array.isArray(skillResults)) {
        return { totals, perTab };
    }

    const skillByTabName = new Map();
    for (const skill of skillResults) {
        if (!skill
            || skill.tab === "echoAttacks"
            || skill.tab === "negativeEffect"
            || skill.isSupportSkill) continue;
        const key = `${skill.tab}::${skill.name}`;
        if (!skillByTabName.has(key)) {
            skillByTabName.set(key, skill);
        }
    }

    for (const entry of rotationEntries) {
        if (!entry || entry.type === "block" || entry.disabled) continue;

        const key = `${entry.tab}::${entry.label}`;
        const source = skillByTabName.get(key);
        if (!source) continue;

        if (source.isSupportSkill) continue;

        const multiplier = entry.multiplier ?? 1;
        const normal = (source.normal ?? 0) * multiplier;
        const crit = (source.crit ?? 0) * multiplier;
        const avg = (source.avg ?? 0) * multiplier;

        totals.normal += normal;
        totals.crit += crit;
        totals.avg += avg;

        if (!perTab[entry.tab]) {
            perTab[entry.tab] = {};
        }
        if (!perTab[entry.tab][entry.label]) {
            perTab[entry.tab][entry.label] = {
                normal: 0,
                crit: 0,
                avg: 0,
                n: 0
            };
        }
        const bucket = perTab[entry.tab][entry.label];
        bucket.normal += normal;
        bucket.crit += crit;
        bucket.avg += avg;
        bucket.n += multiplier;
    }

    return { totals, perTab };
}
