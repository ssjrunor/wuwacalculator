export function calculateSupportEffect({
                                           finalStats,
                                           scaling,
                                           multiplier,
                                           type = 'healing',
                                           flat = 0,
                                           skillHealingBonus = 0,
                                           skillShieldBonus = 0
                                       }) {
    const atk = finalStats?.atk.final ?? 0;
    const hp = finalStats?.hp.final ?? 0;
    const def = finalStats?.def.final ?? 0;
    const energyRegen = finalStats?.energyRegen ?? 0;

    const baseEffect =
        (atk * (scaling?.atk ?? 0)) +
        (hp * (scaling?.hp ?? 0)) +
        (def * (scaling?.def ?? 0)) +
        (energyRegen * (scaling?.energyRegen ?? 0));

    const bonusKey = type === 'healing' ? 'healingBonus' : 'shieldingBonus';
    let bonusPercent = finalStats?.[bonusKey] ?? 0;

    if (type === 'healing') {
        bonusPercent += skillHealingBonus;
    } else if (type === 'shielding') {
        bonusPercent += skillShieldBonus;
    }

    const total = ((baseEffect * multiplier) + flat) * (1 + bonusPercent / 100);

    return Math.max(1, Math.floor(total));
}