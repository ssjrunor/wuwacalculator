import React, {useMemo} from "react";
import {computeEchoStatsFromIds, resolveIdsFromEchoes} from "../../optimizer/optimizerUtils.js";
import {accumulateSkillStatBonus} from "./EchoOptimizerRow.jsx";
import {
    Legend,
    PolarAngleAxis,
    PolarGrid,
    PolarRadiusAxis,
    Radar,
    RadarChart,
    ResponsiveContainer,
    Tooltip
} from "recharts";
import {applySpecialBuffs} from "../../optimizer/echoOptimizerContext.js";

export default function StatProfileCard({
                                            resEchoes,
                                            echoBag,
                                            currentContext,
                                            charIdForm,
                                            skill,
                                            skillMeta,
                                            mergedBuffs,
                                            finalStats,
                                            sequence
                                    }) {
    const resIds = resolveIdsFromEchoes(resEchoes);
    const { statTotals } = computeEchoStatsFromIds(resIds, echoBag, currentContext, charIdForm);
    const candidateBonus = (() => {
        let b = accumulateSkillStatBonus(
            skill.skillType,
            statTotals,
            skillMeta?.skillDmgBonus ?? 0
        );
        b += (statTotals?.[skill.element] ?? 0);
        return b;
    })();

    const currentBonus = (() => {
        let b = accumulateSkillStatBonus(
            skill.skillType,
            mergedBuffs,
            skillMeta?.skillDmgBonus ?? 0
        );
        b += (mergedBuffs?.[skill.element] ?? 0);
        return b;
    })();

    const currentStats = useMemo(
        () => ({
            atk: finalStats.atk,
            hp: finalStats.hp,
            def: finalStats.def,
            energyRegen: finalStats.energyRegen,
            critRate: finalStats.critRate,
            critDmg: finalStats.critDmg,
            bonus: currentBonus,
        }),
        [
            finalStats.atk,
            finalStats.hp,
            finalStats.def,
            finalStats.energyRegen,
            finalStats.critRate,
            finalStats.critDmg,
            currentBonus,
        ]
    );

    const candidateStats = useMemo(
        () => ({
            atk: statTotals.atk +
                applySpecialBuffs({energyRegen: statTotals.er}, {}, charIdForm, 'atk').atk,
            hp: statTotals.hp,
            def: statTotals.def,
            energyRegen: statTotals.er,
            critRate: statTotals.cr,
            critDmg: statTotals.cd +
                applySpecialBuffs({critRate: statTotals.cr, critDmg: statTotals.cd}, {}, charIdForm, 'critDmg', sequence).critDmg,
            bonus: (statTotals.dmgBonus ?? 0) + candidateBonus,
        }),
        [
            statTotals.atk,
            statTotals.hp,
            statTotals.def,
            statTotals.er,
            statTotals.cr,
            statTotals.cd,
            statTotals.dmgBonus,
            candidateBonus
        ]
    );

    const statProfileData = useMemo(
        () => [
            { stat: "ATK", current: currentStats.atk,           candidate: candidateStats.atk         },
            { stat: "HP",  current: currentStats.hp,            candidate: candidateStats.hp          },
            { stat: "DEF", current: currentStats.def,           candidate: candidateStats.def         },
            { stat: "ER%", current: currentStats.energyRegen,   candidate: candidateStats.energyRegen },
            { stat: "CR%", current: currentStats.critRate,      candidate: candidateStats.critRate    },
            { stat: "CD%", current: currentStats.critDmg,       candidate: candidateStats.critDmg     },
            { stat: "BNS%", current: currentStats.bonus,        candidate: candidateStats.bonus       },
        ],
        [currentStats, candidateStats]
    );

    const normalizedStatProfileData = useMemo(
        () =>
            statProfileData.map((row) => {
                const maxVal = Math.max(row.current ?? 0, row.candidate ?? 0) || 1;
                return {
                    ...row,
                    currentNorm: (row.current / maxVal) * 100,
                    candidateNorm: (row.candidate / maxVal) * 100,
                };
            }),
        [statProfileData]
    );
    return (
        <>
            <div className="card-title">Stat Profile</div>
            <div className="analytics-card-header">
                <span className="analytics-subtitle">Current vs candidate</span>
            </div>
            <StatProfile data={normalizedStatProfileData} />
        </>
    )
}

const StatProfile = React.memo(function StatProfile({
                                                        data,
                                                    }) {
    if (!data || data.length === 0) return null;

    return (
        <div className="analytics-body">
            <div className="analytics-chart-wrapper">
                <ResponsiveContainer
                    width="200"
                    height="200"
                >
                    <RadarChart data={data}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="stat" tick={{ fontSize: 13 }} />
                        <PolarRadiusAxis tick={{ fontSize: 8 }} domain={[0, 100]} />
                        <Radar
                            name="Current"
                            dataKey="currentNorm"
                            fillOpacity={0.25}
                            stroke="crimson"
                            fill="crimson"
                            isAnimationActive={false}
                        />
                        <Radar
                            name="Candidate"
                            dataKey="candidateNorm"
                            fillOpacity={0.25}
                            stroke="#20bfb9"
                            fill="#60fffa"
                            isAnimationActive={false}
                        />
                        <Legend />
                        <Tooltip
                            content={
                                <StatProfileTooltip/>
                            }
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
            <p className="analytics-note">
                This chart compares your current build and the selected optimizer result
                across ATK, HP, DEF, Energy Regen, Crit stats and damage bonuses. Each spoke
                is normalized between the two builds, so the larger shape on a stat shows
                which build is stronger there. Hover to see the exact numbers.
            </p>
        </div>
    );
});

function formatStatValue(statLabel, value) {
    if (value == null) return "-";

    switch (statLabel) {
        case "ATK":
        case "HP":
        case "DEF":
            return Math.floor(value).toLocaleString();

        case "ER%":
        case "CR%":
        case "CD%":
        case "BNS%":
            return (value ?? 0).toFixed(1);

        default:
            return typeof value === "number"
                ? value.toFixed(1)
                : String(value);
    }
}

function StatProfileTooltip({ active, payload, label }) {
    if (!active || !payload || payload.length === 0) return null;

    const row = payload[0].payload;

    return (
        <div className="analytics-tooltip custom-select__menu">
            <div className="analytics-tooltip__header">
                <span className="analytics-tooltip__label">{label}</span>
            </div>
            <div className="analytics-tooltip__row">
                <span className="analytics-tooltip__tag analytics-tooltip__tag--current">
                    Current
                </span>
                <span className="analytics-tooltip__value">
                    {formatStatValue(label, row.current) || 'Unset'}
                </span>
            </div>
            <div className="analytics-tooltip__row">
                <span className="analytics-tooltip__tag analytics-tooltip__tag--candidate">
                    Candidate
                </span>
                <span className="analytics-tooltip__value">
                    {formatStatValue(label, row.candidate) || 'Unset'}
                </span>
            </div>
        </div>
    );
}