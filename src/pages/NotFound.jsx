import React, {useEffect, useState} from 'react';
import { useNavigate } from "react-router-dom";
import { Sun, Moon, History, Sparkle } from "lucide-react";
import useDarkMode from "../hooks/useDarkMode";

export default function NotFound() {
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

    const [isMobile, setIsMobile] = useState(window.innerWidth < 500);
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
                        <a
                            href="https://discord.gg/wNaauhE4uH"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="sidebar-button discord"
                            title="Join our Discord"
                        >
                            <div className="icon-slot">
                                <img src="/assets/icons/discord.svg" alt="Discord" className="discord-icon" style={{ maxWidth:'24px', maxHeight:'24px' }} />
                            </div>
                            <div className="label-slot">
                                <span className="label-text">
                                    Discord
                                </span>
                            </div>
                        </a>
                    </div>
                </div>

                {isOverlayVisible && isMobile && (
                    <div
                        className={`mobile-overlay ${hamburgerOpen ? 'visible' : ''} ${isOverlayClosing ? 'closing' : ''}`}
                        onClick={() => setHamburgerOpen(false)}
                    />
                )}

                <div style={{ padding: '2rem' }}>
                    <h1>404 - Page Not Found</h1>
                    <p>Woah there buddy... you got too much DIP on your chip</p>
                </div>
            </div>
        </div>
    );
}