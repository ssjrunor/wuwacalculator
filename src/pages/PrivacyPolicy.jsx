import React, {useEffect, useState} from 'react';
import {HelpCircle, History, Info, Moon, Settings, Sparkle, Sun} from "lucide-react";
import {useNavigate} from "react-router-dom";
import useDarkMode from "../hooks/useDarkMode.js";

export default function PrivacyPolicy() {
    const navigate = useNavigate();
    const { theme, setTheme, effectiveTheme } = useDarkMode();
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
            setIsMobile(window.innerWidth < 700);
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
                        <h1>Privacy Policy</h1>
                        <button className="character-overview-close" onClick={() => navigate(-1)}>← Back</button>
                    </header>
                    <div className="info-section"
                         style={{marginBottom: '2rem'}}
                    >
                        <p><strong>Effective Date:</strong> 10 July 2025</p>

                        <p>The Wuthering Waves Calculator is a fan-made tool designed to help users simulate and plan character builds. We value your privacy and aim to collect the minimum amount of personal information necessary to provide our services.</p>

                        <h2>1. Data We Collect</h2>
                        <ul>
                            <li><strong>Local Data Storage:</strong> Your calculator settings, team configurations, and preferences are stored locally in your browser using localStorage or similar methods. This data never leaves your device unless explicitly synced.</li>
                            <li><strong>Google Drive Sync (Optional):</strong> If you choose to connect your Google account, we access a private file in your <a href="https://developers.google.com/drive/api/guides/appdata" target="_blank" rel="noopener noreferrer">Google Drive AppData folder</a> to back up and restore your calculator data.</li>
                        </ul>

                        <p>We do <strong>not</strong> collect or store:</p>
                        <ul>
                            <li>Names, emails, or personal identifiers</li>
                            <li>IP addresses</li>
                            <li>Cookies or tracking data</li>
                        </ul>

                        <h2>2. How Your Data is Used</h2>
                        <p>We use your data to:</p>
                        <ul>
                            <li>Persist your preferences and character data between sessions</li>
                            <li>Enable cloud backup and restore using Google Drive (if opted-in)</li>
                        </ul>
                        <p>We <strong>never share</strong> your data with third parties.</p>

                        <h2>3. Data Security</h2>
                        <p>All synced data is stored in the hidden AppData folder of your own Google Drive account. Only you and the app (with your permission) can access it.</p>

                        <h2>4. Third-Party Services</h2>
                        <p>
                            We use <strong>Google OAuth</strong> for sign-in and AppData access. We request only the minimal required scope and do not access your main Drive files.
                        </p>
                        <p>
                            We use Google Analytics to understand general site usage, such as page visits and traffic sources. Google Analytics may set cookies or collect anonymized IP addresses. No personally identifiable information is shared.
                        </p>

                        <h2>5. Your Rights</h2>
                        <p>You may:</p>
                        <ul>
                            <li>Disconnect your Google account at any time</li>
                            <li>Delete all locally stored data via your browser</li>
                            <li>Remove the synced backup from your Google Drive AppData folder</li>
                        </ul>

                        <p>For any concerns, contact me via <a href="mailto:rewhro@icloud.com?subject=Regarding%20the%20Calculator">email</a></p>

                        <p style={{ marginTop: '2rem' }}><em>Last updated: 10 July 2025</em></p>
                    </div>
                </div>
            </div>
        </div>
    );
}