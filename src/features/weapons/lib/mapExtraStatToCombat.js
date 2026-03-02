export function mapExtraStatToCombat(stat) {
    if (!stat || !stat.Name) return {};

    const value = stat.Value ?? 0;
    const name = stat.Name.toLowerCase();

    const scaled = stat.IsRatio ? value * 100 : stat.IsPercent ? value / 100 : value;

    switch (name) {
        case 'atk':
            return stat.IsRatio ? { atkPercent: scaled } : { atk: scaled };
        case 'hp':
            return stat.IsRatio ? { hpPercent: scaled } : { hp: scaled };
        case 'def':
            return stat.IsRatio ? { defPercent: scaled } : { def: scaled };
        case 'crit. rate':
            return { critRate: scaled };
        case 'crit. dmg':
            return { critDmg: scaled };
        case 'energy regen':
            return { energyRegen: scaled };
        default:
            return {};
    }
}
