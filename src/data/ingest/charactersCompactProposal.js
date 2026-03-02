function compactSkillLevel(level = {}) {
    const out = {};
    Object.entries(level).forEach(([key, value]) => {
        out[key] = {
            Name: value?.Name ?? '',
            Param: value?.Param ?? []
        };
    });
    return out;
}

function compactSkillTrees(skillTrees = {}) {
    const out = {};
    Object.entries(skillTrees).forEach(([key, node]) => {
        out[key] = {
            NodeType: node?.NodeType ?? null,
            Skill: {
                Type: node?.Skill?.Type ?? '',
                Name: node?.Skill?.Name ?? '',
                Desc: node?.Skill?.Desc ?? '',
                Param: node?.Skill?.Param ?? [],
                ...(node?.Skill?.Level ? { Level: compactSkillLevel(node.Skill.Level) } : {})
            }
        };
    });
    return out;
}

function compactChains(chains = {}) {
    const out = {};
    Object.entries(chains).forEach(([key, chain]) => {
        out[key] = {
            Name: chain?.Name ?? '',
            Desc: chain?.Desc ?? '',
            Param: chain?.Param ?? []
        };
    });
    return out;
}

function compactStats(stats = {}) {
    const out = {};
    Object.entries(stats).forEach(([stage, levels]) => {
        out[stage] = {};
        Object.entries(levels ?? {}).forEach(([level, value]) => {
            out[stage][level] = {
                Atk: value?.Atk ?? 0,
                Life: value?.Life ?? 0,
                Def: value?.Def ?? 0
            };
        });
    });
    return out;
}

export function toCompactCharacter(char = {}) {
    return {
        Id: char.Id,
        Name: char.Name,
        Element: char.Element,
        Weapon: char.Weapon,
        Rarity: char.Rarity,
        Chains: compactChains(char.Chains),
        SkillTrees: compactSkillTrees(char.SkillTrees),
        Stats: compactStats(char.Stats),
        ...(char?.StatsWeakness?.WeaknessMastery != null
            ? { StatsWeakness: { WeaknessMastery: char.StatsWeakness.WeaknessMastery } }
            : {}),
        ...(char?.StatWeakness?.WeaknessMastery != null
            ? { StatWeakness: { WeaknessMastery: char.StatWeakness.WeaknessMastery } }
            : {})
    };
}

export function toCompactCharacters(chars = []) {
    return (Array.isArray(chars) ? chars : []).map(toCompactCharacter);
}

