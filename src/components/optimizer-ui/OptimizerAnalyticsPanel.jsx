// OptimizerAnalyticsPanel.jsx
import React from "react";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    LineChart,
    Line,
    CartesianGrid,
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ScatterChart,
    Scatter,
} from "recharts";

// =====================
// Dummy data (static)
// =====================

// 1. Top set plans
const setPlanData = [
    { setPlan: "2p FF + 2p LT", count: 14, avgDmg: 1.82 },
    { setPlan: "5p FF", count: 9, avgDmg: 1.94 },
    { setPlan: "2p LT + 2p SR", count: 6, avgDmg: 1.73 },
    { setPlan: "Mixed", count: 3, avgDmg: 1.6 },
];

// 2. Damage vs current build
const damageVsBuildData = [
    { build: "Current", dmg: 1.45, delta: 0 },
    { build: "Result #1", dmg: 1.88, delta: 0.297 },
    { build: "Result #2", dmg: 1.81, delta: 0.248 },
    { build: "Result #3", dmg: 1.76, delta: 0.214 },
];

// 3. Stat profile comparison (current vs candidate)
const statProfileData = [
    { stat: "ATK", current: 3250, candidate: 3560 },
    { stat: "HP", current: 18400, candidate: 16900 },
    { stat: "DEF", current: 1120, candidate: 1030 },
    { stat: "ER%", current: 118, candidate: 122 },
    { stat: "CR%", current: 62, candidate: 78 },
    { stat: "CD%", current: 148, candidate: 193 },
    { stat: "Elem BNS", current: 38, candidate: 45 },
];

// 4. Damage vs key stat (crit rate)
const damageVsCritData = [
    { critRate: 50, dmg: 1.52 },
    { critRate: 60, dmg: 1.63 },
    { critRate: 70, dmg: 1.74 },
    { critRate: 80, dmg: 1.8 },
];

// 5. Substat quality vs damage
const substatQualityData = [
    { label: "Mid", quality: 62, dmg: 1.63 },
    { label: "Good", quality: 78, dmg: 1.78 },
    { label: "High", quality: 91, dmg: 1.92 },
];

// 6. Cost efficiency
const costEfficiencyData = [
    { cost: 8, bestDmg: 1.61, delta: -0.118 },
    { cost: 10, bestDmg: 1.77, delta: -0.031 },
    { cost: 12, bestDmg: 1.83, delta: 0 },
];

// 7. Main stat choice impact
const mainStatChoiceData = [
    { mainStat: "ATK%", bestDmg: 1.76, delta: 0 },
    { mainStat: "Crit Rate", bestDmg: 1.81, delta: 0.028 },
    { mainStat: "Crit DMG", bestDmg: 1.84, delta: 0.045 },
    { mainStat: "Elem BNS%", bestDmg: 1.88, delta: 0.068 },
];

export default function OptimizerAnalyticsPanel() {
    return (
        <div className="optimizer-analytics">
            {/* HERO CARD: Top set plans */}
            <section className="analytics-card analytics-card--hero">
                <div className="analytics-card-header">
                    <h4 className="analytics-title">Top Set Plans</h4>
                    <span className="analytics-subtitle">Frequency & avg damage</span>
                </div>
                <div className="analytics-body">
                    <div className="analytics-chart-wrapper analytics-chart-wrapper--hero">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={setPlanData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <XAxis dataKey="setPlan" tick={{ fontSize: 10 }} />
                                <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    tick={{ fontSize: 10 }}
                                    domain={[1.5, 2.1]}
                                    tickFormatter={(v) => v.toFixed(2) + "M"}
                                />
                                <Tooltip
                                    formatter={(value, name) =>
                                        name === "avgDmg" ? `${value.toFixed(2)}M` : value
                                    }
                                />
                                <Legend />
                                <Bar yAxisId="left" dataKey="count" name="Count" />
                                <Bar yAxisId="right" dataKey="avgDmg" name="Avg DMG (M)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="analytics-note">
                        Dummy data: once wired up, each bar will come from optimizer results grouped by set plan.
                    </p>
                </div>
            </section>

            {/* ROW 1: Damage vs current + Stat profile */}
            <div className="analytics-row">
                <section className="analytics-card analytics-card--wide">
                    <div className="analytics-card-header">
                        <h4 className="analytics-title">Damage vs Current Build</h4>
                        <span className="analytics-subtitle">Relative DPS gain</span>
                    </div>
                    <div className="analytics-body">
                        <div className="analytics-chart-wrapper">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={damageVsBuildData}
                                    layout="vertical"
                                    margin={{ top: 10, right: 10, left: 40, bottom: 0 }}
                                >
                                    <XAxis type="number" tickFormatter={(v) => v.toFixed(2) + "M"} />
                                    <YAxis type="category" dataKey="build" tick={{ fontSize: 10 }} />
                                    <Tooltip formatter={(v, name) =>
                                        name === "dmg" ? `${v.toFixed(2)}M` : `${(v * 100).toFixed(1)}%`
                                    } />
                                    <Legend />
                                    <Bar dataKey="dmg" name="Damage (M)" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <p className="analytics-note">
                            Placeholder values comparing “current build” vs a few optimizer results.
                        </p>
                    </div>
                </section>

                <section className="analytics-card analytics-card--square">
                    <div className="analytics-card-header">
                        <h4 className="analytics-title">Stat Profile</h4>
                        <span className="analytics-subtitle">Current vs candidate</span>
                    </div>
                    <div className="analytics-body">
                        <div className="analytics-chart-wrapper">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart data={statProfileData}>
                                    <PolarGrid />
                                    <PolarAngleAxis dataKey="stat" tick={{ fontSize: 10 }} />
                                    <PolarRadiusAxis tick={{ fontSize: 8 }} />
                                    <Radar name="Current" dataKey="current" fillOpacity={0.25} />
                                    <Radar name="Candidate" dataKey="candidate" fillOpacity={0.25} />
                                    <Legend />
                                    <Tooltip />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                        <p className="analytics-note">
                            Dummy values: later this will use stat totals for current vs a selected result.
                        </p>
                    </div>
                </section>
            </div>

            {/* ROW 2: scrollable strip of the rest */}
            <div className="analytics-row analytics-row--scroll">
                <section className="analytics-card analytics-card--tall">
                    <div className="analytics-card-header">
                        <h4 className="analytics-title">Damage vs Crit Rate</h4>
                        <span className="analytics-subtitle">Stat vs DPS trend</span>
                    </div>
                    <div className="analytics-body">
                        <div className="analytics-chart-wrapper">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={damageVsCritData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="critRate" tickFormatter={(v) => `${v}%`} />
                                    <YAxis tickFormatter={(v) => v.toFixed(2) + "M"} />
                                    <Tooltip
                                        labelFormatter={(v) => `Crit Rate: ${v}%`}
                                        formatter={(v) => `${v.toFixed(2)}M`}
                                    />
                                    <Legend />
                                    <Line type="monotone" dataKey="dmg" name="Damage (M)" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        <p className="analytics-note">
                            Dummy points; eventually this becomes a generic “pick a stat” trend chart.
                        </p>
                    </div>
                </section>

                <section className="analytics-card analytics-card--tall">
                    <div className="analytics-card-header">
                        <h4 className="analytics-title">Substat Quality vs Damage</h4>
                        <span className="analytics-subtitle">Echo roll quality</span>
                    </div>
                    <div className="analytics-body">
                        <div className="analytics-chart-wrapper">
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        type="number"
                                        dataKey="quality"
                                        name="Quality"
                                        tickFormatter={(v) => `${v}%`}
                                    />
                                    <YAxis
                                        type="number"
                                        dataKey="dmg"
                                        name="Damage"
                                        tickFormatter={(v) => v.toFixed(2) + "M"}
                                    />
                                    <Tooltip
                                        cursor={{ strokeDasharray: "3 3" }}
                                        formatter={(v, name) =>
                                            name === "quality" ? `${v}%` : `${v.toFixed(2)}M`
                                        }
                                        labelFormatter={() => ""}
                                    />
                                    <Scatter name="Builds" data={substatQualityData} />
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                        <p className="analytics-note">
                            Fake correlation between “total substat score” and damage.
                        </p>
                    </div>
                </section>

                <section className="analytics-card analytics-card--tall">
                    <div className="analytics-card-header">
                        <h4 className="analytics-title">Cost Efficiency</h4>
                        <span className="analytics-subtitle">Damage vs total cost</span>
                    </div>
                    <div className="analytics-body">
                        <div className="analytics-chart-wrapper">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={costEfficiencyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="cost" />
                                    <YAxis
                                        yAxisId="left"
                                        tickFormatter={(v) => v.toFixed(2) + "M"}
                                    />
                                    <YAxis
                                        yAxisId="right"
                                        orientation="right"
                                        tickFormatter={(v) => (v * 100).toFixed(0) + "%"}
                                    />
                                    <Tooltip
                                        formatter={(v, name) =>
                                            name === "bestDmg"
                                                ? `${v.toFixed(2)}M`
                                                : `${(v * 100).toFixed(1)}%`
                                        }
                                    />
                                    <Legend />
                                    <Line
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="bestDmg"
                                        name="Best DMG (M)"
                                    />
                                    <Line
                                        yAxisId="right"
                                        type="monotone"
                                        dataKey="delta"
                                        name="Δ vs cost 12"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        <p className="analytics-note">
                            Dummy frontier: best damage found at each cost value.
                        </p>
                    </div>
                </section>

                <section className="analytics-card analytics-card--tall">
                    <div className="analytics-card-header">
                        <h4 className="analytics-title">Main Stat Choice Impact</h4>
                        <span className="analytics-subtitle">Main echo variants</span>
                    </div>
                    <div className="analytics-body">
                        <div className="analytics-chart-wrapper">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={mainStatChoiceData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <XAxis dataKey="mainStat" tick={{ fontSize: 10 }} />
                                    <YAxis tickFormatter={(v) => v.toFixed(2) + "M"} />
                                    <Tooltip
                                        formatter={(v, name) =>
                                            name === "bestDmg"
                                                ? `${v.toFixed(2)}M`
                                                : `${(v * 100).toFixed(1)}%`
                                        }
                                    />
                                    <Legend />
                                    <Bar dataKey="bestDmg" name="Best DMG (M)" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <p className="analytics-note">
                            Placeholder damage values for different main stats on the locked main echo.
                        </p>
                    </div>
                </section>
            </div>
        </div>
    );
}