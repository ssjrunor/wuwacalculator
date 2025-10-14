import {getPersistentValue, setPersistentValue} from "../hooks/usePersistentState.js";

export async function refreshAccessTokenIfNeeded() {
    const tokens = getPersistentValue('googleTokens', {});
    if (!tokens.access_token || !tokens.refresh_token) {
        //console.warn('No tokens available');
        return null;
    }

    const { access_token, refresh_token, expires_in, issued_at } = tokens;
    const safeExpiry = Number(expires_in) || 3600;
    const stillValid = Date.now() < (issued_at + safeExpiry * 1000 - 60_000);
    if (stillValid) {
        return access_token;
    }

    const res = await fetch('/api/refresh-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token }),
    });

    if (!res.ok) {
        console.error('Failed to refresh token:', await res.text());
        localStorage.removeItem('googleTokens');
        return null;
    }

    const newTokens = await res.json();
    const updated = {
        ...tokens,
        ...newTokens,
        issued_at: Date.now(),
    };

    setPersistentValue('googleTokens', JSON.stringify(updated));

    return updated.access_token;
}