import React, {useEffect, useState} from "react";
import { Link } from 'react-router-dom';
import { useNavigate } from "react-router-dom";
import {Sun, Moon, Sparkle, Info, Settings, History} from "lucide-react";
import useDarkMode from "../hooks/useDarkMode";

export default function InfoPage() {
    const navigate = useNavigate();
    const { theme, setTheme, effectiveTheme } = useDarkMode();
    const [hamburgerOpen, setHamburgerOpen] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

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
                        <button
                            className={`sidebar-button ${showDropdown ? 'active' : ''}`}
                            onClick={() => setShowDropdown(prev => !prev)}
                        >
                            <div className="icon-slot">
                                <Info size={24} />
                            </div>
                            <div className="label-slot">
                                <span className="label-text">Info</span>
                            </div>
                        </button>
                        <div className={`sidebar-dropdown ${showDropdown ? 'open' : ''}`}>
                            <button className="sidebar-sub-button" onClick={() => navigate('/')}>
                                <div className="icon-slot">
                                    <Sparkle size={24} />
                                </div>
                                <div className="label-slot">
                                    <span className="label-text">Home</span>
                                </div>
                            </button>
                            {/*
                                <button className="sidebar-sub-button">
                                    <div className="icon-slot">
                                        <HelpCircle size={24} className="help-icon" stroke="currentColor" />
                                    </div>
                                    <div className="label-slot">
                                        <span className="label-text">Help</span>
                                    </div>
                                </button>
                                */}
                            <button className="sidebar-sub-button" onClick={() => navigate('/settings')}>
                                <div className="icon-slot">
                                    <Settings size={24} className="settings-icon" stroke="currentColor" />
                                </div>
                                <div className="label-slot">
                                    <span className="label-text">Settings</span>
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
                        </div>
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
                         justifyContent: 'space-between',
                         maxHeight: '100dvh',
                         overflowY: 'hidden',
                    }}>
                    <div style={{ overflowY: 'auto' }}>
                        <div className="info-section">
                            <h1>Hi!</h1>
                            <p>First off, i made this solely because i was bored and wanted to try out programming with javascript.
                                I was initially working with spreadsheets but later found out how easy it was to like make something
                                so i was like "why not?" and yeah.
                                It's still a work in progress, i will stay avoiding grass for as long as i can to push out more stuff
                                to make it functional.
                            </p>
                        </div>

                        <div className="info-section">
                            <h3>...SO</h3>
                            <p>Most assets and character data are sourced from <a href="https://ww.hakush.in/" target="_blank" rel="noopener noreferrer">hakush.in</a>, <a href="https://encore.moe/?lang=en/" target="_blank" rel="noopener noreferrer">encore.moe</a> and the internet.</p>
                            <p>The formulas for calculating damage were gotten from <a href="https://wutheringwaves.fandom.com/wiki/Damage" target="_blank" rel="noopener noreferrer">Wuthering Waves Wiki</a>.</p>
                        </div>

                        <div className="info-section">
                            <h3>How to contact MOI?</h3>
                            <p>Join the <a href="https://discord.gg/wNaauhE4uH" target="_blank" rel="noopener noreferrer">discord</a> bro.</p>
                        </div>
                    </div>
                    <div className="legal">
                        <hr style={{ margin: '1rem 0', opacity: '0.1' }} />
                        <div className="legal-links">
                            <Link className="links" to="/privacy" >Privacy Policy</Link>
                            <Link className="links" to="/terms">Terms of Service</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
