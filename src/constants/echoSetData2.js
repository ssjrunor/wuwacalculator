// Mirror of echo set stats with textual descriptions for UI display
export const echoSets = {
    1: { // Freezing Frost
        setMax: 5,
        name: 'Freezing Frost',
        desc: {
            twoPiece: 'Glacio DMG +10%',
            fivePiece: 'Upon using Basic Attack or Heavy Attack, Glacio DMG increases by 10%, stacking up to three times, lasting for15s.'
        },
        twoPiece: [
            { value: 10, path: ['attribute', 'glacio', 'dmgBonus'] }
        ], // Glacio DMG +10%
        fivePiece: null,
        states: {
            // frost5pc: 10% Glacio per stack, max 30%
            frost5pc: {
                perStack: [
                    { value: 10, path: ['attribute', 'glacio', 'dmgBonus'] }
                ],
                max: [
                    { value: 30, path: ['attribute', 'glacio', 'dmgBonus'] }
                ]
            },
            // frosty5p1: 7.5% Glacio per stack, max 22.5%
            frosty5p1: {
                perStack: [
                    { value: 7.5, path: ['attribute', 'glacio', 'dmgBonus'] }
                ],
                max: [
                    { value: 22.5, path: ['attribute', 'glacio', 'dmgBonus'] }
                ]
            },
            // frosty5p2: 18% Skill per stack, max 36%
            frosty5p2: {
                perStack: [
                    { value: 18, path: ['skillType', 'resonanceSkill', 'dmgBonus'] }
                ],
                max: [
                    { value: 36, path: ['skillType', 'resonanceSkill', 'dmgBonus'] }
                ]
            }
        },
        icon: '/assets/echo-icons/freezingFrost.webp'
    },

    2: { // Molten Rift
        setMax: 5,
        name: 'Molten Rift',
        desc: {
            twoPiece: 'Fusion DMG% +10%.',
            fivePiece: 'Upon using Resonance Skill, Fusion DMG increases by 30% for 15s.'
        },
        twoPiece: [
            { value: 10, path: ['attribute', 'fusion', 'dmgBonus'] }
        ], // Fusion DMG +10%
        fivePiece: null,
        states: {
            molten5: {
                perStack: [
                    { value: 30, path: ['attribute', 'fusion', 'dmgBonus'] }
                ],
                max: [
                    { value: 30, path: ['attribute', 'fusion', 'dmgBonus'] }
                ]   // just a flat 30
            }
        },
        icon: '/assets/echo-icons/moltenRift.webp'
    },

    3: { // Void Thunder
        setMax: 5,
        name: 'Void Thunder',
        desc: {
            twoPiece: 'Electro DMG +10%.',
            fivePiece: 'Upon using Heavy Attack or Resonance Skill, Electro DMG increases by 15%, stacking up to 2 times, each stack lasting for 15s.'
        },
        twoPiece: [
            { value: 10, path: ['attribute', 'electro', 'dmgBonus'] }
        ],
        fivePiece: null,
        states: {
            void5pc: {
                perStack: [
                    { value: 15, path: ['attribute', 'electro', 'dmgBonus'] }
                ],
                max: [
                    { value: 30, path: ['attribute', 'electro', 'dmgBonus'] }
                ]  // 2 stacks
            }
        },
        icon: '/assets/echo-icons/voidThunder.webp'
    },

    4: { // Sierra Gale
        setMax: 5,
        name: 'Sierra Gale',
        desc: {
            twoPiece: 'Aero DMG +10%.',
            fivePiece: 'Upon using Intro Skill, Aero DMG increases by 30% for 15s.'
        },
        twoPiece: [
            { value: 10, path: ['attribute', 'aero', 'dmgBonus'] }
        ],
        fivePiece: null,
        states: {
            sierra5: {
                perStack: [
                    { value: 30, path: ['attribute', 'aero', 'dmgBonus'] }
                ],
                max: [
                    { value: 30, path: ['attribute', 'aero', 'dmgBonus'] }
                ]
            }
        },
        icon: '/assets/echo-icons/sierraGale.webp'
    },

    5: { // Celestial Light
        setMax: 5,
        name: 'Celestial Light',
        desc: {
            twoPiece: 'Spectro DMG +10%.',
            fivePiece: 'Upon using Intro Skill, Spectro DMG increases by 30% for 15s.'
        },
        twoPiece: [
            { value: 10, path: ['attribute', 'spectro', 'dmgBonus'] }
        ],
        fivePiece: null,
        states: {
            celestial5: {
                perStack: [
                    { value: 30, path: ['attribute', 'spectro', 'dmgBonus'] }
                ],
                max: [
                    { value: 30, path: ['attribute', 'spectro', 'dmgBonus'] }
                ]
            }
        },
        icon: '/assets/echo-icons/celestialLight.webp'
    },

    6: { // Sun-sinking Eclipse
        setMax: 5,
        name: 'Sun-sinking Eclipse',
        desc: {
            twoPiece: 'Havoc DMG +10%.',
            fivePiece: 'Upon using Basic Attack or Heavy Attack, Havoc DMG increases by 7.5%, stacking up to four times for 15s.'
        },
        twoPiece: [
            { value: 10, path: ['attribute', 'havoc', 'dmgBonus'] }
        ],
        fivePiece: null,
        states: {
            eclipse5pc: {
                perStack: [
                    { value: 7.5, path: ['attribute', 'havoc', 'dmgBonus'] }
                ],
                max: [
                    { value: 30, path: ['attribute', 'havoc', 'dmgBonus'] }
                ]   // 4 stacks
            }
        },
        icon: '/assets/echo-icons/sun-sinkingEclipse.webp'
    },

    7: { // Rejuvenating Glow
        setMax: 5,
        name: 'Rejuvenating Glow',
        desc: {
            twoPiece: 'Healing +10%.',
            fivePiece: 'Upon healing allies, increase ATK of the entire team by 15%, lasting 30s.'
        },
        twoPiece: [
            { value: 10, path: ['healingBonus'] }
        ],
        fivePiece: null,
        states: {
            rejuvenating5: {
                perStack: [
                    { value: 15, path: ['atk', 'percent'] }
                ],
                max: [
                    { value: 15, path: ['atk', 'percent'] }
                ] // flat
            }
        },
        icon: '/assets/echo-icons/rejuvenatingGlow.webp'
    },

    8: { // Moonlit Clouds
        setMax: 5,
        name: 'Moonlit Clouds',
        desc: {
            twoPiece: 'Energy Regen +10%.',
            fivePiece: 'Upon using Outro Skill, ATK of the next Resonator increases by 22.5% for 15s.'
        },
        twoPiece: [
            { value: 10, path: ['energyRegen'] }
        ],
        fivePiece: null,
        states: {},
        icon: '/assets/echo-icons/moonlitClouds.webp'
    },

    9: { // Lingering Tunes
        setMax: 5,
        name: 'Lingering Tunes',
        desc: {
            twoPiece: 'ATK +10%',
            fivePiece: 'While on the field, ATK increases by 5% every 1.5s, stacking up to 4 times. Outro Skill DMG increases by 60%.'
        },
        twoPiece: [
            { value: 10, path: ['atk', 'percent'] }
        ],
        fivePiece: [
            { value: 60, path: ['skillType', 'outroSkill', 'dmgBonus'] }
        ],
        states: {
            lingering5p1: {
                perStack: [
                    { value: 5, path: ['atk', 'percent'] }
                ],
                max: [
                    { value: 20, path: ['atk', 'percent'] }
                ] // 4 stacks
            }
        },
        icon: '/assets/echo-icons/lingeringTunes.webp'
    },

    10: { // Frosty Resolve
        setMax: 5,
        name: 'Frosty Resolve',
        desc: {
            twoPiece: 'Resonance Skill DMG +12%.',
            fivePiece: 'Casting Resonance Skill grants 22.5% Glacio DMG Bonus for 15s and casting Resonance Liberation increases Resonance Skill DMG by 18%, lasting for 5s. This effect stacks up to 2 times.'
        },
        twoPiece: [
            { value: 12, path: ['skillType', 'resonanceSkill', 'dmgBonus'] }
        ],
        fivePiece: null,
        states: {
            frosty5p1: {
                perStack: [
                    { value: 22.5, path: ['attribute', 'glacio', 'dmgBonus'] }
                ],
                max: [
                    { value: 22.5, path: ['attribute', 'glacio', 'dmgBonus'] }
                ]
            },
            frosty5p2: {
                perStack: [
                    { value: 18, path: ['skillType', 'resonanceSkill', 'dmgBonus'] }
                ],
                max: [
                    { value: 36, path: ['skillType', 'resonanceSkill', 'dmgBonus'] }
                ]
            }
        },
        icon: '/assets/echo-icons/frostyResolve.webp'
    },

    11: { // Eternal Radiance
        setMax: 5,
        name: 'Eternal Radiance',
        desc: {
            twoPiece: 'Spectro DMG +10%.',
            fivePiece: 'Inflicting enemies with Spectro Frazzle increases Crit. Rate by 20% for 15s. Attacking enemies with 10 stacks of Spectro Frazzle grants 15% Spectro DMG Bonus for 15s.'
        },
        twoPiece: [
            { value: 10, path: ['attribute', 'spectro', 'dmgBonus'] }
        ],
        fivePiece: null,
        states: {
            radiance5p1: {
                perStack: [
                    { value: 20, path: ['critRate'] }
                ],
                max: [
                    { value: 20, path: ['critRate'] }
                ]
            },
            radiance5p2: {
                perStack: [
                    { value: 15, path: ['attribute', 'spectro', 'dmgBonus'] }
                ],
                max: [
                    { value: 15, path: ['attribute', 'spectro', 'dmgBonus'] }
                ] // conditional on 10 stacks, handled outside
            }
        },
        icon: '/assets/echo-icons/eternalRadiance.webp'
    },

    12: { // Midnight Veil
        setMax: 5,
        name: 'Midnight Veil',
        desc: {
            twoPiece: 'Havoc DMG +10%.',
            fivePiece: 'When Outro Skill is triggered, deal additional 480% Havoc DMG to surrounding enemies, considered Outro Skill DMG, and grant the incoming Resonator 15% Havoc DMG Bonus for 15s.'
        },
        twoPiece: [
            { value: 10, path: ['attribute', 'havoc', 'dmgBonus'] }
        ],
        fivePiece: null, // 5p is “big nuke” in damage logic, not here
        states: {},
        icon: '/assets/echo-icons/midnightVeil.webp'
    },

    13: { // Empyrean Anthem
        setMax: 5,
        name: 'Empyrean Anthem',
        desc: {
            twoPiece: 'Energy Regen +10%.',
            fivePiece: 'Increase the Resonator\'s Coordinated Attack DMG by 80%. Upon a critical hit of Coordinated Attack, increase the active Resonator\'s ATK by 20% for 4s.'
        },
        twoPiece: [
            { value: 10, path: ['energyRegen'] }
        ],
        fivePiece: [
            { value: 80, path: ['skillType', 'coord', 'dmgBonus'] }
        ], // Coordinated attack DMG +80%
        states: {
            empyrean5: {
                perStack: [
                    { value: 20, path: ['atk', 'percent'] }
                ],
                max: [
                    { value: 20, path: ['atk', 'percent'] }
                ]
            }
        },
        icon: '/assets/echo-icons/empyreanAnthem.webp'
    },

    14: { // Tidebreaking Courage
        setMax: 5,
        name: 'Tidebreaking Courage',
        desc: {
            twoPiece: 'Energy Regen +10%.',
            fivePiece: 'Increase the Resonator\'s ATK by 15%. Reaching 250% Energy Regen increases all Attribute DMG by 30% for the Resonator.'
        },
        twoPiece: [
            { value: 10, path: ['energyRegen'] }
        ],
        fivePiece: [
            { value: 15, path: ['atk', 'percent'] }
        ], // always on, extra element DMG handled with condition
        states: {
        },
        icon: '/assets/echo-icons/tidebreakingCourage.webp'
    },

    16: { // Gusts of Welkin
        setMax: 5,
        name: 'Gusts of Welkin',
        desc: {
            twoPiece: 'Aero DMG +10%.',
            fivePiece: 'Inflicting Aero Erosion upon enemies increases Aero DMG for all Resonators in the team by 15%, and for the Resonator triggering this effect by an additional 15%, lasting for 20s.'
        },
        twoPiece: [
            { value: 10, path: ['attribute', 'aero', 'dmgBonus'] }
        ],
        fivePiece: null,
        states: {
            welkin5: {
                perStack: [
                    { value: 30, path: ['attribute', 'aero', 'dmgBonus'] }
                ],
                max: [
                    { value: 30, path: ['attribute', 'aero', 'dmgBonus'] }
                ]
            }
        },
        icon: '/assets/echo-icons/gustsOfWelkin.webp'
    },

    17: { // Windward Pilgrimage
        setMax: 5,
        name: 'Windward Pilgrimage',
        desc: {
            twoPiece: 'Aero DMG + 10%.',
            fivePiece: 'Hitting a target with Aero Erosion increases Crit. Rate by 10% and grants 30% Aero DMG Bonus, lasting for 10s.'
        },
        twoPiece: [
            { value: 10, path: ['attribute', 'aero', 'dmgBonus'] }
        ],
        fivePiece: null,
        states: {
            windward5: {
                perStack: [
                    { value: 10, path: ['critRate'] },
                    { value: 30, path: ['attribute', 'aero', 'dmgBonus'] }
                ],
                max: [
                    { value: 10, path: ['critRate'] },
                    { value: 30, path: ['attribute', 'aero', 'dmgBonus'] }
                ] // conditional on Aero Erosion
            }
        },
        icon: '/assets/echo-icons/windwardPilgrimage.webp'
    },

    18: { // Flaming Clawprint
        setMax: 5,
        name: 'Flaming Clawprint',
        desc: {
            twoPiece: 'Fusion DMG + 10%.',
            fivePiece: 'Casting Resonance Liberation grants all Resonators in the team 15% Fusion DMG Bonus and the caster 20% Resonance Liberation DMG Bonus, lasting for 35s.'
        },
        twoPiece: [
            { value: 10, path: ['attribute', 'fusion', 'dmgBonus'] }
        ],
        fivePiece: null,
        states: {
            clawprint5: {
                perStack: [
                    { value: 15, path: ['attribute', 'fusion', 'dmgBonus'] },
                    { value: 20, path: ['skillType', 'resonanceLiberation', 'dmgBonus'] }
                ],
                max: [
                    { value: 15, path: ['attribute', 'fusion', 'dmgBonus'] },
                    { value: 20, path: ['skillType', 'resonanceLiberation', 'dmgBonus'] }
                ]
            }
        },
        icon: '/assets/echo-icons/flamingClawprint.webp'
    },

    // ---- 3-piece “legendary” sets ----

    19: { // Dream of the Lost
        setMax: 3,
        name: 'Dream of the Lost',
        desc: {
            threePiece: 'Holding 0 Resonance Energy increases Crit. Rate by 20% and grants 35% Echo Skill DMG Bonus.'
        },
        twoPiece: null,
        fivePiece: null,
        states: {
            dreamOfTheLost3pc: {
                perStack: [
                    { value: 20, path: ['critRate'] },
                    { value: 35, path: ['skillType', 'echoSkill', 'dmgBonus'] }
                ],
                max: [
                    { value: 20, path: ['critRate'] },
                    { value: 35, path: ['skillType', 'echoSkill', 'dmgBonus'] }
                ]
            }
        },
        icon: '/assets/echo-icons/dreamOfTheLost.webp'
    },

    20: { // Crown of Valor
        setMax: 3,
        name: 'Crown Of Valor',
        desc: {
            threePiece: 'Upon gaining a Shield, increase the Resonator\'s ATK by 6% and Crit. DMG by 4% for 4s. This effect can be triggered once every 0.5s and stacks up to 5 times.'
        },
        twoPiece: null,
        fivePiece: null,
        states: {
            crownOfValor3pc: {
                perStack: [
                    { value: 6, path: ['atk', 'percent'] },
                    { value: 4, path: ['critDmg'] }
                ],
                max: [
                    { value: 30, path: ['atk', 'percent'] },
                    { value: 20, path: ['critDmg'] }
                ] // 5 stacks
            }
        },
        icon: '/assets/echo-icons/crownOfValor.webp'
    },

    21: { // Law of Harmony
        setMax: 3,
        name: 'Law of Harmony',
        desc: {
            threePiece: 'Casting Echo Skill grants 30% Heavy Attack DMG Bonus to the caster for 4s. Additionally, all Resonators in the team gain 4% Echo Skill DMG Bonus for 30s, stacking up to 4 times. Echoes of the same name can only trigger this effect once. The record of Echo triggering this effect is cleared along with this effect. At 4 stacks, casting Echo Skill again resets the duration of this effect.'
        },
        twoPiece: null,
        fivePiece: null,
        states: {
            lawOfHarmony3p: {
                perStack: [
                    { value: 30, path: ['skillType', 'heavyAtk', 'dmgBonus'] },
                    { value: 4, path: ['skillType', 'echoSkill', 'dmgBonus'] }
                ],
                max: [
                    { value: 30, path: ['skillType', 'heavyAtk', 'dmgBonus'] },
                    { value: 16, path: ['skillType', 'echoSkill', 'dmgBonus'] }
                ] // heavy flat, echoSkill stacks
            }
        },
        icon: '/assets/echo-icons/lawOfHarmony.webp'
    },

    22: { // Flamewing's Shadow
        setMax: 3,
        name: 'Flamewing\'s Shadow',
        desc: {
            threePiece: 'Dealing Echo Skill DMG increases Heavy Attack Crit. Rate by 20% for 6s. Dealing Heavy Attack DMG increases Echo Skill Crit. Rate by 20% for 6s. While both effects are active, gain 16% Fusion DMG Bonus.'
        },
        twoPiece: null,
        fivePiece: null,
        states: {
            flamewingsShadow2pcP1: {
                perStack: [
                    { value: 20, path: ['skillType', 'heavyAtk', 'critRate'] }
                ],
                max: [
                    { value: 20, path: ['skillType', 'heavyAtk', 'critRate'] }
                ]
            },
            flamewingsShadow2pcP2: {
                perStack: [
                    { value: 20, path: ['skillType', 'echoSkill', 'critRate'] }
                ],
                max: [
                    { value: 20, path: ['skillType', 'echoSkill', 'critRate'] }
                ]
            }
        },
        icon: '/assets/echo-icons/flamewing\'sShadow.webp'
    },

    23: { // Thread of Severed Fate
        setMax: 3,
        name: 'Thread of Severed Fate',
        desc: {
            threePiece: 'Inflicting Havoc Bane increases the Resonator\'s ATK by 20% and grants 30% Resonance Liberation DMG Bonus for 5s.'
        },
        twoPiece: null,
        fivePiece: null,
        states: {
            threadOfSeveredFate3pc: {
                perStack: [
                    { value: 20, path: ['atk', 'percent'] },
                    { value: 30, path: ['attribute', 'havoc', 'dmgBonus'] }
                ],
                max: [
                    { value: 20, path: ['atk', 'percent'] },
                    { value: 30, path: ['attribute', 'havoc', 'dmgBonus'] }
                ]
            }
        },
        icon: '/assets/echo-icons/threadOfSeveredFate.webp'
    },

    24: {
        setMax: 5,
        name: 'Pact of Neonlight Leap',
        desc: {
            twoPiece: 'Spectro DMG +10%',
            fivePiece: 'After casting Outro Skill, additionally increases ATK of the next Resonator entering with Intro Skill by 0.3% up to 15% for 15s or until the Resonator is switched out.'
        },
        twoPiece: [
            { value: 10, path: ['attribute', 'spectro', 'dmgBonus'] },
        ],
        fivePiece: null,
        states: {},
        icon: '/assets/echo-icons/pactOfNeonlightLeap.webp'
    },

    25: {
        setMax: 5,
        name: 'Halo of Starry Radiance',
        desc: {
            twoPiece: 'Healing Bonus +10%',
            fivePiece: 'When a Resonator heals an ally, every 1% points of Off-Tune Buildup Rate grants 0.2% ATK increase to all Resonators in the team, up to 25% for 4s.'
        },
        twoPiece: [
            { value: 10, path: ['healingBonus'] }
        ],
        fivePiece: null,
        states: {
            starryRadiance5pc: {
                perStack: [
                    { value: 0.2, path: ['atk', 'percent'] }
                ],
                max: [
                    { value: 25, path: ['atk', 'percent'] }
                ]
            }
        },
        icon: '/assets/echo-icons/haloOfStarryRadiance.webp'
    },

    26: {
        setMax: 5,
        name: 'Rite of Gilded Revelation',
        desc: {
            twoPiece: 'Spectro DMG +10%',
            fivePiece:
                'Dealing Basic Attack DMG increases Spectro DMG by 10%, ' +
                'stacking up to 3 times for 5s. With 3 stacks, casting Resonance ' +
                'Liberation grants 40% Basic Attack DMG Bonus.'
        },
        twoPiece: [
            { value: 10, path: ['attribute', 'spectro', 'dmgBonus'] },
        ],
        fivePiece: null,
        states: {
            gildedRevelationStacks: {
                perStack: [
                    { value: 10, path: ['attribute', 'spectro', 'dmgBonus'] },
                ],
                max: [
                    { value: 30, path: ['attribute', 'spectro', 'dmgBonus'] },
                ],
            },

            gildedRevelationBasicBuff: {
                max: [
                    { value: 40, path: ['skillType', 'basicAtk', 'dmgBonus'] },
                ],
            },
        },
        icon: '/assets/echo-icons/riteOfGildedRevelation.webp',
    }
};

export const stateToSetId = {};
for (const [setIdStr, cfg] of Object.entries(echoSets)) {
    const setId = Number(setIdStr);
    if (!cfg?.states) continue;
    for (const stateKey of Object.keys(cfg.states)) {
        stateToSetId[stateKey] = setId;
    }
}

export const setIconMap = Object.fromEntries(
    Object.entries(echoSets).map(([setId, cfg]) => [Number(setId), cfg.icon])
);

export const echoSetMap = Object.fromEntries(
    Object.entries(echoSets).map(([setId, cfg]) => [
        Number(setId),
        {
            id: Number(setId),
            name: cfg.name,
            twoPiece: cfg.desc?.twoPiece,
            threePiece: cfg.desc?.threePiece,
            fivePiece: cfg.desc?.fivePiece,
        }
    ])
);

export const echoSetById = echoSetMap;

export const echoSetList = Object.values(echoSetMap);

export const setPieceTypeMap = Object.fromEntries(
    Object.entries(echoSets).map(([setId, set]) => {
        const validPieces = [];
        if (set.desc.twoPiece) validPieces.push(2);
        if (set.desc.threePiece) validPieces.push(3);
        if (set.desc.fivePiece) validPieces.push(5);
        return [Number(setId), validPieces];
    })
);

export const DEFAULT_FIVE_PIECE_SETS = Object.entries(setPieceTypeMap)
    .filter(([, pieces]) => pieces.includes(5))
    .map(([setId]) => Number(setId))
    .sort((a, b) => a - b);

export const DEFAULT_THREE_PIECE_SETS = Object.entries(setPieceTypeMap)
    .filter(([, pieces]) => pieces.includes(3))
    .map(([setId]) => Number(setId))
    .sort((a, b) => a - b);
