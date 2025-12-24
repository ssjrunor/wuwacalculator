import React, { useEffect } from 'react';
import { attributeColors } from '@/utils/attributeHelpers';
import { preloadImages } from "@/pages/Calculator.jsx";

export const statIconMap = {
    'ATK': '/assets/stat-icons/atk.png',
    'HP': '/assets/stat-icons/hp.png',
    'DEF': '/assets/stat-icons/def.png',
    'Energy Regen': '/assets/stat-icons/energyregen.png',
    'Crit Rate': '/assets/stat-icons/critrate.png',
    'Crit DMG': '/assets/stat-icons/critdmg.png',
    'Healing Bonus': '/assets/stat-icons/healing.png',
    'Basic Attack DMG Bonus': '/assets/stat-icons/basic.png',
    'Heavy Attack DMG Bonus': '/assets/stat-icons/heavy.png',
    'Resonance Skill DMG Bonus': '/assets/stat-icons/skill.png',
    'Resonance Liberation DMG Bonus': '/assets/stat-icons/liberation.png',
    'Aero DMG Bonus': '/assets/stat-icons/aero.png',
    'Glacio DMG Bonus': '/assets/stat-icons/glacio.png',
    'Spectro DMG Bonus': '/assets/stat-icons/spectro.png',
    'Fusion DMG Bonus': '/assets/stat-icons/fusion.png',
    'Electro DMG Bonus': '/assets/stat-icons/electro.png',
    'Havoc DMG Bonus': '/assets/stat-icons/havoc.png'
};

const statIconPaths = Object.values(statIconMap);

export default function CharacterStats({
                                           activeCharacter,
                                           baseCharacterState,
                                           characterLevel,
                                           mergedBuffs,
                                           finalStats,
                                           combatState,
                                           traceNodeBuffs = {}
                                       }) {

/*
    console.log(mergedBuffs, finalStats);
*/
    useEffect(() => {
        preloadImages(statIconPaths);
    }, []);

    if (!activeCharacter || !finalStats) return null;

    // -------------
    // Main stats: ATK / HP / DEF
    // finalStats.atk/hp/def are { base, final } in the new format
    // -------------
    const normalizeMainStat = (statObjOrNumber) => {
        if (statObjOrNumber && typeof statObjOrNumber === 'object') {
            const base = statObjOrNumber.base ?? 0;
            const total = statObjOrNumber.final ?? base;
            return { base, total, bonus: total - base };
        }
        const total = statObjOrNumber ?? 0;
        return { base: total, total, bonus: 0 };
    };

    const atk = normalizeMainStat(finalStats.atk);
    const hp  = normalizeMainStat(finalStats.hp);
    const def = normalizeMainStat(finalStats.def);

    const mainStats = [
        { label: 'ATK', ...atk },
        { label: 'HP',  ...hp },
        { label: 'DEF', ...def }
    ];

    // -------------
    // Secondary stats: Energy Regen, Crit, Healing
    // Base = character + trace nodes + weapon
    // Total = from finalStats
    // -------------
    const secondaryStats = ['energyRegen', 'critRate', 'critDmg', 'healingBonus'].map(statKey => {
        const labelMap = {
            energyRegen: 'Energy Regen',
            critRate: 'Crit Rate',
            critDmg: 'Crit DMG',
            healingBonus: 'Healing Bonus'
        };

        const baseFromCharacter = baseCharacterState?.Stats?.[statKey] ?? 0;
        const baseFromTrace = traceNodeBuffs[statKey] ?? 0;
        const baseFromWeapon = combatState?.[statKey] ?? 0;

        const base = baseFromCharacter + baseFromTrace + baseFromWeapon;
        const total = finalStats?.[statKey] ?? base;
        const bonus = total - base;

        return {
            label: labelMap[statKey],
            base,
            bonus,
            total
        };
    });

    // -------------
    // Element DMG Bonus (Aero/Glacio/etc)
    // Base = character base + trace node element
    // Total = finalStats.attribute[element].dmgBonus
    // -------------
    const elementStats = [];
    ['aero','glacio','spectro','fusion','electro','havoc'].forEach(element => {
        const key = `${element}DmgBonus`;

        const charBase = baseCharacterState?.Stats?.[key] ?? 0;
        const traceBase = traceNodeBuffs[element] ?? 0;
        const base = charBase + traceBase;

        const total = finalStats.attribute?.[element]?.dmgBonus ?? base;
        const bonus = total - base;

        elementStats.push({
            label: `${element.charAt(0).toUpperCase() + element.slice(1)} DMG Bonus`,
            base,
            bonus,
            total,
            color: attributeColors[element] ?? '#fff'
        });
    });

    // -------------
    // Skill-type DMG Bonus (Basic/Heavy/Skill/Lib)
    // Total = finalStats.skillType[key].dmgBonus
    // Base = any character intrinsic value (usually 0)
    // -------------
    const skillLabelMap = {
        basicAtk: 'Basic Attack DMG Bonus',
        heavyAtk: 'Heavy Attack DMG Bonus',
        resonanceSkill: 'Resonance Skill DMG Bonus',
        resonanceLiberation: 'Resonance Liberation DMG Bonus'
    };

    const skillKeys = ['basicAtk', 'heavyAtk', 'resonanceSkill', 'resonanceLiberation'];

    const skillStats = skillKeys.map(skillKey => {
        const label = skillLabelMap[skillKey] ?? skillKey;
        const base = baseCharacterState?.Stats?.[`${skillKey}DmgBonus`] ?? 0;
        const total = finalStats.skillType?.[skillKey]?.dmgBonus ?? base;
        const bonus = total - base;

        return { label, base, bonus, total };
    });

    // for the "Damage Modifier Stats" group we show element + skill-type
    const dmgModifierStats = [...elementStats, ...skillStats];

    const renderStatsGrid = group => (
        <div className="stats-grid">
            {group.map((stat, index) => {
                const isFlatStat = ['ATK', 'HP', 'DEF'].includes(stat.label);
                const displayValue = val =>
                    isFlatStat ? Math.floor(val) : `${val.toFixed(1)}%`;

                return (
                    <div key={index} className="stat-row">
                        <div
                            className="stat-label"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                ...(stat.color ? { color: stat.color } : {})
                            }}
                        >
                            {statIconMap[stat.label] && (
                                <div
                                    style={{
                                        '--stat-color': stat.color,
                                        WebkitMaskImage: `url(${statIconMap[stat.label]})`,
                                        maskImage: `url(${statIconMap[stat.label]})`,
                                    }}
                                    className="grid-stat-icon"
                                />
                            )}
                            {stat.label}
                        </div>
                        <div className="stat-value">{displayValue(stat.base)}</div>
                        <div className="stat-bonus">
                            {(stat.bonus === 0 || stat.bonus === 0.0)
                                ? ''
                                : `+${displayValue(stat.bonus)}`}
                        </div>
                        <div className="stat-total">{displayValue(stat.total)}</div>
                    </div>
                );
            })}
        </div>
    );

    return (
        <div className="stats-box">
            <h2 className="panel-title">Stats</h2>

            <h3 className="stat-group-title">Main Stats</h3>
            {renderStatsGrid(mainStats)}

            <h3 className="stat-group-title">Secondary Stats</h3>
            {renderStatsGrid(secondaryStats)}

            <h3 className="stat-group-title">Damage Modifier Stats</h3>
            {renderStatsGrid(dmgModifierStats)}
        </div>
    );
}