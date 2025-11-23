import {imageCache} from "../../pages/calculator.jsx";
import React, {useMemo} from "react";
import AllowedSetDropdown from "./EchoSetSelector.jsx";
import {Info, X} from "lucide-react";
import Select from 'react-select';
import {statLabelMap} from "../../utils/echoHelper.js";
import StatProfileCard from "./StatProfileCard.jsx";
import {STAT_LIST} from "../../optimizer/encodeEchoStats.js";
import {Tooltip} from "antd";
import {mainStatsFilters} from "../../optimizer/optimizerUtils.js";

export function CharacterOptionsPanel({
                                          activeCharacter,
                                          rarityMap,
                                          charId,
                                          triggerRef,
                                          menuOpen,
                                          setMenuOpen,
                                          runtime,
                                          skill,
                                          setShowSkillOptions,
                                          updateGeneralOptimizerSettings,
                                          useSplash,
                                          switchLeftPane,
                                          setOptions,
                                          handleSetOptionChange,
                                          mainEcho,
                                          setEchoMenuOpen,
                                          handleMainEchoChange,
                                          mainStatFilter,
                                          handleMainStatFilterChange,
                                          currentBag,
                                          resEchoes,
                                          charIdForm,
                                          currentContext,
                                          skillMeta,
                                          finalStats,
                                          mergedBuffs,
                                          handleStatLimitChange,
                                          statLimits
                                      }) {
    const rarity = rarityMap[charId];
    const displayName = activeCharacter.displayName.toUpperCase();
    const level = runtime.CharacterLevel;
    const sequence = runtime?.SkillLevels?.sequence ?? 1;
    const src = useSplash ? `/assets/sprite/${charId}.webp` :
        (imageCache[activeCharacter.icon]?.src || activeCharacter.icon);
    const mainStatOptions = Object.entries(mainStatsFilters).map(([value, label]) => ({
        value,
        label
    }));

    return (
        <div className="compact-root">
            <div className="compact-left">
                {activeCharacter && (
                    <img
                        ref={triggerRef}
                        src={src}
                        alt={activeCharacter.displayName}
                        className={`header-icon rarity-${rarity}`}
                        loading="eager"
                        onClick={() => setMenuOpen(!menuOpen)}
                    />
                )}
                <div className="compact-id">
                    <div className="name">{displayName}</div>
                    <div className="meta">Lvl. {level} • S{sequence}</div>
                </div>
                <div className="preset-section">
                    <label>Image Art</label>
                    <div className="toggle mode-switch custom-select small">
                        <div className={`optimizer-toggle ${useSplash ? 'active btn-primary' : ''}`}
                             onClick={() => updateGeneralOptimizerSettings({useSplash: true})}
                        >
                            Use Sprite</div>
                        <div className={`optimizer-toggle ${!useSplash ? 'active btn-primary' : ''}`}
                             onClick={() => updateGeneralOptimizerSettings({useSplash: false})}
                        >
                            Use Icon</div>
                    </div>
                </div>
                <button className="toggle-effect-button optimizer-navigate"
                        onClick={() => switchLeftPane('characters')}
                >Go To Character</button>

            </div>
            <div className="compact-right">
                <div className="compact-grid">
                    <div className="compact-card buffs-box">
                        <div className="section-title-row">
                            <div className="card-title">Optimizer Target</div>
                            <Tooltip
                                title={
                                    <div className="tool-tip-content">
                                        <div className="tool-tip-section">
                                            <span className="highlight">Target Skill</span>
                                            <p>
                                                Choose which skill the optimizer should maximize. Damage is
                                                calculated for this skill when ranking echo builds.
                                            </p>
                                        </div>
                                        <div className="tool-tip-section">
                                            <span className="highlight">Filters</span>
                                            <p>
                                                Limit the search to certain sets, a main echo, and specific
                                                main stats. Tighter filters mean fewer, more focused builds.
                                            </p>
                                        </div>
                                    </div>
                                }
                                placement="rightTop"
                                mouseEnterDelay={0.1}
                            >
                                <span className="icon-help" style={{ cursor: "pointer" }}>
                                    <Info size={16} />
                                </span>
                            </Tooltip>
                        </div>

                        <div className="dial-row">Target Skill</div>
                        <div className="toggle custom-select small"
                             onClick={() => setShowSkillOptions(true)}
                        >{skill?.name ? ' ◉ ' + skill?.name : "Target Skill"}</div>

                        <div className="card-title">Filters</div>
                        <AllowedSetDropdown
                            setOptions={setOptions}
                            handleSetOptionChange={handleSetOptionChange}
                        />
                        <div className="toggle custom-select small"
                             onClick={() => setEchoMenuOpen(true)}>
                            {mainEcho ? (
                                <div className="toggle-inner">
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
                                    {mainEcho?.name ?? 'oops'}
                                    <button
                                        className="remove-teammate-button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleMainEchoChange(null);
                                        }}
                                        style={{ marginLeft: "auto", position: "unset" }}
                                    >
                                        <X size={14} strokeWidth={2.5} />
                                    </button>
                                </div>
                            ) : (
                                <span> ◉ Main Echo</span>
                            )}
                        </div>

                        <div className="dial-row">Main Stat Filters</div>
                        <Select
                            isMulti
                            value={mainStatOptions.filter(o => mainStatFilter?.[o.value])}
                            onChange={(selected) => {
                                const nextFilter = {};
                                (selected || []).forEach(s => {
                                    nextFilter[s.value] = true;
                                });
                                handleMainStatFilterChange(nextFilter);
                            }}
                            options={mainStatOptions}
                            placeholder="Main stats"
                            className="select"
                            classNamePrefix="toggle custom-select"
                            menuPortalTarget={document.body}
                            menuPosition="fixed"
                        />
                    </div>
                    <div className="compact-card buffs-box stats">
                        <div className="card-title">Range Limits</div>
                        {STAT_LIST.map(([statKey, label]) => {
                            const c = statLimits[statKey] ?? {};
                            return (
                                <div className="mini-pill-row" key={statKey}>
                                    <label>{label}</label>

                                    <input
                                        className="mini-pill custom-select small"
                                        placeholder="Min"
                                        type="number"
                                        value={c.minTotal ?? ""}
                                        onChange={e =>
                                            handleStatLimitChange(statKey, "minTotal", e.target.value)
                                        }
                                    />
                                    <input
                                        className="mini-pill custom-select small"
                                        placeholder="Max"
                                        type="number"
                                        value={c.maxTotal ?? ""}
                                        onChange={e =>
                                            handleStatLimitChange(statKey, "maxTotal", e.target.value)
                                        }
                                    />
                                </div>
                            );
                        })}
                        <p className="analytics-note" style={{ margin: 'unset'}}>
                            Set minimum and/or maximum values for each stat (or damage).
                            The optimizer will ignore any echo sets whose final stats fall outside these ranges,
                            and leaving a field blank means “no limit” for that stat.
                        </p>
                    </div>
                    <div className="compact-card buffs-box stats">
                        <StatProfileCard
                            resEchoes={resEchoes}
                            currentBag={currentBag}
                            currentContext={currentContext}
                            charIdForm={charIdForm}
                            skill={skill}
                            skillMeta={skillMeta}
                            mergedBuffs={mergedBuffs}
                            finalStats={finalStats}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}