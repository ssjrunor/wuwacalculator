import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@shared/styles';
// @ts-ignore
import AppRoot from '@app/AppRoot.jsx';
import { migrateAndCleanPersistentKeys } from '@shared/hooks/usePersistentState.js';
import RootProviders from '@app/providers/RootProviders.jsx';


migrateAndCleanPersistentKeys();

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <RootProviders>
            <AppRoot />
        </RootProviders>
    </StrictMode>
);
