import {useCallback, useEffect, useState} from 'react';
import {getPersistentValue, setPersistentValue} from "./usePersistentState.js";

function formatErrorMessage(status, statusText, bodyText) {
  let detail = bodyText || "";
  try {
    const parsed = JSON.parse(bodyText);
    if (parsed && typeof parsed === "object") {
      if (parsed.error || parsed.detail || parsed.message) {
        const pieces = [parsed.error, parsed.detail, parsed.message].filter(Boolean);
        detail = pieces.join(": ");
      }
    }
  } catch {
    /* ignore */
  }
  const base = `HTTP ${status} ${statusText || ""}`.trim();
  if (!detail) return base;
  return `${base} - ${detail}`;
}

async function exchangeCodeWithKarmitis(code, redirectUriOverride) {
  const redirectUri =
    redirectUriOverride ||
    import.meta.env.VITE_KARMITIS_REDIRECT_URI ||
    `${window.location.origin}/auth/karmitis/callback`;
  const body = {
    code,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  };
  const res = await fetch(`/api/karmitis-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(formatErrorMessage(res.status, res.statusText, text));
  }
  return res.json();
}

async function refreshKarmitisToken(refreshToken) {
  const body = {
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  };
  const res = await fetch(`/api/karmitis-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(formatErrorMessage(res.status, res.statusText, text));
  }
  return res.json();
}

export function useKarmitisAuth() {
    const [user, setUser] = useState(null);
    const [accessToken, setAccessToken] = useState(null);
    const [error, setError] = useState(null);

    const persistTokens = useCallback((updater) => {
        const current = getPersistentValue('karmitisTokens', {}) || {};
        const next = typeof updater === 'function' ? updater(current) : updater;
        setPersistentValue('karmitisTokens', JSON.stringify(next));
        return next;
    }, []);

    useEffect(() => {
        const stored = getPersistentValue('karmitisTokens', {});
        if (stored?.access_token) {
            setAccessToken(stored.access_token);
            setUser(stored.user || stored.karmitisUser || null);
        }
    }, []);

    const login = useCallback(() => {
        setError(null);
        const redirectUri = import.meta.env.VITE_KARMITIS_REDIRECT_URI || `${window.location.origin}/auth/karmitis/callback`;
        const clientId = import.meta.env.VITE_KARMITIS_CLIENT_ID || localStorage.getItem('karmitis_client_id');
        if (!clientId) {
            setError('Missing Karmitis client ID');
            console.error('Missing Karmitis client ID');
            return;
        }
        const baseUrl = import.meta.env.VITE_KARMITIS_BASE_URL || "http://localhost:4000";
        window.location.href = `${baseUrl}/auth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code`;
    }, []);

    const exchangeCode = useCallback(async (code) => {
        try {
            setError(null);
            const tokens = await exchangeCodeWithKarmitis(code);
            persistTokens((current) => ({
                ...current,
                ...tokens,
                user: tokens.user || current.user || current.karmitisUser || null,
                karmitisUser: tokens.user || current.karmitisUser || current.user || null,
                issued_at: Date.now()
            }));
            setAccessToken(tokens.access_token);
            setUser(tokens.user || null);
        } catch (err) {
            setError(err.message || 'Karmitis code exchange failed');
            console.error('Karmitis code exchange failed:', err);
        }
    }, [persistTokens]);

    const logout = useCallback(() => {
        setUser(null);
        setAccessToken(null);
        setError(null);
        localStorage.removeItem('karmitisTokens');
    }, []);

    const refreshToken = useCallback(async () => {
        const stored = getPersistentValue('karmitisTokens', {});
        if (stored?.refresh_token) {
            try {
                const tokens = await refreshKarmitisToken(stored.refresh_token);
                persistTokens((current) => ({
                    ...current,
                    ...tokens,
                    user: tokens.user || current.user || current.karmitisUser || null,
                    karmitisUser: tokens.user || current.karmitisUser || current.user || null,
                    issued_at: Date.now()
                }));
                setAccessToken(tokens.access_token);
                if (tokens.user) setUser(tokens.user);
            } catch (err) {
                console.error('Karmitis token refresh failed:', err);
                logout(); // Logout if refresh fails
            }
        }
    }, [logout, persistTokens]);

    useEffect(() => {
        const interval = setInterval(refreshToken, 30 * 60 * 1000); // Refresh every 30 minutes
        return () => clearInterval(interval);
    }, [refreshToken]);

    useEffect(() => {
        if (!accessToken) {
            setUser(null);
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(`/api/karmitis-me`, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });
                if (!res.ok) {
                    const body = await res.text().catch(() => "");
                    console.error('Failed to load Karmitis user profile:', res.status, body);
                    return;
                }
                const data = await res.json();
                if (!cancelled) {
                    setUser(data);
                    persistTokens((current) => ({ ...current, user: data, karmitisUser: data }));
                }
            } catch (err) {
                console.error('Failed to fetch Karmitis user:', err);
                if (!cancelled) setUser(null);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [accessToken, persistTokens]);

    return { user, accessToken, error, login, logout, exchangeCode, refreshToken };
}
