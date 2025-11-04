import React, {useEffect, useState} from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Calculator from './pages/calculator.jsx';
import InfoPage from './pages/infoPage';
import NotFound from './pages/NotFound';
import Setting from "./pages/settings.jsx";
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import {useSEO} from "./hooks/useSEO.js";
import Changelog from "./pages/changelog.jsx";
import GuidesPage from "./pages/guidesPage.jsx";
import {getPersistentValue, setPersistentValue, usePersistentState} from "./hooks/usePersistentState.js";
import {refreshAccessTokenIfNeeded} from "./utils/googleAuth.js";
import {useGoogleAuth} from "./hooks/useGoogleAuth.js";
import useDarkMode from "./hooks/useDarkMode.js";
import PlainModal from "./components/PlainModal.jsx";
import DotArt, {art, DotArtGallery, TrollButtonsLayer} from "./constants/trolling.jsx";

const GA_ID = 'G-W502BDD62S';

export default function App() {
    const { user, accessToken } = useGoogleAuth();
    const themeControl = useDarkMode();
    const [showCookieNotice, setShowCookieNotice] = useState(false);

    usePageTracking();
    useSEO();

    useEffect(() => {
        const warmUpAuth = async () => {
            const newToken = await refreshAccessTokenIfNeeded();
        };
        warmUpAuth();
    }, []);

    useEffect(() => {
        if (typeof window.gtag === 'function') {
            window.gtag('config', GA_ID, { anonymize_ip: true });
        }
    }, []);

    useEffect(() => {
        document.cookie = "wwa_cookie_consent=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;";
    }, []);

    useEffect(() => {
        const dismissed = getPersistentValue('cookieNoticeDismissed');
        if (!dismissed) setShowCookieNotice(true);
    }, []);

    const [selectedFont] = usePersistentState('userBodyFontName', 'Onest');
    const [fontLink] = usePersistentState('userBodyFontURL', '');

    useEffect(() => {
        if (selectedFont === 'System UI') {
            document.documentElement.style.setProperty(
                '--body-font',
                `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif`
            );
            document.documentElement.style.setProperty(
                '--preview-font',
                `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif`
            );
            return;
        }

        if (fontLink && fontLink.includes('fonts.googleapis.com')) {
            if (!document.querySelector(`link[href="${fontLink}"]`)) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = fontLink;
                document.head.appendChild(link);
            }
        }

        if (selectedFont) {
            document.documentElement.style.setProperty('--body-font', `'${selectedFont}', sans-serif`);
            document.documentElement.style.setProperty('--preview-font', `'${selectedFont}', sans-serif`);
        } else {
            document.documentElement.style.setProperty('--body-font', "'Onest', sans-serif");
        }
    }, [selectedFont, fontLink]);

    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        try {
            const oldParent = JSON.parse(localStorage.getItem('__charInfo__') || '{}');
            if (oldParent.characterRuntimeStates) {
                console.info('[Migration] Moving characterRuntimeStates to __charStates__...');
                const newParent = JSON.parse(localStorage.getItem('__charStates__') || '{}');

                newParent.characterRuntimeStates = oldParent.characterRuntimeStates;
                localStorage.setItem('__charStates__', JSON.stringify(newParent));

                delete oldParent.characterRuntimeStates;
                localStorage.setItem('__charInfo__', JSON.stringify(oldParent));
            }
        } catch (err) {
            console.warn('[Migration] Failed:', err);
        }
    }, []);

    return (
        <>
            <Routes>
                <Route path="/" element={<Calculator {...themeControl}/>} />
                <Route path="/info" element={<InfoPage />} />
                <Route path="/settings" element={<Setting {...themeControl} />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/changelog" element={<Changelog />} />
                <Route path="/guides" element={<GuidesPage />} />
                <Route path="*" element={<NotFound />} />
            </Routes>

            <TrollButtonsLayer setModalOpen={setModalOpen} count={5} />

            <PlainModal modalOpen={modalOpen} setModalOpen={setModalOpen}>
                <DotArtGallery modalOpen={modalOpen} />
                <h3 style={{ margin: 'unset' }}>aLsO!!.</h3>
                <p style={{ margin: 'unset' }} >In case you were not aware, there's a discord server for this. <a href="https://discord.gg/wNaauhE4uH" target="_blank" rel="noopener noreferrer">Join~</a></p>
            </PlainModal>

            {showCookieNotice && (
                <CookieNotice onClose={() => setShowCookieNotice(false)} />
            )}
        </>
    );
}

export function CookieNotice({ onClose }) {
    const [closing, setClosing] = useState(false);

    const handleClose = () => {
        try {
            setPersistentValue('cookieNoticeDismissed', 'true');
        } catch (e) {
            console.warn('Failed to save cookie notice dismissal:', e);
        }
        setClosing(true);
        setTimeout(() => onClose?.(), 400);
    };

    return (
        <div className={`cookie-notice ${closing ? 'slide-out' : 'slide-in'}`} role="region" aria-label="Cookie notice">
          <span>
            This site uses cookies to analyze traffic via Google Analytics.
            No personal information is shared.{' '}
              <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
              >
              Learn more
            </a>.
          </span>

            <button
                className="cookie-close-btn"
                onClick={handleClose}
                aria-label="Close cookie notice"
            >
                Close
            </button>
        </div>
    );
}

function usePageTracking() {
    const location = useLocation();

    useEffect(() => {
        if (typeof window.gtag === 'function') {
            window.gtag('event', 'page_view', {
                page_path: location.pathname + location.search,
                page_location: window.location.href,
                page_title: document.title,
            });
        }
    }, [location]);
}
