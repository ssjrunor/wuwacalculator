import {isEqual} from 'lodash';
import {getPersistentValue, setPersistentValue} from '../hooks/usePersistentState.js';

export function normalizeCharacterRuntimeState(oldState = {}) {
    const character = {
        id: oldState.Id ?? oldState.id,
        name: oldState.Name,
        attribute: oldState.Attribute,
        weaponType: oldState.WeaponType,
    };

    const progression = {
        characterLevel: oldState.CharacterLevel,
        skillLevels: oldState.SkillLevels,
        traceNodes: {
            activeNodeIds: oldState.TraceNodeBuffs?.activeNodes
                ? Object.keys(oldState.TraceNodeBuffs.activeNodes).filter(k => oldState.TraceNodeBuffs.activeNodes[k])
                : [],
            buffs: oldState.TraceNodeBuffs,
        },
    };

    const stats = {
        base: oldState.Stats,
        final: oldState.FinalStats,
    };

    const equipment = {
        weapon: oldState.CombatState
            ? {
                id: oldState.CombatState.weaponId,
                level: oldState.CombatState.weaponLevel,
                rank: oldState.CombatState.weaponRank,
                rarity: oldState.CombatState.weaponRarity,
                baseAtk: oldState.CombatState.weaponBaseAtk,
                stat: oldState.CombatState.weaponStat,
                effectName: oldState.CombatState.weaponEffectName,
                effectText: oldState.CombatState.weaponEffect,
                effectParam: oldState.CombatState.weaponParam,
            }
            : undefined,
        echoes: oldState.equippedEchoes,
    };

    const buffs = {
        custom: oldState.CustomBuffs,
        combat: oldState.CombatState,
        merged: oldState.mergedBuffs,
    };

    const combat = {
        enemyLevel: oldState.CombatState?.enemyLevel,
        enemyRes: oldState.CombatState?.enemyRes,
        statuses: {
            spectroFrazzle: oldState.CombatState?.spectroFrazzle,
            aeroErosion: oldState.CombatState?.aeroErosion,
            havocBane: oldState.CombatState?.havocBane,
            electroFlare: oldState.CombatState?.electroFlare,
        },
    };

    const team = {
        memberIds: oldState.Team,
        members: oldState.teamMembers,
        rotations: {
            teamRotation: oldState.teamRotation,
            teamRotationSummary: oldState.teamRotationSummary,
        },
    };

    const skills = {
        meta: oldState.skillsMeta,
        results: oldState.allSkillResults,
        groupedOptions: oldState.groupedSkillOptions,
    };

    const rotation = {
        entries: oldState.rotationEntries,
        initialized: oldState._rotationInitialized,
    };

    const calculators = {
        targetSkills: oldState.targetSkills,
        randGen: oldState.randGenSettings,
        optimizer: oldState.optimizerSettings,
        suggestions: oldState.suggestionSettings,
    };

    const uiFlags = {
        activeStates: oldState.activeStates,
        sequenceToggles: oldState.sequenceToggles,
    };

    return {
        character,
        progression,
        stats,
        equipment,
        buffs,
        combat,
        team,
        skills,
        rotation,
        calculators,
        uiFlags,
    };
}

export function denormalizeCharacterRuntimeState(state = {}) {
    if (!state || typeof state !== 'object') return {};
    if (!state.character || !state.progression) return state;

    const character = state.character ?? {};
    const progression = state.progression ?? {};
    const stats = state.stats ?? {};
    const equipment = state.equipment ?? {};
    const buffs = state.buffs ?? {};
    const combat = state.combat ?? {};
    const team = state.team ?? {};
    const skills = state.skills ?? {};
    const rotation = state.rotation ?? {};
    const calculators = state.calculators ?? {};
    const uiFlags = state.uiFlags ?? {};

    return {
        Id: character.id,
        id: character.id,
        Name: character.name,
        Attribute: character.attribute,
        WeaponType: character.weaponType,
        CharacterLevel: progression.characterLevel,
        SkillLevels: progression.skillLevels,
        TraceNodeBuffs: progression.traceNodes?.buffs,
        Stats: stats.base,
        FinalStats: stats.final,
        equippedEchoes: equipment.echoes,
        CombatState: buffs.combat ?? combat,
        CustomBuffs: buffs.custom,
        mergedBuffs: buffs.merged,
        Team: team.memberIds,
        teamMembers: team.members,
        teamRotation: team.rotations?.teamRotation,
        teamRotationSummary: team.rotations?.teamRotationSummary,
        skillsMeta: skills.meta,
        allSkillResults: skills.results,
        groupedSkillOptions: skills.groupedOptions,
        rotationEntries: rotation.entries,
        _rotationInitialized: rotation.initialized,
        targetSkills: calculators.targetSkills,
        randGenSettings: calculators.randGen,
        optimizerSettings: calculators.optimizer,
        suggestionSettings: calculators.suggestions,
        activeStates: uiFlags.activeStates,
        sequenceToggles: uiFlags.sequenceToggles,
    };
}

let characters = {};
let activeCharacterId = null;
const listeners = new Set();

function normalizeEntry(entry = {}) {
    if (entry?.character && entry?.progression) return entry;
    return normalizeCharacterRuntimeState(entry);
}

try {
    const stored = getPersistentValue('characterRuntimeStates');
    if (stored && typeof stored === 'object') {
        characters = Object.fromEntries(
            Object.entries(stored).map(([id, value]) => [id, normalizeEntry(value)])
        );
    }
    const storedActive = getPersistentValue('activeCharacterId');
    if (storedActive !== undefined && storedActive !== null) {
        activeCharacterId = storedActive;
    }
} catch (e) {
    console.warn('Failed to load character store', e);
}

function notify() {
    const snapshot = { ...characters };
    listeners.forEach(cb => cb(snapshot));
    try {
        setPersistentValue('characterRuntimeStates', snapshot);
        setPersistentValue('activeCharacterId', activeCharacterId);
    } catch (e) {
        console.warn('Failed to sync character store', e);
    }
}

function getCharacters() {
    return { ...characters };
}

function getCharacter(id) {
    if (!id) return null;
    return characters?.[id] ? { ...characters[id] } : null;
}

function setCharacters(newCharacters) {
    const normalized = Object.fromEntries(
        Object.entries(newCharacters ?? {}).map(([id, value]) => [id, normalizeEntry(value)])
    );

    if (isEqual(normalized, characters)) return;

    characters = normalized;
    notify();
}

function addCharacter(rawState) {
    const normalized = normalizeEntry(rawState);
    const id = normalized?.character?.id;
    if (!id) return true;

    const exists = !!characters[id];
    if (!exists) {
        characters[id] = normalized;
        notify();
    }
    return exists;
}

function updateCharacter(updatedState) {
    const normalized = normalizeEntry(updatedState);
    const id = normalized?.character?.id;
    if (!id) return;

    if (isEqual(characters[id], normalized)) return;

    characters[id] = normalized;
    notify();
}

function removeCharacter(id) {
    if (!characters[id]) return;
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
    callback({ ...characters });
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
    denormalizeCharacterRuntimeState
};
