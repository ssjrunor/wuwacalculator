import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './styles';
// @ts-ignore
import App from './App.jsx';

const GOOGLE_CLIENT_ID = '309991415986-ln5kl1djdiqc7lnrvbp5nlcfnt4njpdi.apps.googleusercontent.com';

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </GoogleOAuthProvider>
    </StrictMode>
);