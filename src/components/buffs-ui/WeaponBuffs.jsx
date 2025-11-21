import React from 'react';
import { attributeColors } from '../../utils/attributeHelpers.js';
import DropdownSelect from '../utils-ui/DropdownSelect.jsx';
import { getCurrentParamValues } from '../weapon-pane/WeaponPane.jsx';

export const weaponBuffs = [
    {
        key: 'staticMist',
        name: 'Static Mist',
        icon: '/assets/weapon-icons/21030015.webp',
        param: [[10, 12.5, 15, 17.5, 20]],
        effect: (param = []) => (
            <>
                Incoming Resonator's ATK is increased by <span className="highlight">{param[0] ?? '—'}%</span> for <span className="highlight">14s</span>, stackable for up to 1 times after the wielder casts Outro Skill.
            </>
        )
    },
    {
        key: 'stellarSymphony',
        name: 'Stellar Symphony',
        icon: '/assets/weapon-icons/21050036.webp',
        param: [[14, 17.5, 21, 24.5, 28]],
        effect: (param = []) => (
            <>
                When casting Resonance Skill that heals, increase nearby party members' ATK by <span className="highlight">{param[0] ?? '—'}%</span> for <span className="highlight">30s</span>. Effects of the same name cannot be stacked.
            </>
        )
    },
    {
        key: 'luminousHymn',
        name: 'Luminous Hymn',
        icon: '/assets/weapon-icons/21050046.webp',
        param: [[30, 37.5, 45, 52.5, 60]],
        effect: (param = []) => (
            <>
                Casting Outro Skill Amplifies the <span style={{ color: attributeColors['spectro'], fontWeight: 'bold' }}>Spectro Frazzle</span> DMG on targets around the active Resonator by <span className="highlight">{param[0] ?? '—'}%</span> for <span className="highlight">30s</span>. Effects of the same name cannot be stacked.
            </>
        )
    },
    {
        key: 'bloodpactsPledge',
        name: "Bloodpact's Pledge",
        icon: '/assets/weapon-icons/21020046.webp',
        param: [[10, 14, 18, 22, 26]],
        effect: (param = []) => (
            <>
                When Rover: <span style={{ color: attributeColors['aero'], fontWeight: 'bold' }}>Aero</span> casts Resonance Skill Unbound Flow, <span style={{ color: attributeColors['aero'], fontWeight: 'bold' }}>Aero DMG</span> dealt by nearby Resonators on the field is Amplified by <span className="highlight">{param[0] ?? '—'}%</span> for <span className="highlight">30s</span>.
            </>
        )
    },
    {
        key: 'woodlandAria',
        name: 'Woodland Aria',
        icon: '/assets/weapon-icons/21030026.webp',
        param: [[10, 11.5, 13, 14.5, 16]],
        effect: (param = []) => (
            <>
                Hitting targets with <span style={{ color: attributeColors['aero'], fontWeight: 'bold' }}>Aero Erosion</span> reduces their <span style={{ color: attributeColors['aero'], fontWeight: 'bold' }}>Aero Res</span> by <span className="highlight">{param[0] ?? '—'}%</span> for <span className="highlight">20s</span>. Effects of the same name cannot be stacked.
            </>
        )
    },
    {
        key: 'wildfireMark',
        name: 'Wildfire Mark',
        icon: '/assets/weapon-icons/21010036.webp',
        param: [[24, 30, 36, 42, 48]],
        effect: (param = []) => (
            <>
                Dealing Heavy Attack DMG extends this effect by <span className="highlight">4s</span>, up to 1 time. Each successful extension gives <span className="highlight">{param[0] ?? '—'}%</span> <span style={{ color: attributeColors['fusion'], fontWeight: 'bold' }}>Fusion DMG Bonus</span> to all Resonators in the team for <span className="highlight">30s</span>. Effects of the same name cannot be stacked.
            </>
        )
    },
    {
        key: 'emeraldSentence',
        name: 'Emerald Sentence',
        icon: '/assets/weapon-icons/21020066.webp',
        param: [[20, 25, 30, 35, 40]],
        effect: (param = []) => (
            <>
                Casting Intro Skill grants <span className="highlight">{param[0] ?? '—'}% Echo Skill DMG Bonus</span> to all Resonators in the team for 30s.
            </>
        )
    },
    {
        key: 'kumokiri',
        name: 'Kumokiri',
        icon: '/assets/weapon-icons/21010056.webp',
        param: [[24, 30, 36, 42, 48]],
        effect: (param = []) => (
            <>
                When Resonators in the team inflict <span className="highlight">Negative Status</span> or deal <span className="highlight">Negative Status DMG</span>, grants <span className="highlight">{param[0] ?? '—'}%</span> DMG Bonus of all Attributes for 15s.
            </>
        )
    }
];

export const weaponBuffList = weaponBuffs;


export default function WeaponBuffs({ activeStates, setCharacterRuntimeStates, charId }) {
    const updateState = (key, value) => {
        setCharacterRuntimeStates(prev => ({
            ...prev,
            [charId]: {
                ...(prev[charId] ?? {}),
                activeStates: {
                    ...(prev[charId]?.activeStates ?? {}),
                    [key]: value
                }
            }
        }));
    };

    return (
        <div className="echo-buffs">
            {weaponBuffs.map(({ key, name, icon, effect, param }) => {
                const rank = activeStates?.[`${key}_rank`] ?? 0;
                const paramValues = getCurrentParamValues(param, rank);

                return (
                    <div className="echo-buff" key={key}>
                        <div className="echo-buff-header">
                            <img src={icon} alt={name} className="echo-buff-icon" loading="lazy"
                                 onError={(e) => {
                                     e.target.onerror = null;
                                     e.target.src = '/assets/weapon-icons/default.webp';
                                     e.currentTarget.classList.add('fallback-icon');
                                 }}
                            />
                            <div className="echo-buff-name">{name}</div>
                        </div>
                        <div className="echo-buff-effect">{effect(paramValues)}</div>
                        <DropdownSelect
                            label="Rank"
                            options={[0, 1, 2, 3, 4, 5]}
                            value={rank}
                            onChange={(newValue) => updateState(`${key}_rank`, newValue)}
                            width="80px"
                        />
                    </div>
                );
            })}
        </div>
    );
}