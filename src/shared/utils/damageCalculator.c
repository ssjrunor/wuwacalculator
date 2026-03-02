#include <math.h>

double calculate_res_multiplier(double enemyRes, double resShred) {
    double resTotal = enemyRes - resShred;

    if (resTotal < 0) {
        return 1.0 - (resTotal / 2.0);
    } else if (resTotal < 0.8) {
        return 1.0 - resTotal;
    } else {
        return 1.0 / (1.0 + 5.0 * resTotal);
    }
}

double calculate_def_multiplier(double characterLevel, double enemyLevel, double defIgnore, double defShred) {
    double enemyDef = (8.0 * enemyLevel) + 792.0;
    double effectiveDef = enemyDef * (1.0 - defIgnore + defShred);
    return (800.0 + 8.0 * characterLevel) / (800.0 + 8.0 * characterLevel + effectiveDef);
}

double calculate_dmg_bonus(double elementBonus, double bonusAdditional) {
    return 1.0 + elementBonus + bonusAdditional;
}

double calculate_dmg_amplify(double elementAmplify, double dmgTypAmplify) {
    return 1.0 + elementAmplify + dmgTypAmplify;
}

double calculate_special_dmg(double specialBase, double specialAdditional) {
    return 1.0 + specialBase + specialAdditional;
}

double calculate_damage(
    double stat, double multiplier,
    double flatDmg,
    double enemyRes, double resShred,
    double characterLevel, double enemyLevel
    double defIgnore, double defShred,
    double dmgReduction, double elementReduction,
    double elementDmgBonus, double dmgBonusAdditional,
    double elementAmplify, double dmgTypAmplify,
    double specialBase, double specialAdditional
) {
    double baseAbilityDmg = stat * multiplier;
    double baseDmg = baseAbilityDmg + flatDmg;

    double resMultiplier = calculate_res_multiplier(enemyRes, resShred);
    double defMultiplier = calculate_def_multiplier(characterLevel, enemyLevel, defIgnore, defShred);
    double dmgBonus = calculate_dmg_bonus(elementDmgBonus, dmgBonusAdditional);
    double dmgAmplify = calculate_dmg_amplify(elementAmplify, amplifyElement);
    double specialDmg = calculate_special_dmg(specialBase, specialAdditional);

    double resistances = resMultiplier * defMultiplier * dmgReduction * elementReduction;
    double bonuses = dmgBonus * dmgAmplify * specialDmg;

    return baseDmg * resistances * bonuses;
}

int main () {
    return 0;
}