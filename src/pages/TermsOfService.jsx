import React, {useEffect, useState} from 'react';
import {useNavigate} from "react-router-dom";
import useDarkMode from "../hooks/useDarkMode.js";
import {HelpCircle, History, Info, Moon, Settings, Sparkle, Sun} from "lucide-react";

export default function TermsOfService() {
    const navigate = useNavigate();
    const {
        theme,
        setTheme,
        effectiveTheme,
    } = useDarkMode();
    const [hamburgerOpen, setHamburgerOpen] = useState(false);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    };

    const [isMobile, setIsMobile] = useState(window.innerWidth < 700);
    const [isOverlayVisible, setIsOverlayVisible] = useState(false);
    const [isOverlayClosing, setIsOverlayClosing] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 1070);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (isMobile) {
            setHamburgerOpen(false);
        }
    }, [isMobile]);

    useEffect(() => {
        if (hamburgerOpen) {
            setIsOverlayVisible(true);
        } else {
            setIsOverlayClosing(true);
            setTimeout(() => {
                setIsOverlayVisible(false);
                setIsOverlayClosing(false);
            }, 400);
        }
    }, [hamburgerOpen]);
    return (
        <div className="layout">
            <div className="toolbar">
                <div className="toolbar-group">
                    <button
                        className={`hamburger-button ${hamburgerOpen ? 'open' : ''}`}
                        onClick={() => setHamburgerOpen(prev => !prev)}
                    >
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>
                    <h4 className="toolbar-title">
                        Wuthering Waves Damage Calculator & Optimizer
                    </h4>
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
                    <div className="sidebar-content">
                        <button className="sidebar-button" onClick={() => navigate('/')}>
                            <div className="icon-slot">
                                <Sparkle size={24} />
                            </div>
                            <div className="label-slot">
                                <span className="label-text">Home</span>
                            </div>
                        </button>
                        <button className="sidebar-button" onClick={() => navigate('/settings')}>
                            <div className="icon-slot">
                                <Settings size={24} className="settings-icon" stroke="currentColor" />
                            </div>
                            <div className="label-slot">
                                <span className="label-text">Settings</span>
                            </div>
                        </button>
                        <button className="sidebar-button" onClick={() => navigate('/info')}>
                            <div className="icon-slot">
                                <Info size={24} />
                            </div>
                            <div className="label-slot">
                                <span className="label-text">Info</span>
                            </div>
                        </button>
                        <button className="sidebar-sub-button" onClick={() => navigate('/guides')}>
                            <div className="icon-slot">
                                <HelpCircle size={24} className="help-icon" stroke="currentColor" />
                            </div>
                            <div className="label-slot">
                                <span className="label-text">Guides</span>
                            </div>
                        </button>
                        <button className="sidebar-sub-button" onClick={() => navigate('/changelog')}>
                            <div className="icon-slot">
                                <History size={24} stroke="currentColor" />
                            </div>
                            <div className="label-slot">
                                <span className="label-text">Changelog</span>
                            </div>
                        </button>
                        <button className="sidebar-button" onClick={toggleTheme}>
                            <div className="icon-slot">
                                <div className="icon-slot theme-toggle-icon">
                                    <Sun className="icon-sun" size={24} />
                                    <Moon className="icon-moon" size={24} />
                                </div>
                            </div>
                            <div className="label-slot">
                                    <span className="label-text">
                                        {effectiveTheme === 'light' ? 'Dawn' : 'Dusk'}
                                    </span>
                            </div>
                        </button>
                    </div>
                    <div className="sidebar-footer">
                    </div>
                </div>

                {isOverlayVisible && isMobile && (
                    <div
                        className={`mobile-overlay ${hamburgerOpen ? 'visible' : ''} ${isOverlayClosing ? 'closing' : ''}`}
                        onClick={() => setHamburgerOpen(false)}
                    />
                )}

                <div className="main-content info-page"
                     style={{
                         padding: '2rem',
                         display: 'flex',
                         flexDirection: 'column',
                     }}>
                    <header className="legal-header"
                            style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', maxWidth: '100ch' }}
                    >
                        <h1>Terms of Service</h1>
                        <button className="character-overview-close" onClick={() => navigate(-1)}>← Back</button>
                    </header>
                    <div className="info-section"
                         style={{marginBottom: '2rem'}}
                    >
                        <p><strong>Effective Date:</strong> 13 October 2025</p>

                        <h2>1. Purpose</h2>
                        <p>This app is a <strong>free, fan-made tool</strong> designed to help players of <em>Wuthering Waves</em> plan and simulate character builds, stats, and team compositions.</p>

                        <h2>2. Usage Guidelines</h2>
                        <p>You agree to:</p>
                        <ul>
                            <li>Use the app only for personal and non-commercial purposes</li>
                            <li>Not attempt to abuse, reverse-engineer, or exploit the app or its features</li>
                            <li>Use your own Google account responsibly if Drive sync is enabled</li>
                        </ul>

                        <h2>3. No Warranty</h2>
                        <p>This tool is provided <strong>"as is"</strong> without any guarantees of accuracy, reliability, or availability. Use it at your own discretion.</p>

                        <h2>4. Data Responsibility</h2>
                        <ul>
                            <li>You are responsible for any data stored in your browser or synced to your own Google Drive.</li>
                            <li>We do not store or access your personal data beyond what is technically required for sync and functionality.</li>
                            <li>Anonymous analytics (e.g., page views) may be collected through Google Analytics to improve usability. No personally identifiable information is stored or shared.</li>
                        </ul>

                        <h2>5. Disclaimer</h2>
                        <p>This is an unofficial, fan-made app. We are not affiliated with Kuro Games or the developers of <em>Wuthering Waves</em>.</p>

                        <h2>6. Changes</h2>
                        <p>These terms may be updated occasionally to reflect new features or legal requirements. Continued use after updates implies acceptance of the revised terms.</p>

                        <p style={{ marginTop: '2rem' }}><em>Last updated: 13 October 2025</em></p>
                    </div>
                </div>
            </div>
        </div>
    );
}