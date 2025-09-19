export function applySetEffect({ mergedBuffs, characterState, activeCharacter, combatState }) {
    const effect = characterState?.activeStates ?? {};

    const elementMap = {
        1: 'glacio',
        2: 'fusion',
        3: 'electro',
        4: 'aero',
        5: 'spectro',
        6: 'havoc'
    };
    const element = elementMap?.[activeCharacter?.attribute];

    if (effect.windward5 && combatState.aeroErosion > 0) {
        mergedBuffs.critRate = (mergedBuffs.critRate ?? 0) + 10;
        mergedBuffs.aero = (mergedBuffs.aero ?? 0) + 30;
    }

    if (effect.molten5) {
        mergedBuffs.fusion = (mergedBuffs.fusion ?? 0) + 30;
    }

    if (effect.sierra5) {
        mergedBuffs.aero = (mergedBuffs.aero ?? 0) + 30;
    }

    if (effect.celestial5) {
        mergedBuffs.spectro = (mergedBuffs.spectro ?? 0) + 30;
    }

    if (effect.rejuvenating5) {
        mergedBuffs.atkPercent = (mergedBuffs.atkPercent ?? 0) + 15;
    }

    if (effect.radiance5p1) {
        mergedBuffs.critRate = (mergedBuffs.critRate ?? 0) + 20;
    }

    if (effect.radiance5p2 && combatState.spectroFrazzle >= 10) {
        mergedBuffs.spectro = (mergedBuffs.spectro ?? 0) + 15;
    }

    if (effect.welkin5 ) {
        mergedBuffs.aero = (mergedBuffs.aero ?? 0) + 30;
    }

    if (effect.clawprint5 ) {
        mergedBuffs.fusion = (mergedBuffs.fusion ?? 0) + 15;
        mergedBuffs.resonanceLiberation = (mergedBuffs.resonanceLiberation ?? 0) + 20;
    }

    if (effect.empyrean5 ) {
        mergedBuffs.atkPercent = (mergedBuffs.atkPercent ?? 0) + 20;
    }

    if (effect.frosty5p1 ) {
        mergedBuffs.glacio = (mergedBuffs.glacio ?? 0) + 22.5;
    }

    const frostStacks = effect.frost5pc ?? 0;
    const frostBonus = Math.min(frostStacks * 10, 30);
    mergedBuffs.glacio = (mergedBuffs.glacio ?? 0) + frostBonus;

    const frostyStacks = effect.frosty5p2 ?? 0;
    const frostySkill = Math.min(frostyStacks * 18, 36);
    mergedBuffs.resonanceSkill = (mergedBuffs.resonanceSkill ?? 0) + frostySkill;

    const lingeringStacks = effect.lingering5p1 ?? 0;
    const lingeringAtk = Math.min(lingeringStacks * 5, 20);
    mergedBuffs.atkPercent = (mergedBuffs.atkPercent ?? 0) + lingeringAtk;

    const eclipseStack = effect.eclipse5pc ?? 0;
    const eclipseHavoc = Math.min(eclipseStack * 7.5, 30);
    mergedBuffs.havoc = (mergedBuffs.havoc ?? 0) + eclipseHavoc;

    const voidStack = effect.void5pc ?? 0;
    const voidElectro = Math.min(voidStack * 15, 30);
    mergedBuffs.electro = (mergedBuffs.electro ?? 0) + voidElectro;

    if (effect.dreamOfTheLost3pc) {
        mergedBuffs.critRate = (mergedBuffs.critRate ?? 0) + 20;
        mergedBuffs.echoSkill = (mergedBuffs.echoSkill ?? 0) + 35;
    }

    const crownOfValorStack = effect.crownOfValor3pc ?? 0;
    mergedBuffs.atkPercent = (mergedBuffs.atkPercent ?? 0) + 6 * crownOfValorStack;
    mergedBuffs.critDmg = (mergedBuffs.critDmg ?? 0) + 4 * crownOfValorStack;

    const lawOfHarmonyStack = effect.lawOfHarmony3p ?? 0;
    if (lawOfHarmonyStack > 0) {
        mergedBuffs.heavyAtk = (mergedBuffs.heavyAtk ?? 0) + 30;
    }
    mergedBuffs.echoSkill = (mergedBuffs.echoSkill ?? 0) + 4 * lawOfHarmonyStack;

    if (effect.flamewingsShadow2pcP1 && effect.flamewingsShadow2pcP2) {
        mergedBuffs.fusion = (mergedBuffs.fusion ?? 0) + 16;
    }

    return mergedBuffs;
}

export const echoSetBuffs = {
    1: { twoPiece: { glacio: 10 } },                                                // Freezing Frost
    2: { twoPiece: { fusion: 10 } },                                                // Molten Rift
    3: { twoPiece: { electro: 10 } },                                               // Void Thunder
    4: { twoPiece: { aero: 10 } },                                                  // Sierra Gale
    5: { twoPiece: { spectro: 10 } },                                               // Celestial Light
    6: { twoPiece: { havoc: 10 } },                                                 // Sun-sinking Eclipse
    7: { twoPiece: { healingBonus: 10 } },                                          // Rejuvenating Glow
    8: { twoPiece: { energyRegen: 10 } },                                           // Moonlit Clouds
    9: { twoPiece: { atkPercent: 10 }, fivePiece: {outroAtk: 60} },                 // Lingering Tunes
    10: { twoPiece: { resonanceSkill: 12 } },                                       // Frosty Resolve
    11: { twoPiece: { spectro: 10 } },                                              // Eternal Radiance
    12: { twoPiece: { havoc: 10 } },                                                // Midnight Veil
    13: { twoPiece: { energyRegen: 10 }, fivePiece: { coord: 80 } },                // Empyrean Anthem
    14: { twoPiece: { energyRegen: 10 }, fivePiece: { atkPercent: 10 } },           // Tidebreaking Courage
    16: { twoPiece: { aero: 10 } },                                                 // Gusts of Welkin
    17: { twoPiece: { aero: 10 } },                                                 // Windward Pilgrimage
    18: { twoPiece: { fusion: 10 } }                                                // Flaming Clawprint
};


export function applyEchoSetBuffLogic({ mergedBuffs, equippedEchoes, activeCharacter }) {
    const elementMap = {
        1: 'glacio',
        2: 'fusion',
        3: 'electro',
        4: 'aero',
        5: 'spectro',
        6: 'havoc'
    };
    const element = elementMap?.[activeCharacter?.attribute];

    const setCounts = {};
    for (const echo of equippedEchoes) {
        const setId = Number(echo?.selectedSet);
        if (!setId) continue;
        setCounts[setId] = (setCounts[setId] || 0) + 1;
    }

    for (const [setIdStr, count] of Object.entries(setCounts)) {
        const setId = Number(setIdStr);
        const buffs = echoSetBuffs[setId];
        if (!buffs) continue;

        if (count >= 2 && buffs.twoPiece) {
            for (const [stat, value] of Object.entries(buffs.twoPiece)) {
                mergedBuffs[stat] = (mergedBuffs[stat] ?? 0) + value;
            }
        }

        if (count === 5 && buffs.fivePiece) {
            for (const [stat, value] of Object.entries(buffs.fivePiece)) {
                mergedBuffs[stat] = (mergedBuffs[stat] ?? 0) + value;
            }

            const allElements = Object.values(elementMap);

            if (setId === 14 && mergedBuffs.energyRegen >= 150) {
                for (const key of allElements) {
                    mergedBuffs[key] = (mergedBuffs[key] ?? 0) + 30;
                }
            }
        }
    }
    return mergedBuffs;
}


export const mainEchoBuffs = {
    '6000042': {
        toggleable: {
            label: "Enable",
            buffs: { basicAtk: 12, havoc: 12 }
        }
    },
    '6000039': {
        toggleable: {
            label: "Enable",
            buffs: { heavyAtk: 12, electro: 12 }
        }
    },
    '6000043': {
        toggleable: {
            label: "Enable",
            buffs: { heavyAtk: 12, aero: 12 }
        }
    },
    '6000045': {
        toggleable: {
            label: "Enable",
            buffs: { resonanceLiberation: 12, spectro: 12 }
        }
    },
    '6000048': {
        toggleable: {
            label: "Enable",
            buffs: { atkPercent: 12 }
        }
    },
    '6000059': {
        toggleable: {
            label: "Enable",
            buffs: { resonanceSkill: 16 }
        }
    },
    '6000060': {
        toggleable: {
            label: "Enable",
            buffs: { energyRegen: 10, atkPercent: 10 }
        }
    },
    '390080003': {
        toggleable: {
            label: "Enable",
            buffs: { electro: 12, resonanceLiberation: 12 }
        }
    },
    '390080007': {
        toggleable: {
            label: "Enable",
            buffs: { fusion: 12, basicAtk: 12 }
        }
    },


    '6000082': {
        always: { havoc: 12, basicAtk: 12 }
    },
    '6000106': {
        always: { aero: 10 }
    },
    '6000084': {
        always: { fusion: 12, basicAtk: 12 }
    },
    '6000083': {
        always: { glacio: 12, resonanceSkill: 12 }
    },
    '6000085': {
        always: { coord: 40 }
    },
    '6000086': {
        always: { aero: 12, heavyAtk: 12 }
    },
    '6000088': {
        always: { electro: 12, resonanceLiberation: 12 }
    },
    '6000089': {
        always: { electro: 12, resonanceSkill: 12 }
    },
    '6000090': {
        always: { havoc: 12, basicAtk: 12 },
        skillMetaModifier: (skillMeta) => {
            if (skillMeta.name.includes('Nightmare: Crownless')) {
                skillMeta.skillDmgBonus = (skillMeta.skillDmgBonus ?? 0) + 20;
            }
            return skillMeta;
        }
    },
    '6000087': {
        always: { havoc: 12, heavyAtk: 12 }
    },
    '6000091': {
        always: { fusion: 12, resonanceSkill: 12 }
    },
    '6000092': {
        always: { spectro: 12 },
        skillMetaModifier: (skillMeta, {combatState}) => {
            if (skillMeta.name.includes('Nightmare: Mourning Aix') && combatState.spectroFrazzle > 0) {
                skillMeta.skillDmgBonus = (skillMeta.skillDmgBonus ?? 0) + 100;
            }
            return skillMeta;
        }
    },
    '6000105': {
        always: { glacio: 12, coord: 30 }
    },
    '6000113': {
        always: { glacio: 12, aero: 12 }
    },
    '6000114': {
        always: { fusion: 12, resonanceLiberation: 12 }
    },
    '6000076': {
        always: { glacio: 12 }
    },
    '6000080': {
        always: { electro: 12 }
    },
    '6000104': {
        always: { spectro: 12, heavyAtk: 12 }
    },
    '6000112': {
        always: { aero: 12, resonanceLiberation: 12 }
    },
    '6000115': {
        always: { havoc: 12, echoSkill: 20 }
    },
    '6000116': {
        always: { aero: 12, heavyAtk: 12 }
    },
    '6000121': {
        always: { electro: 12, heavyAtk: 12 }
    },
    '6000160': {
        always: { aero: 12, resonanceLiberation: 25 }
    },
    '6000120': {
        always: { fusion: 12, echoSkill: 20 }
    },


    '6000044': {
        stackable: {
            label: "Stacks",
            key: "mainEchoStacks",
            max: 3,
            buffsPerStack: { resonanceSkill: 4, glacio: 4 }
        }
    },

    '6000056': {
        toggleable: {
            label: "Mid-Air?",
        },
        skillMetaModifier: (skillMeta, { characterState }) => {
            const isMidAir = characterState?.mainEchoToggle;

            if (isMidAir && skillMeta.name.includes('Glacio Dreadmane')) {
                skillMeta.skillDmgBonus = (skillMeta.skillDmgBonus ?? 0) + 20;
            }
            return skillMeta;
        }
    },
    '6000053': {
        toggleable: {
            label: "Enable?",
        },
        skillMetaModifier: (skillMeta, { characterState }) => {
            const deadening = characterState?.mainEchoToggle;

            if (deadening && skillMeta.name.includes('Dreamless')) {
                skillMeta.skillDmgBonus = (skillMeta.skillDmgBonus ?? 0) + 50;
            }
            return skillMeta;
        }
    },
    '390070052': {
        skillMetaModifier: (skillMeta) => {
            if (skillMeta.name.includes('Fission Junrock')) {
                skillMeta.tags = ['healing'];
            }
            return skillMeta;
        }
    },
    '390070074': {
        skillMetaModifier: (skillMeta) => {
            if (skillMeta.name.includes('Cruisewing')) {
                skillMeta.tags = ['healing'];
            }
            return skillMeta;
        }
    },
    '390077024': {
        skillMetaModifier: (skillMeta) => {
            if (skillMeta.name.includes('Rocksteady Guardian Skill 3')) {
                skillMeta.tags = ['healing'];
            }
            return skillMeta;
        }
    },
    '390077025': {
        skillMetaModifier: (skillMeta) => {
            if (skillMeta.name.includes('Chasm Guardian Skill 2')) {
                skillMeta.scaling = { atk: 0, hp: 1, def: 0, energyRegen: 0 };
                skillMeta.tags = ['healing'];
            }
            return skillMeta;
        }
    },
    '390080005': {
        toggleable: {
            label: "Enable?",
        },
        skillMetaModifier: (skillMeta, { characterState }) => {
            const geochelone = characterState?.mainEchoToggle;
            if (geochelone) {
                skillMeta.skillDmgBonus = (skillMeta.skillDmgBonus ?? 0) + 10;
            }
            return skillMeta;
        }
    },
    '6000061': {
        skillMetaModifier: (skillMeta) => {
            if (skillMeta.name.includes('Galescourge Stalker')) {
                skillMeta.tags = ['healing'];
            }
            return skillMeta;
        }
    },
    '6000074': {
        skillMetaModifier: (skillMeta, {combatState}) => {
            if (skillMeta.name.includes('Diurnus Knight') && combatState.spectroFrazzle > 0) {
                skillMeta.skillDmgBonus = (skillMeta.skillDmgBonus ?? 0) + 100;
            }
            return skillMeta;
        }
    },
    '6000068': {
        skillMetaModifier: (skillMeta) => {
            if (skillMeta.name.includes('Nimbus Wraith')) {
                skillMeta.tags = ['healing'];
            }
            return skillMeta;
        }
    },
    '6000094': {
        skillMetaModifier: (skillMeta) => {
            if (skillMeta.name.includes('Calcified Junrock')) {
                skillMeta.tags = ['healing'];
            }
            return skillMeta;
        }
    },
    '6000167': {
        always: { havoc: 12, resonanceLiberation: 12 },
        skillMetaModifier: (skillMeta, {combatState}) => {
            if (skillMeta.name.includes('Reminiscence: Threnodian - Leviathan Skill 2') && combatState.havocBane > 0) {
                skillMeta.dmgReduction = (skillMeta.dmgReduction ?? 0) + 100;
            }
            return skillMeta;
        }
    },
};

export function applyMainEchoBuffLogic({ equippedEchoes, mergedBuffs, characterState, activeCharacter, combatState, charId }) {
    const activeStates = characterState?.activeStates ?? {};
    const mainEcho = equippedEchoes?.[0];
    if (!mainEcho) return mergedBuffs;
    const elementMap = {
        1: 'glacio',
        2: 'fusion',
        3: 'electro',
        4: 'aero',
        5: 'spectro',
        6: 'havoc'
    };
    const element = elementMap?.[activeCharacter?.attribute];

    const buffs = mainEchoBuffs?.[mainEcho.id];
    if (!buffs) return mergedBuffs;

    const { always, toggleable, stackable } = buffs;

    if (always) {
        for (const [stat, val] of Object.entries(always)) {
            mergedBuffs[stat] = (mergedBuffs[stat] ?? 0) + val;
        }
    }

    if (toggleable && activeStates?.mainEchoToggle && toggleable.buffs) {
        for (const [stat, val] of Object.entries(toggleable.buffs)) {
            if (stat === 'element') {
                for (const elem of Object.values(elementMap)) {
                    mergedBuffs[elem] = (mergedBuffs[elem] ?? 0) + val;
                }
            } else {
                mergedBuffs[stat] = (mergedBuffs[stat] ?? 0) + val;
            }
        }
    }

    if (stackable) {
        const stackKey = stackable.key ?? 'mainEchoStacks';
        const currentStacks = Math.min(activeStates?.[stackKey] ?? 0, stackable.max ?? 1);

        for (const [stat, perStackVal] of Object.entries(stackable.buffsPerStack)) {
            const total = perStackVal * currentStacks;
            mergedBuffs[stat] = (mergedBuffs[stat] ?? 0) + total;
        }
    }

    if (mainEcho.id === '6000106' && (charId === '1409' || charId === '1406' || charId === '1408')) {
        mergedBuffs.aero = (mergedBuffs.aero ?? 0) + 10;
    }

    return mergedBuffs;
}