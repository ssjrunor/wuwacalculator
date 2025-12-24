import React from 'react';
import { attributeColors } from '@/utils/attributeHelpers.js';
import DropdownSelect from "@/components/common/DropdownSelect.jsx";

export const echoBuffList = []; // if other code imports this, we’ll fill it in later if needed

export default function EchoBuffs({
                                      activeStates,
                                      toggleState,
                                      characterId,
                                      characterRuntimeStates,
                                      setCharacterRuntimeStates
                                  }) {
    const updateActiveState = (key, value) => {
        setCharacterRuntimeStates(prev => ({
            ...prev,
            [characterId]: {
                ...(prev[characterId] ?? {}),
                activeStates: {
                    ...(prev[characterId]?.activeStates ?? {}),
                    [key]: value
                }
            }
        }));
    };

    const lawOfHarmonyStacks = activeStates?.lawOfHarmony ?? 0;
    const handleLawOfHarmonyChange = (newValue) => {
        updateActiveState('lawOfHarmony', newValue);
    };

    const neonOffTuneRate = activeStates?.neonlightOffTune ?? 0;
    const handleNeonOffTuneChange = (e) => {
        const raw = Number(e.target.value);
        const safe = Number.isFinite(raw) ? raw : 0;
        const clamped = Math.max(0, Math.min(safe, 50));
        updateActiveState('neonlightOffTune', clamped);
    };

    const starryOffTuneRate = activeStates?.starryRadiance ?? 0;
    const handleStarryChange = (e) => {
        const raw = Number(e.target.value);
        const safe = Number.isFinite(raw) ? raw : 0;
        const clamped = Math.max(0, Math.min(safe, 125));
        updateActiveState('starryRadiance', clamped);
    };

    const echoBuffs = [
        {
            key: 'rejuvenatingGlow',
            name: 'Rejuvenating Glow',
            icon: '/assets/echo-icons/rejuvenatingGlow.webp',
            effect: (
                <>
                    Increases the ATK of all party members by <span className="highlight">15%</span> for <span className="highlight">30s</span> upon healing allies.
                </>
            )
        },
        {
            key: 'moonlitClouds',
            name: 'Moonlit Clouds',
            icon: '/assets/echo-icons/moonlitClouds.webp',
            effect: (
                <>
                    Upon using Outro Skill, increases the ATK of the next Resonator by <span className="highlight">22.5%</span> for <span className="highlight">15s</span>.
                </>
            )
        },
        {
            key: 'midnightVeil',
            name: 'Midnight Veil',
            icon: '/assets/echo-icons/midnightVeil.webp',
            effect: (
                <>
                    When Outro Skill is triggered, deal additional <span className="highlight">480%</span> Havoc DMG to surrounding enemies, considered Outro Skill DMG, and grant the incoming Resonator{" "}
                    <span className="highlight">15%</span>{" "}
                    <span style={{ color: attributeColors['havoc'], fontWeight: 'bold' }}>Havoc DMG Bonus</span>{" "}
                    for <span className="highlight">15s</span>.
                </>
            )
        },
        {
            key: 'empyreanAnthem',
            name: 'Empyrean Anthem',
            icon: '/assets/echo-icons/empyreanAnthem.webp',
            effect: (
                <>
                    Upon a critical hit of Coordinated Attack, increase the active Resonator&apos;s ATK by{" "}
                    <span className="highlight">20%</span> for <span className="highlight">4s</span>.
                </>
            )
        },
        {
            key: 'gustsOfWelkin',
            name: 'Gusts of Welkin',
            icon: '/assets/echo-icons/gustsOfWelkin.webp',
            effect: (
                <>
                    Inflicting Aero Erosion increases{" "}
                    <span style={{ color: attributeColors['aero'], fontWeight: 'bold' }}>Aero DMG</span>{" "}
                    for all Resonators in the team by <span className="highlight">15%</span>.
                </>
            )
        },
        {
            key: 'clawprint',
            name: 'Flaming Clawprint',
            icon: '/assets/echo-icons/flamingClawprint.webp',
            effect: (
                <>
                    Casting Resonance Liberation increases{" "}
                    <span style={{ color: attributeColors['fusion'], fontWeight: 'bold' }}>Fusion DMG</span>{" "}
                    of Resonators in the team by <span className="highlight">15%</span>.
                </>
            )
        },
        {
            key: 'lawOfHarmony',
            name: 'Law of Harmony',
            icon: '/assets/echo-icons/lawOfHarmony.webp',
            custom: (
                <DropdownSelect
                    label=""
                    options={[0, 1, 2, 3, 4]}
                    value={lawOfHarmonyStacks}
                    onChange={handleLawOfHarmonyChange}
                    width="80px"
                />
            ),
            effect: (
                <>
                    Casting Echo Skill grants{" "}
                    <span className="highlight">4% Echo Skill DMG Bonus</span> to all Resonators in the team
                    for <span className="highlight">30s</span>, stacking up to 4 times.
                </>
            )
        },
        {
            key: 'neonlightLeap',
            name: 'Pact of Neonlight Leap',
            icon: '/assets/echo-icons/pactOfNeonlightLeap.webp',
            custom: (
                <label className="slider-label-with-input">
                    <input
                        type="number"
                        min={0}
                        max={15 / 0.3}
                        step={1}
                        value={neonOffTuneRate}
                        onChange={handleNeonOffTuneChange}
                        style={{ width: "5rem", textAlign: "right" }}
                        className="character-level-input"
                    />
                </label>
            ),
            effect: (
                <>
                    After casting <span className="highlight">Outro Skill</span>, additionally increases{" "}
                    <span className="highlight">ATK</span> of the next Resonator entering with{" "}
                    <span className="highlight">Intro Skill</span> by <span className="highlight">0.3%</span> up to{" "}
                    <span className="highlight">15%</span> for 15s or until the Resonator is switched out.
                </>
            )
        },
        {
            key: 'starryRadiance',
            name: 'Halo of Starry Radiance',
            icon: '/assets/echo-icons/haloOfStarryRadiance.webp',
            custom: (
                <label className="slider-label-with-input">
                    <input
                        type="number"
                        min={0}
                        max={25 / 0.2}
                        step={1}
                        value={starryOffTuneRate}
                        onChange={handleStarryChange}
                        style={{ width: "5rem", textAlign: "right" }}
                        className="character-level-input"
                    />
                </label>
            ),
            effect: (
                <>
                    When a Resonator heals an ally, every <span className="highlight">1%</span> point of{" "}
                    <span className="highlight">Off-Tune</span> Buildup Rate grants{" "}
                    <span className="highlight">0.2%</span> ATK increase to all Resonators in the team,
                    up to <span className="highlight">25%</span> for 4s.
                </>
            )
        },
        {
            key: 'bellBorne',
            name: 'Bell-Borne Geochelone',
            icon: '/assets/echo-icons/bell-borne.webp',
            className: 'blackify',
            effect: (
                <>
                    Grants <span className="highlight">50.0%</span> DMG Reduction and{" "}
                    <span className="highlight">10.0%</span> DMG Boost to team. Disappears after 3 hits.
                </>
            )
        },
        {
            key: 'impermanenceHeron',
            name: 'Impermanence Heron',
            icon: '/assets/echo-icons/impermanenceHeron.webp',
            className: 'blackify',
            effect: (
                <>
                    If the current character uses their Outro Skill within the next{" "}
                    <span className="highlight">15s</span>, the next character’s damage dealt will be boosted by{" "}
                    <span className="highlight">12%</span>.
                </>
            )
        },

        {
            key: 'fallacy',
            name: 'Fallacy of No Return',
            icon: '/assets/echo-icons/fallacy.webp',
            className: 'blackify',
            effect: (
                <>
                    Increases ATK of all team characters by <span className="highlight">10%</span>, lasting{" "}
                    <span className="highlight">20s</span>.
                </>
            )
        },
        {
            key: 'hyvatia',
            name: 'Hyvatia',
            icon: '/assets/echo-icons/default.webp',
            className: 'blackify',
            effect: (
                <>
                    Casting Outro Skill within 15s immediately afterwards increases the DMG Bonus of the Intro Skill of the Incoming Resonator by <span className="highlight">10.00%</span> for 15s.
                </>
            )
        },
    ];

    // if some other file still relies on echoBuffList export, sync it
    echoBuffList.length = 0;
    echoBuffList.push(...echoBuffs);

    return (
        <div className="echo-buffs">
            {echoBuffs.map(({ key, name, effect, element, icon, className, custom }) => (
                <div className="echo-buff" key={key}>
                    <div className="echo-buff-header">
                        <img
                            src={icon}
                            alt={name}
                            className={`echo-buff-icon ${className ?? ''}`}
                            loading="lazy"
                        />
                        <div
                            className="echo-buff-name"
                            style={element ? { color: attributeColors[element] ?? '#ccc' } : {}}
                        >
                            {name}
                        </div>
                    </div>
                    <div className="echo-buff-effect">{effect}</div>
                    {custom ? (
                        custom
                    ) : (
                        <label className="modern-checkbox">
                            <input
                                type="checkbox"
                                checked={activeStates?.[key] || false}
                                onChange={() => toggleState(key)}
                            />
                            Enable
                        </label>
                    )}
                </div>
            ))}
        </div>
    );
}