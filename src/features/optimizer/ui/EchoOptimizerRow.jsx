import React from "react";
import { highlightKeywordsInText } from "@/constants/echoSetData.jsx";
import { echoSetById, echoSetList, setPieceTypeMap, setIconMap } from "@/constants/echoSetData2.js";
import {typeMap} from "@/constants/skillTabs.js";
import {applySpecialBuffs} from "@/features/optimizer/core/echoOptimizerContext.js";
import {Tooltip} from "antd";
import {formatDescription} from "@/utils/echoHelper.js";
import {normalizedSkillTypeNames} from "@/features/rotations/ui/Rotations.jsx";

export function accumulateSkillStatBonus(skillType, stats, skillMetaBonus = 0, bonusType = 'dmgBonus') {
    const typeList = Array.isArray(skillType) ? skillType : [skillType];
    let sum = 0;
    for (const type of typeList) {
        if (!type || typeof type !== "string") continue;
        const normalized = type.trim();
        const mapped = typeMap[normalized] ?? null;
        let path = 0;
        if (mapped) path = stats.skillType ? stats.skillType[mapped][bonusType] : stats[mapped];
        sum += path ?? 0;
    }
    return sum + skillMetaBonus;
}

export default function EchoOptimizerRow({
                                             echoData,
                                             setPlan = [],
                                             statTotals = {},
                                             mergedBuffs,
                                             skill,
                                             onClick,
                                             base = false,
                                             damage,
                                             finalStats,
                                             skillMeta = {},
                                             charId = null,
                                             keywords,
                                             sequence = 0
                                         }) {
    const entries = (setPlan ?? []).flatMap(s => {
        const validPieces = setPieceTypeMap[s.setId] || [];
        const activePieces = validPieces.filter(piece => s.count >= piece);

        if (activePieces.includes(5)) {
            return [{ setId: s.setId, piece: 5 }];
        }
        return activePieces.map(piece => ({
            setId: s.setId,
            piece
        }));
    });

    const mainEcho = echoData[0];

    function renderSetBadges() {
        if (entries.length === 0) return <span className="empty-set">...</span>;

        return entries.map(entry => (
            <span key={`${entry.setId}-${entry.piece}`} className="set-badge">
                <img
                    src={setIconMap[entry.setId]}
                    alt={entry.setId}
                    className="set-icon"
                />
                × {entry.piece}
            </span>
        ));
    }

    const bonus = (() => {
        const stats = base ? mergedBuffs : statTotals;
        let b = accumulateSkillStatBonus(
            skill.skillType,
            stats,
            skillMeta?.skillDmgBonus ?? 0
        );
        const path =
            stats?.[skill.element] ?? stats?.attribute[skill.element]?.dmgBonus ?? 0;
        b += path;
        return b;
    })();

    const amp = (() => {
        let a = accumulateSkillStatBonus(
            skill.skillType,
            mergedBuffs,
            skillMeta?.amplify ?? 0,
            'amplify'
        );
        const path = mergedBuffs?.attribute[skill.element]?.amplify ?? 0;
        a += path;
        return a;
    })();

    const stats = {
        atk: base ? finalStats.atk.final : statTotals.finalAtk +
            applySpecialBuffs({energyRegen: statTotals.er}, {}, charId, 'atk').atk,
        hp: base ? finalStats.hp.final : statTotals.finalHp,
        def: base ? finalStats.def.final : statTotals.finalDef,
        er: base ? finalStats.energyRegen : statTotals.er,
        cr: base ? finalStats.critRate : statTotals.cr,
        cd: base ? finalStats.critDmg : statTotals.cd +
            applySpecialBuffs({critRate: statTotals.cr, critDmg: statTotals.cd}, {}, charId, 'critDmg', sequence).critDmg,
        bonus: (base ? bonus : (statTotals.dmgBonus ?? 0) + bonus),
        amp: (base ? amp : (statTotals.dmgAmp ?? 0))
    }

    const diff = !base ? ((damage / skill.avg) * 100).toFixed(2) : "100.00";

    const totalCost = echoData.reduce((s, e) => s + (e?.cost || 0), 0);

    const skillTypeText = formatSkillTypeNames(
        skill.skillType,
        normalizedSkillTypeNames
    );

    const sonataSummary = formatSonataSets(setPlan, echoSetById);

    return (
        <div
            className="rotation-item optimizer-result-item"
            onClick={onClick}
        >
            {/*<Tooltip
                title={
                    <div className="tool-tip-content optimizer-row">
                        <span className="highlight">Sonata Set(s)</span>
                        <div className="tool-tip-section">
                            <p>{sonataSummary}</p>
                        </div>
                    </div>
                }
                placement="top"
                mouseEnterDelay={1}
            >
            </Tooltip>

            <Tooltip
                title={
                    mainEcho ?
                        <div className="tool-tip-content optimizer-row">
                            <span className="highlight">Main Echo - {mainEcho.name}</span>
                            <div className="tool-tip-section">
                                <p>
                                    {highlightKeywordsInText(
                                        formatDescription(mainEcho.rawDesc, mainEcho.rawParams[4]),
                                        [mainEcho.name, ...keywords]
                                    )}
                                </p>
                            </div>
                        </div>
                        : null
                }
                placement="top"
                mouseEnterDelay={1}
            >
            </Tooltip>

            <Tooltip
                title={totalCost ? <EchoCostTooltip echoData={echoData}/> : null}
                placement="top"
                mouseEnterDelay={1}
            >
            </Tooltip>

            <Tooltip
                title={
                    <div className="tool-tip-content optimizer-row">
                        <span className="highlight">Total Attack</span>
                        <div className="tool-tip-section">
                            <p>
                                {highlightKeywordsInText(
                                    `This is this build's total ATTACK.`,
                                    keywords,
                                )}
                            </p>
                        </div>
                    </div>
                }
                placement="top"
                mouseEnterDelay={1}
            >
            </Tooltip>

            <Tooltip
                title={
                    <div className="tool-tip-content optimizer-row">
                        <span className="highlight">Total Hit Points</span>
                        <div className="tool-tip-section">
                            <p>
                                {highlightKeywordsInText(
                                    `This is this build's total HP.`,
                                    keywords,
                                )}
                            </p>
                        </div>
                    </div>
                }
                placement="top"
                mouseEnterDelay={1}
            >
            </Tooltip>

            <Tooltip
                title={
                    <div className="tool-tip-content optimizer-row">
                        <span className="highlight">Total Defence</span>
                        <div className="tool-tip-section">
                            <p>
                                {highlightKeywordsInText(
                                    `This is this build's total DEFENCE.`,
                                    keywords,
                                )}
                            </p>
                        </div>
                    </div>
                }
                placement="top"
                mouseEnterDelay={1}
            >
            </Tooltip>

            <Tooltip
                title={
                    <div className="tool-tip-content optimizer-row">
                        <span className="highlight">Total Energy Regen</span>
                        <div className="tool-tip-section">
                            <p>
                                {highlightKeywordsInText(
                                    `This is this build's total ENERGY REGEN.`,
                                    keywords,
                                )}
                            </p>
                        </div>
                    </div>
                }
                placement="top"
                mouseEnterDelay={1}
            >
            </Tooltip>


            <Tooltip
                title={
                    <div className="tool-tip-content optimizer-row">
                        <span className="highlight">Total Critical Hit Rate</span>
                        <div className="tool-tip-section">
                            <p>
                                {highlightKeywordsInText(
                                    `This is this build's total CRIT. RATE.`,
                                    keywords,
                                )}
                            </p>
                        </div>
                    </div>
                }
                placement="top"
                mouseEnterDelay={1}
            >
            </Tooltip>

            <Tooltip
                title={
                    <div className="tool-tip-content optimizer-row">
                        <span className="highlight">Total Critical Hit Damage</span>
                        <div className="tool-tip-section">
                            <p>
                                {highlightKeywordsInText(
                                    `This is this build's total CRIT. DMG.`,
                                    keywords,
                                )}
                            </p>
                        </div>
                    </div>
                }
                placement="top"
                mouseEnterDelay={1}
            >
            </Tooltip>

            <Tooltip
                title={
                    <div className="tool-tip-content optimizer-row">
                        <span className="highlight">Total Damage Bonus</span>
                        <div className="tool-tip-section">
                            <p>
                                {highlightKeywordsInText(
                                    `This is the total damage bonus applied to ${skill.label ?? skill.name}. 
                                        It combines damage bonus from ${capitalizeWords(skill.element)}${
                                        skillTypeText ? `, ${skillTypeText}` : ''
                                    } and any generic damage bonus sources, for a total of ${stats.bonus.toFixed(1)}%.`,
                                    keywords,
                                )}
                            </p>
                        </div>
                    </div>
                }
                placement="top"
                mouseEnterDelay={1}
            >
            </Tooltip>

            <Tooltip
                title={
                    <div className="tool-tip-content optimizer-row">
                        <span className="highlight">Total Damage Amplify</span>
                        <div className="tool-tip-section">
                            <p>
                                {highlightKeywordsInText(
                                    `This is the total damage amplify applied to ${skill.label ?? skill.name}. 
                                        It combines damage amplify from ${capitalizeWords(skill.element)}${
                                        skillTypeText ? `, ${skillTypeText}` : ''
                                    } and any generic damage amplify sources, for a total of ${stats.bonus.toFixed(1)}%.`,
                                    keywords,
                                )}
                            </p>
                        </div>
                    </div>
                }
                placement="top"
                mouseEnterDelay={1}
            >
            </Tooltip>

            <Tooltip
                title={
                    <div className="tool-tip-content optimizer-row">
                        <span className="highlight">Damage</span>
                        <div className="tool-tip-section">
                            <p>
                                {highlightKeywordsInText(
                                    `This is this build's AVERAGE damage calculated for ${skill.label ?? skill.name}.`,
                                    keywords,
                                )}
                            </p>
                        </div>
                    </div>
                }
                placement="top"
                mouseEnterDelay={1}
            >
            </Tooltip>

            <Tooltip
                title={
                    <div className="tool-tip-content optimizer-row">
                        <span className="highlight">Build Efficiency</span>
                        <div className="tool-tip-section">
                            <p>
                                {highlightKeywordsInText(
                                    `This echo setup performs at ${diff}% of the base build for ${skill.label ?? skill.name}.`,
                                    keywords,
                                )}
                            </p>
                        </div>
                    </div>
                }
                placement="top"
                mouseEnterDelay={1}
            >
            </Tooltip>*/}
            <div className="col sets echo-buff">{renderSetBadges()}</div>

            <div className="col main-echo echo-buff">
                {mainEcho ? (
                    <img
                        src={mainEcho.icon}
                        alt={mainEcho.name}
                        className="header-icon"
                        loading="lazy"
                        onError={e => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "/assets/echoes/default.webp";
                            e.currentTarget.classList.add("fallback-icon");
                        }}
                    />
                ) : (
                    <span>...</span>
                )}
            </div>

            <div className="col cost echo-buff">
                {totalCost || "..."}
            </div>

            <div className="col atk echo-buff">{Math.floor(stats.atk)}</div>

            <div className="col hp echo-buff">{Math.floor(stats.hp)}</div>

            <div className="col def echo-buff">{Math.floor(stats.def ?? 0)}</div>

            <div className="col er echo-buff">{(stats.er ?? 0).toFixed(1)}</div>

            <div className="col cr echo-buff">{(stats.cr ?? 0).toFixed(1)}</div>

            <div className="col cd echo-buff">{(stats.cd ?? 0).toFixed(1)}</div>

            <div className="col bonus echo-buff">{stats.bonus.toFixed(1)}</div>

            <div className="col amp echo-buff">{stats.amp.toFixed(1)}</div>

            <div className="col dmg echo-buff avg">{Math.floor(damage)}</div>

            <div className="col diff echo-buff">{diff}%</div>

        </div>
    );
}

function EchoCostTooltip({ echoData }) {
    const costs = echoData.map(e => e?.cost ?? 0);
    const totalCost = costs.reduce((sum, c) => sum + c, 0);

    return (
        <div className="tool-tip-content optimizer-row">
            <span className="highlight">Costs</span>
            <div className="tool-tip-section">
                <p>
                    {costs.join(" + ")} = <strong>{totalCost}</strong>
                </p>
            </div>
        </div>
    );
}

function capitalizeWords(str) {
    if (!str) return "";
    return str
        .split(" ")
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
}

function formatSkillTypeNames(skillType, normalizedSkillTypeNames) {
    const types = Array.isArray(skillType) ? skillType : [skillType];

    const names = types
        .map(t => normalizedSkillTypeNames[t] ?? t)
        .filter(Boolean);

    if (names.length === 0) return '';

    if (names.length === 1) return names[0];

    if (names.length === 2) return `${names[0]}, ${names[1]}`;

    return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

function formatSonataSets(setPlan, echoSets) {
    if (!Array.isArray(setPlan) || setPlan.length === 0) {
        return "No active Sonata sets";
    }

    return setPlan
        .filter(s => s && s.setId != null && s.count > 0)
        .map(s => {
            const def = echoSets?.[s.setId];
            const setName = def?.name ?? `Set ${s.setId}`;
            return `${s.count}pc ${setName}`;
        })
        .join(" + ");
}
