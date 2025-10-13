import React from 'react';
import { attributeColors } from '../utils/attributeHelpers';
import DropdownSelect from "./DropdownSelect.jsx";
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
                When Outro Skill is triggered, deal additional <span className="highlight">480%</span> Havoc DMG to surrounding enemies, considered Outro Skill DMG, and grant the incoming Resonator <span className="highlight">15%</span> <span style={{ color: attributeColors['havoc'], fontWeight: 'bold' }}>Havoc DMG Bonus</span> for <span className="highlight">15s</span>.
            </>
        )
    },
    {
        key: 'empyreanAnthem',
        name: 'Empyrean Anthem',
        icon: '/assets/echo-icons/empyreanAnthem.webp',
        effect: <>Upon a critical hit of Coordinated Attack, increase the active Resonator's ATK by <span className="highlight">20%</span> for <span className="highlight">4s</span>.</>
    },
    {
        key: 'gustsOfWelkin',
        name: 'Gusts of Welkin',
        icon: '/assets/echo-icons/gustsOfWelkin.webp',
        effect: <>Inflicting Aero Erosion increases <span style={{ color: attributeColors['aero'], fontWeight: 'bold' }}>Aero DMG</span> for all Resonators in the team by <span className="highlight">15%</span>.</>
    },
    {
        key: 'clawprint',
        name: 'Flaming Clawprint',
        icon: '/assets/echo-icons/flamingClawprint.webp',
        effect: <>Casting Resonance Liberation increases <span style={{ color: attributeColors['fusion'], fontWeight: 'bold' }}>Fusion DMG</span> of Resonators in the team by <span className="highlight">15s</span>.</>
    },
    {
        key: 'lawOfHarmony',
        name: 'Law of Harmony',
        type: 'stack',
        icon: '/assets/echo-icons/lawOfHarmony.webp',
        effect: <>Casting Echo Skill grants <span className="highlight">4% Echo Skill DMG Bonus</span> to all Resonators in the team for <span className="highlight">30s</span>, stacking up to 4 times.</>
    },
    {
        key: 'bellBorne',
        name: 'Bell-Borne Geochelone',
        icon: '/assets/echo-icons/bell-borne.webp',
        className: 'blackify',
        effect: <>Grants <span className="highlight">50.00%</span> DMG Reduction and <span className="highlight">10.0%</span> DMG Boost to team. Disappears after 3 hits.</>
    },
    {
        key: 'impermanenceHeron',
        name: 'Impermanence Heron',
        icon: '/assets/echo-icons/impermanenceHeron.webp',
        className: 'blackify',
        effect: (
            <>
                If the current character uses their Outro Skill within the next <span className="highlight">15s</span>, the next character’s damage dealt will be boosted by <span className="highlight">12%</span>.
            </>
        )
    },
    {
        key: 'fallacy',
        name: 'Fallacy of No Return',
        icon: '/assets/echo-icons/fallacy.webp',
        className: 'blackify',
        effect: <>Increases ATK of all team characters by <span className="highlight">10%</span>, lasting <span className="highlight">20s</span>.</>
    }
];

export const echoBuffList = echoBuffs;


export default function EchoBuffs({ activeStates, toggleState, characterId, characterRuntimeStates, setCharacterRuntimeStates }) {
    const handleLawOfHarmonyChange = (newValue) => {
        setCharacterRuntimeStates(prev => ({
            ...prev,
            [characterId]: {
                ...(prev[characterId] ?? {}),
                activeStates: {
                    ...(prev[characterId]?.activeStates ?? {}),
                    lawOfHarmony: newValue
                }
            }
        }));
    };
    return (
        <div className="echo-buffs">
            {echoBuffs.map(({ key, name, effect, element, icon, className, type }) => (
                <div className="echo-buff" key={key}>
                    <div className="echo-buff-header">
                        <img src={icon} alt={name} className={`echo-buff-icon ${className ?? ''}`} loading="lazy" />
                        <div
                            className="echo-buff-name"
                            style={element ? { color: attributeColors[element] ?? '#ccc' } : {}}
                        >
                            {name}
                        </div>
                    </div>
                    <div className="echo-buff-effect">{effect}</div>
                    {type === 'stack' ? (
                        <DropdownSelect
                            label=""
                            options={[0, 1, 2, 3, 4]}
                            value={activeStates?.lawOfHarmony ?? 0}
                            onChange={handleLawOfHarmonyChange}
                            width="80px"
                        />
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