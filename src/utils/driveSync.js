import {refreshAccessTokenIfNeeded} from "./googleAuth.js";
import {getPersistentValue, setPersistentValue} from "../hooks/usePersistentState.js";

export async function uploadToDrive(accessToken, fileContent) {
    accessToken = await refreshAccessTokenIfNeeded() || accessToken;

    const metadata = {
        name: `wuwacalculator-sync-${new Date().toISOString()}.json`,
        mimeType: 'application/json',
        parents: ['appDataFolder']
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([fileContent], { type: 'application/json' }));

    const uploadRes = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
            method: 'POST',
            headers: new Headers({ Authorization: `Bearer ${accessToken}` }),
            body: form
        }
    );

    if (uploadRes.status === 401) {
        const newToken = await refreshAccessTokenIfNeeded();
        if (newToken) {
            return uploadToDrive(newToken, fileContent);
        }
        throw new Error('Unauthorized: token refresh failed.');
    }

    const result = await uploadRes.json();
    await pruneOldBackups(accessToken);
}

async function pruneOldBackups(accessToken) {
    accessToken = await refreshAccessTokenIfNeeded() || accessToken;

    const res = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='wuwacalculator-sync.json' and 'appDataFolder' in parents&spaces=appDataFolder&fields=files(id,createdTime)&orderBy=createdTime desc`,
        {
            headers: { Authorization: `Bearer ${accessToken}` }
        }
    );

    const data = await res.json();
    const files = data.files || [];

    if (files.length > 10) {
        const toDelete = files.slice(10);
        for (const file of toDelete) {
            await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            //console.log("Deleted old backup:", file.id);
        }
    }
}

async function getLatestBackupFile(accessToken) {
    accessToken = await refreshAccessTokenIfNeeded() || accessToken;

    const query = encodeURIComponent("name contains 'wuwacalculator-sync-' and 'appDataFolder' in parents");
    const res = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${query}&spaces=appDataFolder&fields=files(id,createdTime)&orderBy=createdTime desc`,
        {
            headers: { Authorization: `Bearer ${accessToken}` }
        }
    );

    const data = await res.json();
    return data.files?.[0];
}

async function downloadFileById(fileId, accessToken) {
    accessToken = await refreshAccessTokenIfNeeded() || accessToken;

    const res = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        }
    );

    if (!res.ok) {
        throw new Error("Failed to download file: " + res.statusText);
    }

    return await res.json();
}

export async function restoreFromDrive(accessToken) {
    accessToken = await refreshAccessTokenIfNeeded() || accessToken;

    try {
        const latest = await getLatestBackupFile(accessToken);
        if (!latest) {
            alert("No backup file found in Drive.");
            return;
        }

        const data = await downloadFileById(latest.id, accessToken);
        for (const [key, value] of Object.entries(data)) {
            setPersistentValue(key, value);
        }

        //alert("Restore complete! Reloading...");
        window.location.href = "/";
    } catch (err) {
        console.error("Restore failed", err);
        alert("Restore failed.");
    }
}

const syncKeys = [
    'activeCharacterId',
    'characterRuntimeStates',
    'echoBag',
    'enemyLevel',
    'enemyRes',
    'globalSavedRotations',
    'seenChangelogVersion',
    'showSubHits',
    'user-dark-variant',
    'user-has-selected-theme',
    'user-theme',
    'globalSavedTeamRotations'
]

export function getSyncData() {
    const data = {};
    for (const key of syncKeys) {
        const value = getPersistentValue(key);
        if (value !== null) data[key] = value;
    }
    return JSON.stringify(data);
}