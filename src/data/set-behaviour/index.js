import {three22SkillMeta} from "./22.js";

export function getEchoSetSkillMeta(setId) {
    const sets = {
        '22': {
            threePiece: three22SkillMeta
        }
    }
    return sets[String(setId)]?.threePiece ?? null;
}