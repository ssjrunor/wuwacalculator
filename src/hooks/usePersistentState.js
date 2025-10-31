import { useState, useEffect } from 'react';

export function usePersistentState(key, defaultValue) {
    const namespace = findNamespace(key);
    const parentKey = namespace ? `__${namespace}__` : null;

    const [state, setState] = useState(() => {
        try {
            if (parentKey) {
                const parent = JSON.parse(localStorage.getItem(parentKey) || '{}');
                return parent[key] ?? defaultValue;
            } else {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            }
        } catch (e) {
            console.warn('Failed to load persistent state:', e);
            return defaultValue;
        }
    });

    useEffect(() => {
        try {
            if (parentKey) {
                const parent = JSON.parse(localStorage.getItem(parentKey) || '{}');
                parent[key] = state;
                localStorage.setItem(parentKey, JSON.stringify(parent));
            } else {
                localStorage.setItem(key, JSON.stringify(state));
            }
        } catch (e) {
            console.warn('Failed to save persistent state:', e);
        }
    }, [key, state, parentKey]);

    return [state, setState];
}

function findNamespace(key) {
    for (const [ns, keys] of Object.entries(namespaceMap)) {
        if (keys.includes(key)) return ns;
    }
    return null;
}

const namespaceMap = {
    controls: [
        'filterOption', 'guideToastShown', 'leftPaneView', 'seenChangelogVersion',
        'showCharacterOverview', 'showSubHits', 'smartFilter', 'sortKey', 'sortOrder',
        'userBodyFontName', 'userBodyFontURL', 'cookieNoticeDismissed', 'googleTokens',
        'user-light-variant',
        'user-dark-variant',
        'user-has-selected-theme',
        'user-theme'
    ],
    stores: [
        'echoBag', 'echoPresets', 'globalSavedRotations',
        'globalSavedTeamRotations', 'rotationEntriesStore'
    ],
    charInfo: [
        'activeCharacterId', 'characterRuntimeStates', 'enemyLevel',
        'enemyRes', 'team'
    ]
}

export function getPersistentValue(key, fallback = null) {
    try {
        const keyToNamespace = {};
        for (const [ns, keys] of Object.entries(namespaceMap)) {
            keys.forEach(k => (keyToNamespace[k] = ns));
        }

        const ns = keyToNamespace[key];
        const parentKey = ns ? `__${ns}__` : null;

        if (parentKey) {
            const parent = JSON.parse(localStorage.getItem(parentKey) || '{}');
            if (parent && key in parent) return parent[key];
        } else {
            const item = localStorage.getItem(key);
            if (item) return JSON.parse(item);
        }
    } catch (err) {
        console.warn('[PersistentStore] Failed to get key', key, err);
    }
    return fallback;
}

export function setPersistentValue(key, value) {
    if (typeof value === 'string') {
        try {
            JSON.parse(value);
            value = JSON.parse(value);
        } catch {}
    }
    try {
        const keyToNamespace = {};
        for (const [ns, keys] of Object.entries(namespaceMap)) {
            keys.forEach(k => (keyToNamespace[k] = ns));
        }

        const ns = keyToNamespace[key];
        const parentKey = ns ? `__${ns}__` : null;

        if (parentKey) {
            const parent = JSON.parse(localStorage.getItem(parentKey) || '{}');
            parent[key] = value;
            localStorage.setItem(parentKey, JSON.stringify(parent));
        } else {
            localStorage.setItem(key, JSON.stringify(value));
        }
    } catch (err) {
        console.warn('[PersistentStore] Failed to set key', key, err);
    }
}

export function migrateAndCleanPersistentKeys( logMessage = false ) {
    try {
        const keyToNamespace = {};
        for (const [ns, keys] of Object.entries(namespaceMap)) {
            keys.forEach(k => (keyToNamespace[k] = ns));
        }

        const allKeys = Object.keys(localStorage);

        for (const key of allKeys) {
            const ns = keyToNamespace[key];
            if (!ns) continue;

            const parentKey = `__${ns}__`;
            const rawValue = localStorage.getItem(key);
            if (rawValue == null) continue;

            let parent = {};
            try {
                parent = JSON.parse(localStorage.getItem(parentKey) || '{}');
            } catch {
                console.warn(`[Storage cleanup] Parent parse failed for ${parentKey}, resetting it`);
                parent = {};
            }

            if (Object.prototype.hasOwnProperty.call(parent, key)) {
                localStorage.removeItem(key);
                continue;
            }
            let parsedValue;
            try {
                parsedValue = JSON.parse(rawValue);
            } catch {
                parsedValue = rawValue;
                console.warn(`[Storage cleanup] Non-JSON value for key "${key}", keeping as string`);
            }
            parent[key] = parsedValue;
            localStorage.setItem(parentKey, JSON.stringify(parent));

            localStorage.removeItem(key);
        }

        if (logMessage) console.info('[Storage cleanup] Completed migration of namespaced keys');
    } catch (e) {
        console.warn('[Storage cleanup] Error:', e);
    }
}