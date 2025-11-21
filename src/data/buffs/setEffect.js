export const setStateMap = {
    windward5: 'windward',
    molten5: 'molten',
    sierra5: 'sierra',
    celestial5: 'celestial',
    rejuvenating5: 'rejuvenating',
    radiance5p1: 'radiance',
    radiance5p2: 'radiance',
    welkin5: 'welkin',
    clawprint5: 'clawprint',
    empyrean5: 'empyrean',
    frosty5p1: 'frosty',
    frosty5p2: 'frosty',
    frost5pc: 'frost',
    lingering5p1: 'lingering',
    eclipse5pc: 'eclipse',
    void5pc: 'voidThunder',
    dreamOfTheLost3pc: 'dreamOfTheLost',
    crownOfValor3pc: 'crownOfValor',
    lawOfHarmony3p: 'lawOfHarmony',
    flamewingsShadow2pcP1: 'flamewingsShadow',
    flamewingsShadow2pcP2: 'flamewingsShadow'
};

export function applySetEffect({ mergedBuffs, characterState, activeCharacter, combatState, setCounts = 5 }) {
    const effect = characterState?.activeStates ?? {};

    const activeSets = {
        frost: setCounts?.[1] >= 5,
        molten: setCounts?.[2] >= 5,
        voidThunder: setCounts?.[3] >= 5,
        sierra: setCounts?.[4] >= 5,
        celestial: setCounts?.[5] >= 5,
        eclipse: setCounts?.[6] >= 5,
        rejuvenating: setCounts?.[7] >= 5,
        lingering: setCounts?.[9] >= 5,
        frosty: setCounts?.[10] >= 5,
        radiance: setCounts?.[11] >= 5,
        empyrean: setCounts?.[13] >= 5,
        welkin: setCounts?.[16] >= 5,
        windward: setCounts?.[17] >= 5,
        clawprint: setCounts?.[18] >= 5,
        dreamOfTheLost: setCounts?.[19] >= 3,
        crownOfValor: setCounts?.[20] >= 3,
        lawOfHarmony: setCounts?.[21] >= 3,
        flamewingsShadow: setCounts?.[22] >= 3
    };

    for (const [stateKey, value] of Object.entries(effect)) {
        const parentSet = setStateMap[stateKey];

        if (stateKey.startsWith('__inactive__')) {
            const originalKey = stateKey.replace('__inactive__', '');
            const parent = setStateMap[originalKey];
            if (parent && activeSets[parent]) {
                effect[originalKey] = value;
                delete effect[stateKey];
            }
            continue;
        }

        if (parentSet && !activeSets[parentSet]) {
            effect[`__inactive__${stateKey}`] = value;
            delete effect[stateKey];
        }
    }

    if (effect.windward5 && combatState.aeroErosion > 0) {
        mergedBuffs.critRate = (mergedBuffs.critRate ?? 0) + 10;
        mergedBuffs.aero = (mergedBuffs.aero ?? 0) + 30;
    }

    if (effect.molten5) mergedBuffs.fusion = (mergedBuffs.fusion ?? 0) + 30;
    if (effect.sierra5) mergedBuffs.aero = (mergedBuffs.aero ?? 0) + 30;
    if (effect.celestial5) mergedBuffs.spectro = (mergedBuffs.spectro ?? 0) + 30;
    if (effect.rejuvenating5) mergedBuffs.atkPercent = (mergedBuffs.atkPercent ?? 0) + 15;
    if (effect.radiance5p1) mergedBuffs.critRate = (mergedBuffs.critRate ?? 0) + 20;
    if (effect.radiance5p2 && combatState.spectroFrazzle >= 10) mergedBuffs.spectro = (mergedBuffs.spectro ?? 0) + 15;
    if (effect.welkin5 ) mergedBuffs.aero = (mergedBuffs.aero ?? 0) + 30;
    if (effect.clawprint5 ) {
        mergedBuffs.fusion = (mergedBuffs.fusion ?? 0) + 15;
        mergedBuffs.resonanceLiberation = (mergedBuffs.resonanceLiberation ?? 0) + 20;
    }
    if (effect.empyrean5 ) mergedBuffs.atkPercent = (mergedBuffs.atkPercent ?? 0) + 20;
    if (effect.frosty5p1 ) mergedBuffs.glacio = (mergedBuffs.glacio ?? 0) + 22.5;

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
    if (lawOfHarmonyStack > 0) mergedBuffs.heavyAtk = (mergedBuffs.heavyAtk ?? 0) + 30;
    mergedBuffs.echoSkill = (mergedBuffs.echoSkill ?? 0) + 4 * lawOfHarmonyStack;

    if (effect.flamewingsShadow2pcP1 && effect.flamewingsShadow2pcP2) mergedBuffs.fusion = (mergedBuffs.fusion ?? 0) + 16;

    if (effect.threadOfSeveredFate3pc) {
        mergedBuffs.atkPercent = (mergedBuffs.atkPercent ?? 0) + 20;
        mergedBuffs.havoc = (mergedBuffs.havoc ?? 0) + 30;
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

export const setEffectBuffMap = {
    1:{ // Freezing Frost
        setMax:5,
        frost5pc:{glacio:10,max:{glacio:30}},              // 10×3 stacks = 30
        frosty5p1:{glacio:7.5,max:{glacio:22.5}}           // 7.5×3 stacks = 22.5
    },
    2:{setMax:5,molten5:{fusion:30,max:{fusion:30}}},             // flat
    3:{setMax:5,void5pc:{electro:15,max:{electro:30}}},           // 15×2 stacks = 30
    4:{setMax:5,sierra5:{aero:30,max:{aero:30}}},                 // flat
    5:{setMax:5,celestial5:{spectro:30,max:{spectro:30}}},        // flat
    6:{setMax:5,eclipse5pc:{havoc:7.5,max:{havoc:30}}},           // 7.5×4 stacks = 30
    7:{setMax:5,rejuvenating5:{atkPercent:15,max:{atkPercent:15}}}, // flat
    9:{setMax:5,lingering5p1:{atkPercent:5,max:{atkPercent:20}}}, // 5×4 stacks = 20
    10:{ // Frosty Resolve
        setMax:5,
        frosty5p1:{glacio:7.5,max:{glacio:22.5}},          // 7.5×3 stacks
        frosty5p2:{resonanceSkill:18,max:{resonanceSkill:36}} // 18×2 stacks
    },
    11:{ // Radiance
        setMax:5,
        radiance5p1:{critRate:20,max:{critRate:20}},       // flat
        radiance5p2:{spectro:15,max:{spectro:15}}          // conditional flat
    },
    13:{setMax:5,empyrean5:{atkPercent:20,max:{atkPercent:20}}},  // flat
    16:{setMax:5,welkin5:{aero:30,max:{aero:30}}},                // flat
    17:{setMax:5,windward5:{critRate:10,aero:30,max:{critRate:10,aero:30}}}, // flat conditional
    18:{setMax:5,clawprint5:{fusion:15,resonanceLiberation:20,max:{fusion:15,resonanceLiberation:20}}}, // flat

    // --- 3-piece sets ---
    19:{setMax:3,dreamOfTheLost3pc:{critRate:20,echoSkill:35,max:{critRate:20,echoSkill:35}}},
    20:{setMax:3,crownOfValor3pc:{atkPercent:6,critDmg:4,max:{atkPercent:30,critDmg:20}}},
    21:{setMax:3,lawOfHarmony3p:{heavyAtk:30,echoSkill:4,max:{heavyAtk:30,echoSkill:16}}},
    22:{ // Flamewings Shadow
        setMax:3,
        flamewingsShadow2pcP1:{fusion:16,max:{fusion:16}},
        flamewingsShadow2pcP2:{fusion:16,max:{fusion:16}}
    },
    23:{setMax:3,threadOfSeveredFate3pc:{atkPercent:20,havoc:30,max:{atkPercent:20,havoc:30}}},
};

const statMirrors = {
    resonanceSkill: ["skillAtk"],
    resonanceLiberation: ["ultimateAtk"]
};

export function removeSetEffectsFromBuffs(mergedBuffs, sets, runtime, skillType = null) {
    if (!mergedBuffs) return {};
    const newBuffs = { ...mergedBuffs };
    const setArray = Array.isArray(sets) ? sets : [{setId: sets, count: 5}];
    const subtractBuffs = (buffObj) => {
        if (!buffObj) return;
        for (const [stat, val] of Object.entries(buffObj)) {
            if (val == null) continue;
            const targets = [stat, ...(statMirrors[stat] ?? [])];
            for (const target of targets) {
                const current = Number(newBuffs[target] ?? 0);
                const result = current - Number(val);
                if (Math.abs(result) < 1e-6) {
                    delete newBuffs[target];
                } else {
                    newBuffs[target] = result;
                }
            }
        }
    };

    for (const entry of setArray) {
        const id = entry?.setId ?? entry;
        const count = entry?.count ?? 0;
        const setData = echoSetBuffs[id];
        if (!setData) continue;
        if (count >= 2 && setData.twoPiece) subtractBuffs(setData.twoPiece);
        if (count >= 5 && setData.fivePiece) subtractBuffs(setData.fivePiece);
    }

    const activeStates = runtime?.activeStates ?? {};
    if (activeStates?.flamewingsShadow2pcP2 && skillType?.includes("echoSkill")) subtractBuffs({critRate: 20});
    if (activeStates?.flamewingsShadow2pcP1 && skillType?.includes("heavy")) subtractBuffs({critRate: 20});

    for (const entry of setArray) {
        const id = entry?.setId ?? entry;
        if (id === 22) {
            const p1 = activeStates?.flamewingsShadow2pcP1;
            const p2 = activeStates?.flamewingsShadow2pcP2;
            if (p1 && p2) {
                subtractBuffs({ fusion: 16 });
            }
            continue;
        }
        const setEffects = setEffectBuffMap[id];
        if (!setEffects) continue;
        for (const [stateKey, buffs] of Object.entries(setEffects)) {
            if (!activeStates[stateKey]) continue;
            const buffData = buffs.max ?? buffs;
            subtractBuffs(buffData);
        }
    }

    return newBuffs;
}

export function applySetEffectsToBuffs(mergedBuffs, sets) {
    if (!mergedBuffs) return {};
    const newBuffs = { ...mergedBuffs };
    const setArray = Array.isArray(sets) ? sets : [sets];

    const addBuffs = (buffObj) => {
        if (!buffObj) return;
        for (const [key, value] of Object.entries(buffObj)) {
            newBuffs[key] = (Number(newBuffs[key] ?? 0)) + Number(value ?? 0);
        }
    };

    for (const entry of setArray) {
        const id = entry?.setId ?? entry;
        const count = entry?.count ?? 0;
        const setEffects = setEffectBuffMap[id];
        if (!setEffects) continue;

        const maxPieces = setEffects.setMax ?? 5;
        if (count < maxPieces) continue; // only apply full set effects

        for (const [stateKey, buffs] of Object.entries(setEffects)) {
            if (stateKey === "setMax") continue;

            // apply only the "max" buffs version if available
            const maxBuffs = buffs.max ?? buffs;
            addBuffs(maxBuffs);
        }
    }

    return newBuffs;
}

export function getSetPlanFromEchoes(equippedEchoes = []) {
    if (!Array.isArray(equippedEchoes) || equippedEchoes.length === 0) return null;

    // Count how many echoes belong to each set
    const counts = {};
    for (const echo of equippedEchoes) {
        const sid = echo?.selectedSet ?? echo?.setId;
        if (!sid) continue;
        counts[sid] = (counts[sid] ?? 0) + 1;
    }

    const entries = Object.entries(counts).map(([setId, count]) => ({
        setId: Number(setId),
        count
    }));

    if (entries.length === 0) return null;
    return entries.sort((a, b) => a.setId - b.setId);
}

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
            if (skillMeta.name.includes('Leviathan Skill 2') && combatState.havocBane > 0) {
                skillMeta.skillDmgTaken = (skillMeta.skillDmgTaken ?? 0) + 100;
            }
            return skillMeta;
        }
    },
};

export function applyMainEchoBuffLogic({ equippedEchoes, mergedBuffs, characterState, charId }) {
    const activeStates = characterState?.activeStates ?? {};
    const mainEcho = equippedEchoes?.[0];
    if (!mainEcho) return mergedBuffs;

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

export function removeMainEchoBuffLogic({ equippedEchoes, mergedBuffs, characterState, charId }) {
    const activeStates = characterState?.activeStates ?? {};
    const mainEcho = equippedEchoes?.[0];
    if (!mainEcho) return mergedBuffs;

    const buffs = mainEchoBuffs?.[mainEcho.id];
    if (!buffs) return mergedBuffs;

    const { always, toggleable, stackable } = buffs;

    const remove = (stat, val) => {
        mergedBuffs[stat] = (mergedBuffs[stat] ?? 0) - val;
        if (stat === 'resonanceLiberation') {
            mergedBuffs.ultimateAtk = (mergedBuffs.ultimateAtk ?? 0) - val;
        }
        if (stat === 'resonanceSkill') {
            mergedBuffs.skillAtk = (mergedBuffs.skillAtk ?? 0) - val;
        }
    }

    if (always) {
        for (const [stat, val] of Object.entries(always)) {
            remove(stat, val);
        }
    }

    if (toggleable && activeStates?.mainEchoToggle && toggleable.buffs) {
        for (const [stat, val] of Object.entries(toggleable.buffs)) {
            if (stat === 'element') {
                for (const elem of Object.values(elementMap ?? {})) {
                    mergedBuffs[elem] = (mergedBuffs[elem] ?? 0) - val;
                }
            } else {
                remove(stat, val);

            }
        }
    }

    if (stackable) {
        const stackKey = stackable.key ?? 'mainEchoStacks';
        const currentStacks = Math.min(activeStates?.[stackKey] ?? 0, stackable.max ?? 1);

        for (const [stat, perStackVal] of Object.entries(stackable.buffsPerStack)) {
            const total = perStackVal * currentStacks;
            remove(stat, total);

        }
    }

    if (mainEcho.id === '6000106' && (charId === '1409' || charId === '1406' || charId === '1408')) {
        mergedBuffs.aero = (mergedBuffs.aero ?? 0) - 10;
    }

    return mergedBuffs;
}
