import React, { lazy } from 'react';

const CalculatorRoute = lazy(() => import('@routes/calculator/CalculatorRoute.jsx'));
const ChangelogRoute = lazy(() => import('@routes/content/ChangelogRoute.jsx'));
const GuidesRoute = lazy(() => import('@routes/content/GuidesRoute.jsx'));
const InfoRoute = lazy(() => import('@routes/content/InfoRoute.jsx'));
const PrivacyPolicyRoute = lazy(() => import('@routes/legal/PrivacyPolicyRoute.jsx'));
const SettingsRoute = lazy(() => import('@routes/settings/SettingsRoute.jsx'));
const TermsOfServiceRoute = lazy(() => import('@routes/legal/TermsOfServiceRoute.jsx'));
const KarmitisCallbackRoute = lazy(() => import('@routes/auth/KarmitisCallbackRoute.jsx'));

export function buildRootRoutes(themeControl) {
    return [
        { path: '/', element: <CalculatorRoute {...themeControl} /> },
        { path: '/info', element: <InfoRoute /> },
        { path: '/settings', element: <SettingsRoute {...themeControl} /> },
        { path: '/auth/karmitis/callback', element: <KarmitisCallbackRoute /> },
        { path: '/privacy', element: <PrivacyPolicyRoute /> },
        { path: '/terms', element: <TermsOfServiceRoute /> },
        { path: '/changelog', element: <ChangelogRoute /> },
        { path: '/guides', element: <GuidesRoute /> },
    ];
}
