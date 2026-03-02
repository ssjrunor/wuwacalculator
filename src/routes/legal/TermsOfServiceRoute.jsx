import React from 'react';
import { useNavigate } from 'react-router-dom';
import useDarkMode from '@shared/hooks/useDarkMode.js';
import { RouteLayout } from '@routes/shared/RouteChrome.jsx';
import { useResponsiveSidebar } from '@routes/shared/useResponsiveSidebar.js';
import { LegalSidebar } from '@routes/shared/SidebarNavPresets.jsx';

export default function TermsOfServiceRoute() {
    const navigate = useNavigate();
    const { theme, setTheme, isDark } = useDarkMode();
    const {
        hamburgerOpen,
        setHamburgerOpen,
        isMobile,
        isOverlayVisible,
        isOverlayClosing,
    } = useResponsiveSidebar();

    const toggleTheme = () => {
        const nextTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(nextTheme);
    };

    return (
        <RouteLayout
            isDark={isDark}
            hamburgerOpen={hamburgerOpen}
            setHamburgerOpen={setHamburgerOpen}
            isMobile={isMobile}
            isOverlayVisible={isOverlayVisible}
            isOverlayClosing={isOverlayClosing}
            sidebar={<LegalSidebar navigate={navigate} theme={theme} isDark={isDark} onToggleTheme={toggleTheme} />}
        >
            <div
                className="main-content info-page"
                style={{
                    padding: '2rem',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <header
                    className="legal-header"
                    style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', maxWidth: '100ch' }}
                >
                    <h1>Terms of Service</h1>
                    <button className="character-overview-close" onClick={() => navigate(-1)}>
                        ← Back
                    </button>
                </header>
                <div className="info-section" style={{ marginBottom: '2rem' }}>
                    <p>
                        <strong>Effective Date:</strong> 13 October 2025
                    </p>

                    <h2>1. Purpose</h2>
                    <p>
                        This app is a <strong>free, fan-made tool</strong> designed to help players of{' '}
                        <em>Wuthering Waves</em> plan and simulate character builds, stats, and team compositions.
                    </p>

                    <h2>2. Usage Guidelines</h2>
                    <p>You agree to:</p>
                    <ul>
                        <li>Use the app only for personal and non-commercial purposes</li>
                        <li>Not attempt to abuse, reverse-engineer, or exploit the app or its features</li>
                        <li>Use your own Google account responsibly if Drive sync is enabled</li>
                    </ul>

                    <h2>3. No Warranty</h2>
                    <p>
                        This tool is provided <strong>"as is"</strong> without any guarantees of accuracy,
                        reliability, or availability. Use it at your own discretion.
                    </p>

                    <h2>4. Data Responsibility</h2>
                    <ul>
                        <li>
                            You are responsible for any data stored in your browser or synced to your own Google
                            Drive.
                        </li>
                        <li>
                            We do not store or access your personal data beyond what is technically required for sync
                            and functionality.
                        </li>
                        <li>
                            Anonymous analytics (e.g., page views) may be collected through Google Analytics to improve
                            usability. No personally identifiable information is stored or shared.
                        </li>
                    </ul>

                    <h2>5. Disclaimer</h2>
                    <p>
                        This is an unofficial, fan-made app. We are not affiliated with Kuro Games or the developers of
                        <em> Wuthering Waves</em>.
                    </p>

                    <h2>6. Changes</h2>
                    <p>
                        These terms may be updated occasionally to reflect new features or legal requirements. Continued
                        use after updates implies acceptance of the revised terms.
                    </p>

                    <p style={{ marginTop: '2rem' }}>
                        <em>Last updated: 13 October 2025</em>
                    </p>
                </div>
            </div>
        </RouteLayout>
    );
}
