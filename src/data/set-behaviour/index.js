export function getEchoSetSkillMeta(setId) {
    const sets = {}
    return sets[String(setId)]?.threePiece ?? null;
}