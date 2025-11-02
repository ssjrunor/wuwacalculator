import React, {useEffect, useState} from 'react';
import {useNavigate} from "react-router-dom";
import useDarkMode from "../hooks/useDarkMode.js";
import {HelpCircle, History, Info, Moon, Settings, Sparkle, Sun} from "lucide-react";
import {guides} from "../data/guides.js";
import { useLocation } from 'react-router-dom';

export default function GuidesPage() {
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

    const [openSections, setOpenSections] = useState({});
    const toggleSection = (category, forceOpen = null) => {
        setOpenSections(prev => {
            const isOpen = prev[category];
            return {
                ...prev,
                [category]: forceOpen !== null ? forceOpen : !isOpen,
            };
        });
    };
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const queryCategory = params.get('category');
        const hashCategory = location.hash?.replace('#', '');
        const category = queryCategory || hashCategory;
        if (!category) return;

        const tryScroll = (attempts = 0) => {
            const section = document.querySelector(`[data-category="${category}"]`);
            if (section) {
                section.scrollIntoView({ behavior: 'smooth', block: 'start' });

                setTimeout(() => {
                    toggleSection(category, true);
                }, 400);

                const url = new URL(window.location);
                url.searchParams.delete('category');
                window.history.replaceState({}, '', url);
            } else if (attempts < 10) {
                setTimeout(() => tryScroll(attempts + 1), 100);
            }
        };

        tryScroll();
    }, [location]);

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
                                <HelpCircle size={24} className="help-icon" stroke="currentColor" />
                            </div>
                            <div className="label-slot">
                                <span className="label-text">Guides</span>
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
                            <button className="sidebar-sub-button" onClick={() => navigate('/info')}>
                                <div className="icon-slot">
                                    <Info size={24} />
                                </div>
                                <div className="label-slot">
                                    <span className="label-text">Info</span>
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
                     }}>
                    <header className="legal-header"
                            style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', maxWidth: '100ch' }}
                    >
                        <h1>Guides</h1>
                    </header>
                    {guides.map((section, idx) => {
                        const isOpen = !!openSections[section.category];
                        const contentRef = React.useRef(null);
                        const [height, setHeight] = React.useState('0px');

                        React.useEffect(() => {
                            if (isOpen && contentRef.current) {
                                setHeight(`${contentRef.current.scrollHeight}px`);
                            } else {
                                setHeight('0px');
                            }
                        }, [isOpen]);

                        return (
                            <div
                                key={idx}
                                className="info-section echo-buff guides"
                                data-category={section.category}
                                style={{ marginBottom: '2rem' }}
                                onClick={() => toggleSection(section.category)}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <h2 className="section-title">{section.category}</h2>
                                    <button
                                        className="toggle-effect-button guides"
                                        style={{ margin: 'unset' }}
                                    >
                                        {isOpen ? 'Read Less' : 'Read More'}
                                    </button>
                                </div>

                                {section.guides.map((guide, i) => (
                                    <div key={i} className="guide-entry">
                                        <h3 className="guide-title" style={{ margin: 'unset' }}>{guide.title}</h3>
                                        <p className="guide-short" style={{ marginBottom: '1rem' }}>{guide.shortDesc}</p>

                                        <div
                                            className="main-echo-description-wrapper guides"
                                            style={{
                                                maxHeight: height,
                                                transition: 'max-height 0.4s ease, opacity 0.4s ease',
                                                opacity: isOpen ? 1 : 0,
                                            }}
                                        >
                                            <div
                                                ref={contentRef}
                                                className="main-echo-description guides"
                                                onClick={(e) => e.stopPropagation()}
                                                dangerouslySetInnerHTML={{
                                                    __html: guide.content.replace(
                                                        /<strong>(.*?)<\/strong>/g,
                                                        '<span class="highlight">$1</span>'
                                                    ),
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}