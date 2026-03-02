import React from 'react';

export function RouteLayout({
    isDark,
    hamburgerOpen,
    setHamburgerOpen,
    isMobile,
    isOverlayVisible,
    isOverlayClosing,
    sidebar,
    sidebarFooter = null,
    children,
}) {
    return (
        <div className={`layout ${isDark ? 'dark-text' : 'light-text'}`}>
            <div className="toolbar">
                <div className="toolbar-group">
                    <button
                        type="button"
                        className={`hamburger-button ${hamburgerOpen ? 'open' : ''}`}
                        onClick={() => setHamburgerOpen((prev) => !prev)}
                        aria-label="Toggle sidebar"
                    >
                        <span />
                        <span />
                        <span />
                    </button>
                    <h4 className="toolbar-title">Wuthering Waves Damage Calculator & Optimizer</h4>
                </div>
            </div>

            <div className="horizontal-layout">
                <div
                    className={`sidebar ${
                        isMobile
                            ? hamburgerOpen ? 'open' : ''
                            : hamburgerOpen ? 'expanded' : 'collapsed'
                    }`}
                >
                    <div className="sidebar-content">{sidebar}</div>
                    {sidebarFooter ? <div className="sidebar-footer">{sidebarFooter}</div> : null}
                </div>

                {isOverlayVisible && isMobile && (
                    <div
                        className={`mobile-overlay ${hamburgerOpen ? 'visible' : ''} ${isOverlayClosing ? 'closing' : ''}`}
                        onClick={() => setHamburgerOpen(false)}
                    />
                )}

                {children}
            </div>
        </div>
    );
}
