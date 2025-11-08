import React, {useEffect} from 'react';
import { getSkillDamageCache } from '../utils/skillDamageCache';


function formatNumber(num) {
    if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B';
    if (num >= 10000000) return (num / 1000000).toFixed(1) + 'M';
    return Math.round(num).toLocaleString();
}

export default function Rotations({ rotationEntries, characterRuntimeStates, charId, skillResults }) {
    if (!Array.isArray(rotationEntries) || rotationEntries.length === 0) return null;

    const skillCache = characterRuntimeStates[charId]?.allSkillResults ?? skillResults ?? getSkillDamageCache();
    const safeEntries = Array.isArray(rotationEntries) ? rotationEntries : [];
    const { total, supportTotals, breakdownMap } = calculateRotationTotals(skillCache, safeEntries);

    return (
        <>
            <h3 className="damage-box-title">Rotation</h3>
            <div className="damage-grid">
                <div></div>
                <div>Normal</div>
                <div>CRIT</div>
                <div>AVG</div>

                <div>Total DMG</div>
                <div>{formatNumber(Math.round(total.normal))}</div>
                <div>{formatNumber(Math.round(total.crit))}</div>
                <div>{formatNumber(Math.round(total.avg))}</div>

                {Object.entries(breakdownMap)
                    .sort((a, b) => b[1].avg - a[1].avg)
                    .map(([type, dmg]) => {
                        const percent = total.avg > 0 ? (dmg.avg / total.avg) * 100 : 0;
                        return (
                            <React.Fragment key={type}>
                                <div style={{ color: '#999' }}>
                                    ({percent.toFixed(1)}%) {type}
                                </div>
                                <div style={{ color: '#999' }}>{formatNumber(Math.round(dmg.normal))}</div>
                                <div style={{ color: '#999' }}>{formatNumber(Math.round(dmg.crit))}</div>
                                <div style={{ color: '#999' }}>{formatNumber(Math.round(dmg.avg))}</div>
                            </React.Fragment>
                        );
                    })}

                {supportTotals.healing > 0 && (
                    <>
                        <div style={{ color: 'limegreen', fontWeight: 'bold' }}>Total Healing</div>
                        <div></div>
                        <div></div>
                        <div style={{ color: 'limegreen', fontWeight: 'bold' }}>
                            {formatNumber(Math.round(supportTotals.healing))}
                        </div>
                    </>
                )}

                {supportTotals.shielding > 0 && (
                    <>
                        <div style={{ color: '#838383', fontWeight: 'bold' }}>Total Shield</div>
                        <div></div>
                        <div></div>
                        <div style={{ color: '#838383', fontWeight: 'bold' }}>
                            {Math.round(supportTotals.shielding).toLocaleString()}
                        </div>
                    </>
                )}
            </div>
        </>
    );
}

export function TeamRotation({ mainCharId, characterRuntimeStates, characterStates, setCharacterRuntimeStates, result }) {
    if (!mainCharId || !characterRuntimeStates?.[mainCharId]) return null;

    const runtime = characterRuntimeStates[mainCharId];
    const team = runtime.Team ?? [];
    if (team.length < 1) return null;

    if (!result) return null;

    const { teamTotal, characterContributions } = result;

    useEffect(() => {
        if (!mainCharId || teamTotal.avg === 0) return;

        setCharacterRuntimeStates(prev => {
            const prevTotal = prev[mainCharId]?.teamRotationSummary?.total ?? {};
            const isSame =
                Math.round(prevTotal.avg) === Math.round(teamTotal.avg) &&
                Math.round(prevTotal.crit) === Math.round(teamTotal.crit) &&
                Math.round(prevTotal.normal) === Math.round(teamTotal.normal);

            if (isSame) return prev;

            return {
                ...prev,
                [mainCharId]: {
                    ...(prev[mainCharId] ?? {}),
                    teamRotationSummary: {
                        name: runtime.Name ?? '',
                        total: teamTotal
                    }
                }
            };
        });
    }, [characterRuntimeStates]);

    return (
        <>
            <h3 className="damage-box-title">Team Rotation</h3>
            <div className="damage-grid">
                <div></div>
                <div>Normal</div>
                <div>CRIT</div>
                <div>AVG</div>

                <div>Total Team DMG</div>
                <div>{formatNumber(Math.round(teamTotal.normal))}</div>
                <div>{formatNumber(Math.round(teamTotal.crit))}</div>
                <div>{formatNumber(Math.round(teamTotal.avg))}</div>

                {characterContributions.map(({ id, total }) => {
                    const char = characterStates.find(c => String(c.Id) === String(id));
                    const percent = total.avg / teamTotal.avg * 100;

                    return (
                        <React.Fragment key={id}>
                            <div style={{ color: '#999' }}>
                                ({percent.toFixed(1)}%) {char?.Name ?? 'Unknown'}
                            </div>
                            <div style={{ color: '#999' }}>{formatNumber(Math.round(total.normal))}</div>
                            <div style={{ color: '#999' }}>{formatNumber(Math.round(total.crit))}</div>
                            <div style={{ color: '#999' }}>{formatNumber(Math.round(total.avg))}</div>
                        </React.Fragment>
                    );
                })}
            </div>
        </>
    );
}

function getSkillType(entry) {
    const detail = entry.detail?.toLowerCase?.() ?? '';

    if (detail.includes('basic')) return 'Basic Attack';
    if (detail.includes('heavy')) return 'Heavy Attack';
    if (detail === 'resonance skill') return 'Resonance Skill';
    if (detail.includes('liberation')) return 'Resonance Liberation';
    if (detail.includes('intro')) return 'Intro Skill';
    if (detail.includes('outro')) return 'Outro Skill';
    if (detail.includes('frazzle')) return 'Spectro Frazzle';
    if (detail.includes('erosion')) return 'Aero Erosion';
    if (detail.includes('echo')) return 'Echo Skill';
    return 'Other';
}

export function calculateRotationTotals(skillCache, rotationEntries) {
    const total = { normal: 0, crit: 0, avg: 0 };
    const supportTotals = { healing: 0, shielding: 0 };
    const breakdownMap = {};

    if (!Array.isArray(rotationEntries) || !skillCache) return { total, supportTotals, breakdownMap };

    for (const entry of rotationEntries) {
        if (entry?.type === 'block' || entry?.disabled) continue;
        const multiplier = entry.multiplier ?? 1;

        const source = entry.locked ? entry.snapshot : skillCache?.find(
            s => s.name === entry.label && s.tab === entry.tab
        );

        if (!source || source.visible === false) continue;

        const isSupport = source.isSupportSkill;
        const avg = (source.avg ?? 0) * multiplier;
        const normal = (source.normal ?? 0) * multiplier;
        const crit = (source.crit ?? 0) * multiplier;

        if (isSupport) {
            if (source.supportColor === 'limegreen') {
                supportTotals.healing += avg;
            } else {
                supportTotals.shielding += avg;
            }
            continue;
        }

        total.normal += normal;
        total.crit += crit;
        total.avg += avg;

        const type = getSkillType(entry);
        if (!breakdownMap[type]) {
            breakdownMap[type] = { normal: 0, crit: 0, avg: 0 };
        }

        breakdownMap[type].normal += normal;
        breakdownMap[type].crit += crit;
        breakdownMap[type].avg += avg;
    }
    return { total, supportTotals, breakdownMap };
}

export function getTeamRotationTotal(mainCharId, characterRuntimeStates, skillResults) {
    if (!mainCharId || !characterRuntimeStates?.[mainCharId]) return null;

    const runtime = characterRuntimeStates[mainCharId];
    const team = runtime.Team ?? [];
    if (team.length < 1) return null;

    const teamTotal = { normal: 0, crit: 0, avg: 0 };
    const characterContributions = [];

    const mainResult = calculateRotationTotals(skillResults ?? runtime.allSkillResults, runtime.rotationEntries);
    if (mainResult?.total && !isZero(mainResult.total)) {
        characterContributions.push({ id: mainCharId, total: mainResult.total });
        accumulate(teamTotal, mainResult.total);
    }

    const teamRotation = runtime?.teamRotation ?? {};

    team.slice(1, 3).forEach((teammateId, i) => {
        const toggleKey = `teammateRotation-${i + 1}`;
        const isEnabled = runtime?.activeStates?.[toggleKey];
        if (!isEnabled) return;

        const selected = teamRotation[teammateId];
        if (!selected?.total || isZero(selected.total)) return;

        characterContributions.push({ id: teammateId, total: selected.total });
        accumulate(teamTotal, selected.total);
    });

    return teamTotal.avg === 0 ? null : { teamTotal, characterContributions };
}

function accumulate(total, toAdd) {
    total.normal += toAdd.normal ?? 0;
    total.crit += toAdd.crit ?? 0;
    total.avg += toAdd.avg ?? 0;
}

function isZero(total) {
    return [total.normal, total.crit, total.avg].every(val => Math.round(val) === 0);
}

export function getMainRotationTotals(mainCharId, characterRuntimeStates, savedRotations = [], savedTeamRotations = [], skillResults) {
    const personalRotations = [];
    const teamRotations = [];

    const runtime = characterRuntimeStates[mainCharId];

    const hasLiveData = runtime &&
        Array.isArray(skillResults ?? runtime.allSkillResults) &&
        Array.isArray(runtime.rotationEntries);

    if (hasLiveData) {
        const liveTotal = calculateRotationTotals(skillResults ?? runtime.allSkillResults, runtime.rotationEntries);
        const { normal, crit, avg } = liveTotal.total;
        if (normal !== 0 || crit !== 0 || avg !== 0) {
            personalRotations.push({
                ...liveTotal,
                name: runtime?.Name,
                id: 'live'
            });
        }
    }

    const charSavedRotations = savedRotations.filter(
        (r) => String(r.characterId) === String(mainCharId)
    );

    charSavedRotations.forEach((saved, index) => {
        const { normal, crit, avg } = saved.total ?? {};
        if (normal !== 0 || crit !== 0 || avg !== 0) {
            personalRotations.push({
                total: saved.total,
                name: saved.characterName,
                id: `saved-${index}`,
                breakdownMap: saved.breakdownMap
            });
        }
    });

    const teamRotation = characterRuntimeStates[mainCharId]?.teamRotation ?? {};
    const activeStates = characterRuntimeStates[mainCharId]?.activeStates ?? {};

    const toggleKeys = ["teammateRotation-1", "teammateRotation-2"];
    const hasValidTeamRotation = (
        characterRuntimeStates[mainCharId]?.Team?.length > 1 &&
        Object.keys(teamRotation).length > 0 &&
        (activeStates[toggleKeys[0]] || activeStates[toggleKeys[1]])
    );

    if (hasValidTeamRotation) {
        const liveTotal = getTeamRotationTotal(mainCharId, characterRuntimeStates, skillResults);
        const { normal, crit, avg } = liveTotal?.teamTotal ?? { normal: 0, crit: 0, avg: 0 };
        if (normal !== 0 || crit !== 0 || avg !== 0 || liveTotal) {
            teamRotations.push({
                name: runtime?.Name,
                id: 'live Team',
                total: liveTotal?.teamTotal,
                contributors: liveTotal?.characterContributions
            });
        }
    }

    const charTeamRotations = savedTeamRotations.filter(
        (r) => String(r.charId) === String(mainCharId)
    );

    charTeamRotations.forEach((saved, index) => {
        const contributors = getTeamRotationTotal(mainCharId, { [mainCharId]: saved.fullCharacterState }, skillResults).characterContributions;
        const { normal, crit, avg } = saved.total ?? {};
        if (normal !== 0 || crit !== 0 || avg !== 0) {
            teamRotations.push({
                total: saved.total,
                name: saved.name,
                id: `team-${index}`,
                contributors: contributors ?? {}
            });
        }
    });

    return { personalRotations, teamRotations };
}