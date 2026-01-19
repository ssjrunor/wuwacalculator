import React, {useEffect, useState} from "react";
import { Link } from 'react-router-dom';
import { useNavigate } from "react-router-dom";
import {Sun, Moon, Sparkle, Info as InfoIcon, Settings, History, HelpCircle} from "lucide-react";
import useDarkMode from "../hooks/useDarkMode";

export default function Info() {
    const navigate = useNavigate();
    const {
        theme,
        setTheme,
        effectiveTheme,
        isDark
    } = useDarkMode();
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
        <div className={`layout ${isDark ? 'dark-text' : 'light-text'} `}>
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
                                <InfoIcon size={24} />
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
                            <button className="sidebar-sub-button" onClick={() => navigate('/settings')}>
                                <div className="icon-slot">
                                    <Settings size={24} className="settings-icon" stroke="currentColor" />
                                </div>
                                <div className="label-slot">
                                    <span className="label-text">Settings</span>
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
                        </div>
                        {theme !== "background" && (
                            <button className="sidebar-button" onClick={toggleTheme}>
                                <div className="icon-slot theme-toggle-icon">
                                    <Sun className="icon-sun" size={24} />
                                    <Moon className="icon-moon" size={24} />
                                </div>
                                <div className="label-slot">
                                    <span className="label-text">
                                        {!isDark ? 'Dawn' : 'Dusk'}
                                    </span>
                                </div>
                            </button>
                        )}
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
                            <h1>About this project</h1>
                            <p>
                                The Wuthering Waves Damage Calculator & Optimizer is a fan-made toolkit to plan builds, compare rotations, and explore how stats translate into real damage. It tracks live-patch character kits, echoes, weapons, and resonance chains, and pairs the calculator with an optimizer so you can see which substat rolls or echo sets move the needle the most.
                            </p>
                            <p>
                                Goals: stay current with balance changes, keep formulas transparent, and help the community answer "why did my damage change?" as quickly as possible.
                            </p>
                        </div>

                        <div className="info-section">
                            <h3>Data + formulas</h3>
                            <p>
                                Gameplay values are pulled from in-game inspections plus community-maintained sources like <a href="https://ww.hakush.in/" target="_blank" rel="noopener noreferrer">hakush.in</a> and <a href="https://encore.moe/?lang=en/" target="_blank" rel="noopener noreferrer">encore.moe</a>. Damage math follows the <a href="https://wutheringwaves.fandom.com/wiki/Damage" target="_blank" rel="noopener noreferrer">Wuthering Waves Wiki</a> model and ongoing community testing, with patch notes tracked in the changelog.
                            </p>
                        </div>

                        <div className="info-section">
                            <h3>Who builds it?</h3>
                            <p>Designed, coded, and maintained by <strong>ssjrunor</strong>. This is an unofficial fan project and not affiliated with Kuro Games.</p>
                        </div>

                        <div className="info-section">
                            <h3>Community credits</h3>
                            <p>
                                Huge thanks to everyone in the Discord for ideas, bug finds, and sharing information about damage calculations. Community feedback keeps the numbers honest and the features pointed at real problems.
                            </p>
                        </div>

                        <div className="info-section">
                            <h3>Need help or want to hang out?</h3>
                            <p>Join the <a href="https://discord.gg/wNaauhE4uH" target="_blank" rel="noopener noreferrer">discord</a> for support, feedback, or just to talk shop.</p>
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
                            <Link className="links" to="/privacy" >Privacy Policy</Link>
                            <Link className="links" to="/terms">Terms of Service</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
