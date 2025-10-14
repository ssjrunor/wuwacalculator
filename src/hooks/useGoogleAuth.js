import { useState, useEffect, useCallback } from 'react';
import { useGoogleLogin, googleLogout } from '@react-oauth/google';
import { refreshAccessTokenIfNeeded } from '../utils/googleAuth';
import {getPersistentValue, setPersistentValue} from "./usePersistentState.js";

export function useGoogleAuth() {
    const [user, setUser] = useState(null);
    const [accessToken, setAccessToken] = useState(null);

    useEffect(() => {
        const stored = getPersistentValue('googleTokens', {});
        if (stored?.access_token) {
            setAccessToken(stored.access_token);
            setUser(stored.user || null);
        }
    }, []);

    useEffect(() => {
        const interval = setInterval(async () => {
            const newToken = await refreshAccessTokenIfNeeded();
            if (newToken) setAccessToken(newToken);
        }, 30 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const login = useGoogleLogin({
        flow: 'auth-code',
        redirect_uri: import.meta.env.VITE_GOOGLE_REDIRECT_URI,
        scope:
            'https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',

        onSuccess: async (codeResponse) => {
            try {
                const payload = { code: codeResponse.code };

                const res = await fetch('/api/exchange-code', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });

                if (!res.ok) {
                    const text = await res.text();
                    console.error('Exchange failed, response text:', text);
                    throw new Error(text);
                }

                const tokens = await res.json();
                setPersistentValue('googleTokens',
                    JSON.stringify({ ...tokens, issued_at: Date.now() }));

                setAccessToken(tokens.access_token);
                setUser(tokens.user);
            } catch (err) {
                console.error('Exchange code failed:', err);
            }
        },

        onError: (err) => {
            console.error('Google login failed:', err);
            alert('Google login failed');
        },
    });

    const logout = useCallback(() => {
        googleLogout();
        setUser(null);
        setAccessToken(null);
        localStorage.removeItem('googleTokens');
    }, []);

    async function validateToken(token) {
        try {
            const res = await fetch(
                'https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=' + token
            );
            return res.ok;
        } catch {
            return false;
        }
    }

    useEffect(() => {
        const doRefresh = async () => {
            const newToken = await refreshAccessTokenIfNeeded();
            if (newToken) setAccessToken(newToken);
        };

        doRefresh();                            // once immediately
        const interval = setInterval(doRefresh, 30 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const refresh = async () => {
        const token = await refreshAccessTokenIfNeeded();
        if (token) setAccessToken(token);
    };

    return { user, accessToken, login, logout, validateToken, refresh };
}