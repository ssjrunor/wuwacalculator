import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Calculator from './pages/calculator.jsx';
import InfoPage from './pages/infoPage';
import NotFound from './pages/NotFound';
import Setting from "./pages/settings.jsx";
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import CookieConsent, { getCookieConsentValue } from 'react-cookie-consent';
import {useSEO} from "./hooks/useSEO.js";
import Changelog from "./pages/changelog.jsx";
import GuidesPage from "./pages/guides.jsx";

const GA_ID = 'G-W502BDD62S';

export default function App() {
    usePageTracking();

    useEffect(() => {
        const consent = getCookieConsentValue('wwa_cookie_consent');
        if (consent === 'true' && typeof window.gtag === 'function') {
            window.gtag('config', GA_ID, { anonymize_ip: true });
        }
    }, []);

    const handleAccept = () => {
        if (typeof window.gtag === 'function') {
            console.log('[GA] Consent accepted — enabling tracking');
            window.gtag('config', GA_ID, { anonymize_ip: true });
        }
    };

    const handleReject = () => {
        document.cookie = "wwa_cookie_consent=false;path=/;max-age=" + 60 * 60 * 24 * 365;
        console.log('[GA] Consent rejected — tracking disabled');
    };

    useSEO();

    return (
        <>
            <Routes>
                <Route path="/" element={<Calculator />} />
                <Route path="/info" element={<InfoPage />} />
                <Route path="/settings" element={<Setting />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/changelog" element={<Changelog />} />
                <Route path="/guides" element={<GuidesPage />} />
                <Route path="*" element={<NotFound />} />
            </Routes>

            <CookieConsent
                cookieName="wwa_cookie_consent"
                location="bottom"
                buttonText="Accept"
                declineButtonText="Reject"
                enableDeclineButton
                onAccept={handleAccept}
                onDecline={handleReject}
                style={{ background: "#2B373B", opacity: 0.9 }}
                buttonStyle={{ color: "#fff", backgroundColor: "#20bfb9", fontSize: "13px" }}
                declineButtonStyle={{ color: "#fff", backgroundColor: "#777", fontSize: "13px", marginLeft: "1rem" }}
            >
                This site uses cookies to analyze traffic via Google Analytics. No personal information is shared.{" "}
                <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: "#fff", textDecoration: "underline" }}>
                    Learn more
                </a>.
            </CookieConsent>
        </>
    );
}

function usePageTracking() {
    const location = useLocation();

    useEffect(() => {
        const consent = getCookieConsentValue('wwa_cookie_consent');
        if (consent === 'true' && typeof window.gtag === 'function') {
            window.gtag('event', 'page_view', {
                page_path: location.pathname + location.search,
                page_location: window.location.href,
                page_title: document.title,
            });
        }
    }, [location]);
}