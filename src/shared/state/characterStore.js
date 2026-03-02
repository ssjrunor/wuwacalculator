function cloneData(value) {
    if (value == null) return value;
    try {
        if (typeof structuredClone === 'function') {
            return structuredClone(value);
        }
    } catch {
        // Fall through to JSON clone.
    }
    return JSON.parse(JSON.stringify(value));
}

function normalizeTraceNodes(traceNodeBuffs) {
    const activeNodes = traceNodeBuffs?.activeNodes ?? {};
    return {
        activeNodeIds: Object.keys(activeNodes).filter((key) => Boolean(activeNodes[key])),
        buffs: traceNodeBuffs ?? {},
    };
}

function normalizeWeapon(combatState) {
    if (!combatState || typeof combatState !== 'object') return null;
    return {
        id: combatState.weaponId ?? null,
        level: combatState.weaponLevel ?? null,
        rank: combatState.weaponRank ?? null,
        rarity: combatState.weaponRarity ?? null,
        baseAtk: combatState.weaponBaseAtk ?? null,
        stat: combatState.weaponStat ?? null,
        effectName: combatState.weaponEffectName ?? null,
        effectText: combatState.weaponEffect ?? null,
        effectParam: combatState.weaponParam ?? null,
    };
}

export function normalizeCharacterRuntimeState(rawState = {}) {
    if (rawState?.character && rawState?.progression) {
        return rawState;
    }

    const combatState = rawState.CombatState ?? {};

    return {
        character: {
            id: rawState.Id ?? rawState.id ?? null,
            name: rawState.Name ?? '',
            attribute: rawState.Attribute ?? null,
            weaponType: rawState.WeaponType ?? null,
        },
        progression: {
            characterLevel: rawState.CharacterLevel ?? null,
            skillLevels: rawState.SkillLevels ?? {},
            traceNodes: normalizeTraceNodes(rawState.TraceNodeBuffs),
        },
        stats: {
            base: rawState.Stats ?? {},
            final: rawState.FinalStats ?? {},
        },
        equipment: {
            weapon: normalizeWeapon(combatState),
            echoes: Array.isArray(rawState.equippedEchoes) ? rawState.equippedEchoes : [],
        },
        buffs: {
            custom: rawState.CustomBuffs ?? {},
            combat: combatState,
            merged: rawState.mergedBuffs ?? {},
        },
        combat: {
            enemyLevel: combatState.enemyLevel ?? null,
            enemyRes: combatState.enemyRes ?? null,
            statuses: {
                spectroFrazzle: combatState.spectroFrazzle ?? 0,
                aeroErosion: combatState.aeroErosion ?? 0,
                havocBane: combatState.havocBane ?? 0,
                electroFlare: combatState.electroFlare ?? 0,
            },
        },
        team: {
            memberIds: Array.isArray(rawState.Team) ? rawState.Team : [],
            members: rawState.teamMembers ?? [],
            rotations: {
                teamRotation: rawState.teamRotation ?? {},
                teamRotationSummary: rawState.teamRotationSummary ?? {},
            },
        },
        skills: {
            meta: rawState.skillsMeta ?? {},
            results: rawState.allSkillResults ?? {},
            groupedOptions: rawState.groupedSkillOptions ?? {},
        },
        rotation: {
            entries: rawState.rotationEntries ?? [],
            initialized: Boolean(rawState._rotationInitialized),
        },
        calculators: {
            targetSkills: rawState.targetSkills ?? {},
            randGen: rawState.randGenSettings ?? {},
            optimizer: rawState.optimizerSettings ?? {},
            suggestions: rawState.suggestionSettings ?? {},
        },
        uiFlags: {
            activeStates: rawState.activeStates ?? {},
            sequenceToggles: rawState.sequenceToggles ?? {},
        },
    };
}

export function denormalizeCharacterRuntimeState(state = {}) {
    if (!state?.character || !state?.progression) {
        return state ?? {};
    }

    const character = state.character ?? {};
    const progression = state.progression ?? {};
    const stats = state.stats ?? {};
    const equipment = state.equipment ?? {};
    const buffs = state.buffs ?? {};
    const team = state.team ?? {};
    const skills = state.skills ?? {};
    const rotation = state.rotation ?? {};
    const calculators = state.calculators ?? {};
    const uiFlags = state.uiFlags ?? {};

    return {
        Id: character.id ?? null,
        id: character.id ?? null,
        Name: character.name ?? '',
        Attribute: character.attribute ?? null,
        WeaponType: character.weaponType ?? null,
        CharacterLevel: progression.characterLevel ?? null,
        SkillLevels: progression.skillLevels ?? {},
        TraceNodeBuffs: progression.traceNodes?.buffs ?? {},
        Stats: stats.base ?? {},
        FinalStats: stats.final ?? {},
        equippedEchoes: equipment.echoes ?? [],
        CombatState: buffs.combat ?? {},
        CustomBuffs: buffs.custom ?? {},
        mergedBuffs: buffs.merged ?? {},
        Team: team.memberIds ?? [],
        teamMembers: team.members ?? [],
        teamRotation: team.rotations?.teamRotation ?? {},
        teamRotationSummary: team.rotations?.teamRotationSummary ?? {},
        skillsMeta: skills.meta ?? {},
        allSkillResults: skills.results ?? {},
        groupedSkillOptions: skills.groupedOptions ?? {},
        rotationEntries: rotation.entries ?? [],
        _rotationInitialized: Boolean(rotation.initialized),
        targetSkills: calculators.targetSkills ?? {},
        randGenSettings: calculators.randGen ?? {},
        optimizerSettings: calculators.optimizer ?? {},
        suggestionSettings: calculators.suggestions ?? {},
        activeStates: uiFlags.activeStates ?? {},
        sequenceToggles: uiFlags.sequenceToggles ?? {},
    };
}

let characters = {};
let activeCharacterId = null;
const listeners = new Set();

function getCharacterId(entry) {
    return entry?.character?.id ?? null;
}

function notify() {
    const snapshot = cloneData(characters) ?? {};
    listeners.forEach((callback) => callback(snapshot));
}

function normalizeEntry(entry = {}) {
    return normalizeCharacterRuntimeState(entry);
}

function getCharacters() {
    return cloneData(characters) ?? {};
}

function getCharacter(id) {
    if (!id) return null;
    return cloneData(characters[id] ?? null);
}

function setCharacters(nextCharacters = {}) {
    const normalized = {};
    for (const [id, value] of Object.entries(nextCharacters)) {
        normalized[id] = normalizeEntry(value);
    }
    characters = normalized;
    notify();
}

function addCharacter(rawState) {
    const normalized = normalizeEntry(rawState);
    const id = getCharacterId(normalized);
    if (!id) return true;
    const exists = Boolean(characters[id]);
    if (!exists) {
        characters[id] = normalized;
        notify();
    }
    return exists;
}

function updateCharacter(updatedState) {
    const normalized = normalizeEntry(updatedState);
    const id = getCharacterId(normalized);
    if (!id) return;
    characters[id] = normalized;
    notify();
}

function removeCharacter(id) {
    if (!id || !characters[id]) return;
    const next = { ...characters };
    delete next[id];
    characters = next;
    if (activeCharacterId === id) activeCharacterId = null;
    notify();
}

function clearCharacters() {
    characters = {};
    activeCharacterId = null;
    notify();
}

function subscribeCharacterStore(callback) {
    listeners.add(callback);
    callback(getCharacters());
    return () => listeners.delete(callback);
}

function getActiveCharacterId() {
    return activeCharacterId;
}

function setActiveCharacterId(id) {
    activeCharacterId = id ?? null;
    notify();
}

export const characterStore = {
    getCharacters,
    getCharacter,
    setCharacters,
    addCharacter,
    updateCharacter,
    removeCharacter,
    clearCharacters,
    subscribe: subscribeCharacterStore,
    getActiveCharacterId,
    setActiveCharacterId,
    normalizeCharacterRuntimeState,
    denormalizeCharacterRuntimeState,
};

export default characterStore;
