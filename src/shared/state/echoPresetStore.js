import {isEqual} from "lodash";
import {getPersistentValue, setPersistentValue} from '@shared/hooks/usePersistentState.js';

let echoPresetStore = [];
const storeMap = new Map();

const listeners = new Set();

try {
    const stored = getPersistentValue('echoPresets');
    if (stored) {
        try {
            echoPresetStore = typeof stored === 'string' ? JSON.parse(stored) : stored;
        } catch (err) {
            console.warn('Failed to parse stored echo presets:', err);
        }
    }
    echoPresetStore.forEach(p => storeMap.set(p.id, p));
} catch (e) {
    console.warn('Failed to load echo presets', e);
}

let needsSave = false;
function scheduleSave() {
    needsSave = true;
    try {
        setPersistentValue('echoPresets', JSON.stringify(echoPresetStore));
        needsSave = false;
    } catch (e) {
        console.warn('Failed to save echo presets', e);
    }
}

function notify() {
    listeners.forEach(cb => cb([...echoPresetStore]));
    try {
        setPersistentValue('echoPresets', JSON.stringify(echoPresetStore));
    } catch (e) {
        console.warn('Failed to save echo presets', e);
    }
}

export function getEchoPresets() {
    return Object.freeze([...echoPresetStore]);
}

export function clearEchoStore() {
    echoPresetStore = [];
    storeMap.clear();
    try {
        localStorage.removeItem('echoPresets');
    } catch (e) {
        console.warn('Failed to clear echoPresets from localStorage', e);
    }
    notify();
}

export function getEchoPresetById(id) {
    return storeMap.get(id) ?? null;
}

export function subscribeEchoPresets(cb) {
    listeners.add(cb);
    cb(echoPresetStore);
    return () => listeners.delete(cb);
}

export function addEchoPreset(presetOrRuntime) {
    const isRuntime =
        presetOrRuntime &&
        typeof presetOrRuntime === 'object' &&
        Array.isArray(presetOrRuntime.equippedEchoes);

    const echoesToCompare = isRuntime
        ? presetOrRuntime.equippedEchoes
        : presetOrRuntime.echoes;

    const charId = presetOrRuntime.Id ?? presetOrRuntime.charId ?? '';

    const base = isRuntime
        ? {
            charId,
            name: `${presetOrRuntime.Name ?? 'Unnamed'}'s Preset`,
            charName: presetOrRuntime.Name ?? 'Unnamed',
            echoes: presetOrRuntime.equippedEchoes ?? [null, null, null, null, null],
            equipped: charId ? [charId] : [],
        }
        : {
            name: presetOrRuntime.name ?? 'New Echo Preset',
            charId,
            echoes: presetOrRuntime.echoes ?? [null, null, null, null, null],
            equipped: [],
        };

    const newPreset = {
        id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
        name: base.name,
        charId: base.charId,
        charName: base.charName ?? 'Unnamed',
        echoes: base.echoes,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        tags: presetOrRuntime.tags ?? [],
        equipped: base.equipped,
    };

    newPreset.empty = Array.isArray(newPreset.echoes) && newPreset.echoes.every(e => e == null);

    if (newPreset.empty) {
        return newPreset;
    }

    if (Array.isArray(echoesToCompare)) {
        const alreadyExists = echoPresetStore.some(p =>
            deepCompareEchoArrays(p.echoes, echoesToCompare)
        );
        if (alreadyExists) return null;
    }

    echoPresetStore.push(newPreset);
    storeMap.set(newPreset.id, newPreset);
    notify();
    return newPreset;
}

export function updateEchoPreset(id, changes) {
    const preset = storeMap.get(id);
    if (!preset) return false;

    let changed = false;
    for (const key in changes) {
        if (!isEqual(preset[key], changes[key])) {
            changed = true;
            break;
        }
    }
    if (!changed) return false;

    Object.assign(preset, changes, { updatedAt: Date.now() });
    notify();
    return true;
}

export function deleteEchoPreset(id) {
    const idx = echoPresetStore.findIndex(p => p.id === id);
    if (idx !== -1) echoPresetStore.splice(idx, 1);
    storeMap.delete(id); // 🔹 remove from index
    notify();
}

export function syncAllPresetsForRuntime(runtime) {
    if (!runtime || !Array.isArray(runtime.equippedEchoes)) return;

    echoPresetStore.forEach(preset => {
        syncPresetEquipState(preset.id, runtime);
    });
}

export function syncPresetEquipState(presetId, runtime) {
    if (!runtime || !Array.isArray(runtime.equippedEchoes)) return false;

    const preset = getEchoPresetById(presetId);
    if (!preset) return false;

    const matches = compareEchoesWithPreset(runtime.equippedEchoes, preset);
    const charId = runtime.Id ?? runtime.charId ?? runtime.link;

    if (!charId) return false;

    const alreadyEquipped = preset.equipped.includes(charId);

    if (matches && !alreadyEquipped) {
        updateEchoPreset(presetId, {
            equipped: [...preset.equipped, charId]
        });
        return true;
    }

    if (!matches && alreadyEquipped) {
        updateEchoPreset(presetId, {
            equipped: preset.equipped.filter(id => id !== charId)
        });
        return false;
    }

    return matches;
}

export function compareEchoesWithPreset(echoes, presetOrId) {
    if (!Array.isArray(echoes)) return false;

    const preset =
        (typeof presetOrId === 'string' || typeof presetOrId === 'number')
            ? getEchoPresetById(presetOrId)
            : presetOrId;

    if (!preset || !Array.isArray(preset.echoes)) return false;

    return deepCompareEchoArrays(echoes, preset.echoes);
}

export function deepCompareEchoArrays(a, b) {
    if (a === b) return true;
    if (!Array.isArray(a) || !Array.isArray(b)) return false;

    const listA = a.filter(e => e);
    const listB = b.filter(e => e);
    if (listA.length !== listB.length) {
        return false;
    }

    const used = new Set();

    for (let i = 0; i < listA.length; i++) {
        const ea = listA[i];
        let found = false;

        for (let j = 0; j < listB.length; j++) {
            if (used.has(j)) continue;
            const eb = listB[j];

            if (areEchoesEqual(ea, eb)) {
                used.add(j);
                found = true;
                break;
            }
        }

        if (!found) {
            return false;
        }
    }
    return true;
}

function areEchoesEqual(ea, eb) {
    if (!ea || !eb) return false;
    if (ea.id !== eb.id) return false;
    if (ea.selectedSet !== eb.selectedSet) return false;
    if (!compareStats(ea.mainStats, eb.mainStats)) return false;
    return compareStats(ea.subStats, eb.subStats);

}

function compareStats(a, b) {
    if (!a && !b) return true;
    if (!a || !b) return false;
    const keysA = Object.keys(a);
    if (keysA.length !== Object.keys(b).length) return false;
    for (const key of keysA) {
        if (a[key] !== b[key]) return false;
    }
    return true;
}

export function buildPresetFilterOptions(characters = []) {
    const presets = echoPresetStore;

    const charMap = new Map();
    const equippedMap = new Map();

    presets.forEach(preset => {
        const charId = preset.charId;
        if (charId) {
            if (!charMap.has(charId)) {
                const character = characters.find(c => String(c.link) === String(charId));
                const label = character?.displayName ?? `Unknown (${charId})`;
                charMap.set(charId, {value: charId, label, presetIds: []});
            }
            charMap.get(charId).presetIds.push(preset.id);
        }

        if (Array.isArray(preset.equipped)) {
            preset.equipped.forEach(equippedCharId => {
                if (!equippedMap.has(equippedCharId)) {
                    const character = characters.find(c => String(c.link) === String(equippedCharId));
                    const label = character?.displayName ?? `Unknown (${equippedCharId})`;
                    equippedMap.set(equippedCharId, {value: equippedCharId, label, presetIds: []});
                }
                equippedMap.get(equippedCharId).presetIds.push(preset.id);
            });
        }
    });

    const charOptions = Array.from(charMap.values());
    const equippedOptions = Array.from(equippedMap.values());

    return {charOptions, equippedOptions};
}