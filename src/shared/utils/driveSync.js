import {refreshAccessTokenIfNeeded} from "./googleAuth.js";
import {setPersistentValue} from '@shared/hooks/usePersistentState.js';

const BACKUP_PREFIX = 'wuwacalculator-all-data-';
const MAX_BACKUPS = 10;

function collectAllDataPayload() {
    const parentKeys = ['__charInfo__', '__controls__', '__stores__'];
    const result = { "All Data": {} };

    for (const key of parentKeys) {
        try {
            const raw = localStorage.getItem(key);
            result["All Data"][key] = raw ? JSON.parse(raw) : {};
        } catch (err) {
            console.warn(`[Drive Sync] Failed to read key ${key}:`, err);
            result["All Data"][key] = { error: "Failed to parse data" };
        }
    }

    return result;
}

export async function uploadToDrive(accessToken, fileContent) {
    accessToken = await refreshAccessTokenIfNeeded() || accessToken;

    const metadata = {
        name: `${BACKUP_PREFIX}${new Date().toISOString()}.json`,
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

    const fetchFiles = async (query) => {
        const encoded = encodeURIComponent(query);
        const res = await fetch(
            `https://www.googleapis.com/drive/v3/files?q=${encoded}&spaces=appDataFolder&fields=files(id,createdTime,name)&orderBy=createdTime desc`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const data = await res.json();
        return data.files || [];
    };

    const newBackups = await fetchFiles(`name contains '${BACKUP_PREFIX}' and 'appDataFolder' in parents`);
    const legacyBackups = await fetchFiles(`name contains 'wuwacalculator-sync-' and 'appDataFolder' in parents`);

    // Remove legacy backups entirely to avoid double retention and stale payloads
    for (const file of legacyBackups) {
        await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${accessToken}` }
        });
    }

    if (newBackups.length > MAX_BACKUPS) {
        const toDelete = newBackups.slice(MAX_BACKUPS);
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

    const queries = [
        encodeURIComponent(`name contains '${BACKUP_PREFIX}' and 'appDataFolder' in parents`),
        encodeURIComponent("name contains 'wuwacalculator-sync-' and 'appDataFolder' in parents") // legacy
    ];

    for (const query of queries) {
        const res = await fetch(
            `https://www.googleapis.com/drive/v3/files?q=${query}&spaces=appDataFolder&fields=files(id,createdTime)&orderBy=createdTime desc`,
            {
                headers: { Authorization: `Bearer ${accessToken}` }
            }
        );

        const data = await res.json();
        if (data.files?.[0]) return data.files[0];
    }

    return null;
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

        if (data?.["All Data"]) {
            for (const [key, value] of Object.entries(data["All Data"])) {
                localStorage.setItem(key, JSON.stringify(value ?? {}));
            }
        } else {
            // Legacy single-level backups
            for (const [key, value] of Object.entries(data)) {
                setPersistentValue(key, value);
            }
        }

        //alert("Restore complete! Reloading...");
        window.location.href = "/";
    } catch (err) {
        console.error("Restore failed", err);
        alert("Restore failed.");
    }
}

export function getSyncData() {
    const payload = collectAllDataPayload();
    return JSON.stringify(payload);
}
