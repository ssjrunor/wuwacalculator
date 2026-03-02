import React, { Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { buildRootRoutes } from '@app/router/routeTable.jsx';
import { lazy } from 'react';

const NotFoundRoute = lazy(() => import('@routes/system/NotFoundRoute.jsx'));

export default function AppRouter({ themeControl }) {
    const routes = buildRootRoutes(themeControl);

    return (
        <Suspense fallback={null}>
            <Routes>
                {routes.map((route) => (
                    <Route key={route.path} path={route.path} element={route.element} />
                ))}
                <Route path="*" element={<NotFoundRoute />} />
            </Routes>
        </Suspense>
    );
}
