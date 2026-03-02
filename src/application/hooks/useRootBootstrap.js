import { useCallback, useEffect, useState } from 'react';
import { getPersistentValue } from '@shared/hooks/usePersistentState.js';
import { refreshAccessTokenIfNeeded } from '@shared/utils/googleAuth.js';

const GA_ID = 'G-W502BDD62S';

export function useRootBootstrap() {
    const [showCookieNotice, setShowCookieNotice] = useState(false);

    useEffect(() => {
        void refreshAccessTokenIfNeeded();
    }, []);

    useEffect(() => {
        if (typeof window.gtag === 'function') {
            window.gtag('config', GA_ID, { anonymize_ip: true });
        }
    }, []);

    useEffect(() => {
        document.cookie = 'wwa_cookie_consent=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;';
    }, []);

    useEffect(() => {
        const dismissed = getPersistentValue('cookieNoticeDismissed');
        if (!dismissed) {
            setShowCookieNotice(true);
        }
    }, []);

    const dismissCookieNotice = useCallback(() => {
        setShowCookieNotice(false);
    }, []);

    return {
        showCookieNotice,
        dismissCookieNotice,
    };
}
