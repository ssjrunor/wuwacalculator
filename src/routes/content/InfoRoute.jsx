import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useDarkMode from '@shared/hooks/useDarkMode.js';
import { RouteLayout } from '@routes/shared/RouteChrome.jsx';
import { useResponsiveSidebar } from '@routes/shared/useResponsiveSidebar.js';
import { InfoHubSidebar } from '@routes/shared/SidebarNavPresets.jsx';

export default function InfoRoute() {
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
            sidebar={
                <InfoHubSidebar
                    current="info"
                    navigate={navigate}
                    theme={theme}
                    isDark={isDark}
                    onToggleTheme={toggleTheme}
                />
            }
        >
            <div
                className="main-content info-page"
                style={{
                    padding: '2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    maxHeight: '100dvh',
                    overflowY: 'hidden',
                }}
            >
                <div style={{ overflowY: 'auto' }}>
                    <div className="info-section">
                        <h1>About this project</h1>
                        <p>
                            The Wuthering Waves Damage Calculator & Optimizer is a fan-made toolkit to plan builds,
                            compare rotations, and explore how stats translate into real damage. It tracks live-patch
                            character kits, echoes, weapons, and resonance chains, and pairs the calculator with an
                            optimizer so you can see which substat rolls or echo sets move the needle the most.
                        </p>
                        <p>
                            Goals: stay current with balance changes, keep formulas transparent, and help the community
                            answer "why did my damage change?" as quickly as possible.
                        </p>
                    </div>

                    <div className="info-section">
                        <h3>Data + formulas</h3>
                        <p>
                            Gameplay values are pulled from in-game inspections plus community-maintained sources like{' '}
                            <a href="https://encore.moe/?lang=en/" target="_blank" rel="noopener noreferrer">
                                encore.moe
                            </a>
                            . Damage math follows the{' '}
                            <a
                                href="https://wutheringwaves.fandom.com/wiki/Damage"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Wuthering Waves Wiki
                            </a>{' '}
                            model and ongoing community testing, with patch notes tracked in the changelog.
                        </p>
                    </div>

                    <div className="info-section">
                        <h3>Who builds it?</h3>
                        <p>
                            Designed, coded, and maintained by <strong>ssjrunor</strong>. This is an unofficial fan
                            project and not affiliated with Kuro Games.
                        </p>
                    </div>

                    <div className="info-section">
                        <h3>Community credits</h3>
                        <p>
                            Huge thanks to everyone in the Discord for ideas, bug finds, and sharing information about
                            damage calculations. Community feedback keeps the numbers honest and the features pointed at
                            real problems.
                        </p>
                    </div>

                    <div className="info-section">
                        <h3>Need help or want to hang out?</h3>
                        <p>
                            Join the{' '}
                            <a href="https://discord.gg/wNaauhE4uH" target="_blank" rel="noopener noreferrer">
                                discord
                            </a>{' '}
                            for support, feedback, or just to talk shop.
                        </p>
                    </div>
                </div>

                <img
                    src="https://media.tenor.com/b67Xti8TUp8AAAAi/kakyoin-stand-anime.gif"
                    className="info-section-gif"
                    alt="Lost funny gif"
                />

                <div className="legal">
                    <hr style={{ margin: '1rem 0', opacity: '0.1' }} />
                    <div className="legal-links">
                        <Link className="links" to="/privacy">
                            Privacy Policy
                        </Link>
                        <Link className="links" to="/terms">
                            Terms of Service
                        </Link>
                    </div>
                </div>
            </div>
        </RouteLayout>
    );
}
