import React from 'react';
import { useNavigate } from 'react-router-dom';
import useDarkMode from '@shared/hooks/useDarkMode.js';
import { RouteLayout } from '@routes/shared/RouteChrome.jsx';
import { useResponsiveSidebar } from '@routes/shared/useResponsiveSidebar.js';
import { HomeSidebar } from '@routes/shared/SidebarNavPresets.jsx';

export default function NotFoundRoute() {
    const navigate = useNavigate();
    const { theme, setTheme, isDark } = useDarkMode();
    const {
        hamburgerOpen,
        setHamburgerOpen,
        isMobile,
        isOverlayVisible,
        isOverlayClosing,
    } = useResponsiveSidebar({ defaultWidth: 500 });

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
            sidebar={<HomeSidebar navigate={navigate} theme={theme} isDark={isDark} onToggleTheme={toggleTheme} />}
            sidebarFooter={
                <a
                    href="https://discord.gg/wNaauhE4uH"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sidebar-button discord"
                    title="Join our Discord"
                >
                    <div className="icon-slot">
                        <img
                            src="/assets/icons/discord.svg"
                            alt="Discord"
                            className="discord-icon"
                            style={{ maxWidth: '24px', maxHeight: '24px' }}
                        />
                    </div>
                    <div className="label-slot">
                        <span className="label-text">Discord</span>
                    </div>
                </a>
            }
        >
            <div style={{ padding: '2rem', width: '100%' }}>
                <h1>404 - Page Not Found</h1>
                <img
                    src="https://media1.tenor.com/m/6OJmN4DnIm0AAAAd/ericdoa-imagine-if-ninja-got-a-low-taper-fade.gif"
                    alt="Lost funny gif"
                    style={{ width: '500px', marginTop: '1rem', display: 'flex' }}
                />
            </div>
        </RouteLayout>
    );
}
