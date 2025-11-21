import React from "react";
import {setIconMap, setPieceTypeMap} from "../../constants/echoSetData.jsx";
import {typeMap} from "../../constants/skillTabs.js";

export default function EchoOptimizerRow({
                                             echoData,
                                             setPlan,
                                             statTotals = {},
                                             mergedBuffs,
                                             skill,
                                             onClick,
                                             base = false,
                                             damage,
                                             finalStats,
                                             skillMeta = {}
                                         }) {
    function accumulateSkillStatBonus(skillType, stats, skillMetaBonus = 0) {
        const typeList = Array.isArray(skillType) ? skillType : [skillType];
        let sum = 0;
        for (const type of typeList) {
            if (!type || typeof type !== "string") continue;
            const normalized = type.trim();
            const mapped = typeMap[normalized];

            if (mapped) sum += stats[mapped] ?? stats[normalized] ?? 0;
        }
        return sum + skillMetaBonus;
    }

    const entries = setPlan.flatMap(s => {
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
        b += (stats?.[skill.element] ?? 0);
        return b;
    })();

    const amp = (() => {
        let a = accumulateSkillStatBonus(
            skill.skillType,
            mergedBuffs?.damageTypeAmplify ?? 0,
            skillMeta?.amplify ?? 0,
        );
        a += mergedBuffs?.elementDmgAmplify?.[skill.element] ?? 0;
        return a;
    })();

    const stats = {
        atk: base ? finalStats.atk : statTotals.atk,
        hp: base ? finalStats.hp : statTotals.hp,
        def: base ? finalStats.def : statTotals.def,
        er: base ? finalStats.energyRegen : statTotals.er,
        cr: base ? finalStats.critRate : statTotals.cr,
        cd: base ? finalStats.critDmg : statTotals.cd,
        bonus: (base ? bonus : (statTotals.dmgBonus ?? 0) + bonus),
        amp: (base ? amp : (statTotals.dmgAmp ?? 0))
    }

    const diff = !base ? ((damage / skill.avg) * 100).toFixed(2) : "100.00";

    return (
        <div
            className="rotation-item optimizer-result-item"
            onClick={onClick}
        >
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
                {echoData.reduce((s, e) => s + (e?.cost || 0), 0) || "..."}
            </div>

            <div className="col atk echo-buff">{Math.floor(stats.atk)}</div>
            <div className="col hp echo-buff">{Math.floor(stats.hp)}</div>
            <div className="col def echo-buff">{Math.floor(stats.def ?? 0)}</div>
            <div className="col er echo-buff">{(stats.er ?? 0).toFixed(1)}</div>
            <div className="col cr echo-buff">{(stats.cr ?? 0).toFixed(1)}</div>
            <div className="col cd echo-buff">{(stats.cd ?? 0).toFixed(1)}</div>

            <div className="col bonus echo-buff">{stats.bonus.toFixed(1)}</div>
            <div className="col amp echo-buff">{stats.amp.toFixed(1)}</div>

            <div className="col dmg echo-buff avg">{Math.floor(damage)}{/*{damage}*/}</div>
            <div className="col diff echo-buff">{diff}%</div>
        </div>
    );
}