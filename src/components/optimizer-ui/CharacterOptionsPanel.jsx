import {imageCache} from "../../pages/calculator.jsx";
import {formatStatValue} from "../weapon-pane/WeaponPane.jsx";
import React from "react";
import AllowedSetDropdown from "./EchoSetSelector.jsx";
import {X} from "lucide-react";

const STAT_LABELS = {
    hp: "Total HP",
    atk: "Total ATK",
    def: "Total DEF",
    critRate: "CRIT Rate",
    critDmg: "CRIT DMG",
    energyRegen: "Energy Regen",
    healingBonus: "Healing Bonus",
    dmgBonus: "DMG Bonus",
    damage: "Damage",
};

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
                                          handleMainEchoChange
                                      }) {
    const rarity = rarityMap[charId];
    const displayName = activeCharacter.displayName.toUpperCase();
    const level = runtime.CharacterLevel;
    const sequence = runtime?.SkillLevels?.sequence ?? 1;
    const src = useSplash ? `/assets/sprite/${charId}.webp` :
        (imageCache[activeCharacter.icon]?.src || activeCharacter.icon);
    const STAT_LIST = Object.entries(STAT_LABELS);

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
                    <div className="mode-switch custom-select small">
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
                        <div className="card-title">Optimizer</div>
                        <div className="dial-row">Target Skill</div>
                        <div className="toggle custom-select small"
                             onClick={() => setShowSkillOptions(true)}
                        >{skill?.name ? ' ◉ ' + skill?.name : "Target Skill"}</div>
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
                        {/*<div className="mini-pill-row">
                            <label>ATK</label>
                            <div className="mini-pill custom-select small">Min</div>
                            <div className="mini-pill custom-select small">Max</div>
                        </div>
                        <div className="mini-pill-row">
                            <label>Exclude</label>
                            <div className="mini-pill custom-select small off">None</div>
                        </div>
                        <div className="mini-pill-row">
                            <label>Enhance</label>
                            <div className="mini-pill custom-select small">+9</div>
                        </div>
                        <div className="mini-pill-row">
                            <label>Rarity</label>
                            <div className="mini-pill custom-select small">5★</div>
                        </div>
                        <div className="mini-pill-row">
                            <label>Mainstat</label>
                            <div className="mini-pill custom-select small">+15</div>
                        </div>
                        <div className="mode-switch custom-select small">
                            <div className="optimizer-toggle btn-primary active">Main</div>
                            <div className="optimizer-toggle">Sub</div>
                        </div>*/}
                    </div>
                    <div className="compact-card buffs-box stats">
                        <div className="card-title">Stat Range Limits</div>
                        {STAT_LIST.map(([statKey, label]) => (
                            <div className="mini-pill-row" key={statKey}>
                                <label>{label}</label>

                                <input className="mini-pill custom-select small" placeholder="Min" type="number"/>
                                <input className="mini-pill custom-select small" placeholder="Max" type="number"/>
                            </div>
                        ))}
                    </div>
                    <div className="compact-card buffs-box stats">
                    </div>
                </div>
            </div>
        </div>
    );
}