import React from 'react';
import { useNavigate } from 'react-router-dom';
import useDarkMode from '@shared/hooks/useDarkMode.js';
import { changelogEntries } from '@/features/changelog/model/changelogEntries.js';
import { RouteLayout } from '@routes/shared/RouteChrome.jsx';
import { useResponsiveSidebar } from '@routes/shared/useResponsiveSidebar.js';
import { InfoHubSidebar } from '@routes/shared/SidebarNavPresets.jsx';

export default function ChangelogRoute() {
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
                    current="changelog"
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
                <h1 className="changelog-title">Changelog</h1>
                <div className="changelog-entries">
                    {[...changelogEntries].reverse().map((log, index) => (
                        <div key={index} className="info-section changelog">
                            <h3 className="changelog-date">{log.date}</h3>
                            {log.shortDesc && (
                                <span className="highlight" dangerouslySetInnerHTML={{ __html: log.shortDesc }} />
                            )}
                            <ul>
                                {log.entries.map((entry, entryIndex) => (
                                    <li key={entryIndex}>
                                        {entry.type === 'paragraph' ? (
                                            <p dangerouslySetInnerHTML={{ __html: entry.content }} />
                                        ) : null}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </RouteLayout>
    );
}
