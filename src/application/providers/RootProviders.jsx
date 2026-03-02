import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';

export default function RootProviders({ children }) {
    return (
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
            <BrowserRouter>{children}</BrowserRouter>
        </GoogleOAuthProvider>
    );
}
