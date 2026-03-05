function inRange(value, min, max) {
    if (min > max) return true;
    return value >= min && value <= max;
}

export function areConstraintsDisabled(constraints) {
    if (!constraints) return true;
    return (
        constraints[0] > constraints[1] &&
        constraints[2] > constraints[3] &&
        constraints[4] > constraints[5] &&
        constraints[6] > constraints[7] &&
        constraints[8] > constraints[9] &&
        constraints[10] > constraints[11] &&
        constraints[12] > constraints[13] &&
        constraints[14] > constraints[15]
    );
}

export function passesConstraints(
    constraints,
    finalAtk,
    finalHp,
    finalDef,
    critRate,
    critDmg,
    finalER,
    dmgBonus,
    damage
) {
    if (!constraints) return true;

    return (
        inRange(finalAtk, constraints[0], constraints[1]) &&
        inRange(finalHp, constraints[2], constraints[3]) &&
        inRange(finalDef, constraints[4], constraints[5]) &&
        inRange(critRate, constraints[6], constraints[7]) &&
        inRange(critDmg, constraints[8], constraints[9]) &&
        inRange(finalER, constraints[10], constraints[11]) &&
        inRange(dmgBonus, constraints[12], constraints[13]) &&
        inRange(damage, constraints[14], constraints[15])
    );
}
