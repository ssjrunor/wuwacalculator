import React from 'react';
import AppRouter from '@app/AppRouter.jsx';
import RootShell from '@app/RootShell.jsx';
import { useSEO } from '@shared/hooks/useSEO.js';
import { useRootBootstrap } from '@app/hooks/useRootBootstrap.js';
import { usePageTracking } from '@app/hooks/usePageTracking.js';
import { usePreferredFont } from '@app/hooks/usePreferredFont.js';
import useDarkMode from '@shared/hooks/useDarkMode.js';

export default function AppRoot() {
    const themeControl = useDarkMode();
    const { showCookieNotice, dismissCookieNotice } = useRootBootstrap();

    usePageTracking();
    useSEO();
    usePreferredFont();

    return (
        <RootShell showCookieNotice={showCookieNotice} onCloseCookieNotice={dismissCookieNotice}>
            <AppRouter themeControl={themeControl} />
        </RootShell>
    );
}
