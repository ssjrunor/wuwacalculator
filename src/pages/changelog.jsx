import React, {useEffect, useRef, useState} from 'react';
import {Link, useNavigate} from "react-router-dom";
import useDarkMode from "../hooks/useDarkMode.js";
import {HelpCircle, History, Info, Moon, Settings, Sparkle, Sun} from "lucide-react";

export default function Changelog() {
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
                        <button
                            className={`sidebar-button ${showDropdown ? 'active' : ''}`}
                            onClick={() => setShowDropdown(prev => !prev)}
                        >
                            <div className="icon-slot">
                                <History size={24} stroke="currentColor" />
                            </div>
                            <div className="label-slot">
                                <span className="label-text">Changelog</span>
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
                            <button className="sidebar-sub-button" onClick={() => navigate('/guides')}>
                                <div className="icon-slot">
                                    <HelpCircle size={24} className="help-icon" stroke="currentColor" />
                                </div>
                                <div className="label-slot">
                                    <span className="label-text">Guides</span>
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
                    <h1 className="changelog-title">Changelog</h1>
                    <div className="changelog-entries">
                        {[...changelog].reverse().map((log, index) => (
                            <div key={index} className="info-section changelog">
                                <h3 className="changelog-date">{log.date}</h3>
                                {log.shortDesc && <span className="highlight" dangerouslySetInnerHTML={{ __html: log.shortDesc }} />}
                                <ul>
                                    {log.entries.map((entry, i) => (
                                        <li key={i}>
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
            </div>
        </div>
    );
}

export const changelog = [
    {
        date: '20/05/2025',
        entries: [
            {
                type: 'paragraph',
                content: `<strong>Sanhua</strong> is now fully functional.`
            }
        ]

    },
    {
        date: '21/05/2025',
        entries: [
            {
                type: 'paragraph',
                content: `<strong>Baizhi</strong> is now fully functional.`
            }
        ]

    },
    {
        date: '22/05/2025',
        entries: [
            {
                type: 'paragraph',
                content: `<strong>Lingyang</strong> is now fully functional.`
            },
            {
                type: 'paragraph',
                content: `<strong>Lupa</strong> is now fully functional.`
            }
        ]

    },
    {
        date: '23/05/2025',
        entries: [
            {
                type: 'paragraph',
                content: `<strong>Zhezhi</strong> is now fully functional.`
            },
            {
                type: 'paragraph',
                content: `<strong>Youhu</strong> is now fully functional.`
            },
            {
                type: 'paragraph',
                content: `<strong>Carlotta</strong> is now fully functional.`
            },
            {
                type: 'paragraph',
                content: `<strong>Cartethyia</strong> is now fully functional.`
            },
            {
                type: 'paragraph',
                content: `<strong>Chixia</strong> is now fully functional.`
            },
            {
                type: 'paragraph',
                content: `<strong>Encore</strong> is now fully functional.`
            },
            {
                type: 'paragraph',
                content: `<strong>Mortefi</strong> is now fully functional.`
            },
            {
                type: 'paragraph',
                content: `<strong>Changli</strong> is now fully functional.`
            }
        ]

    },
    {
        date: '24/05/2025',
        entries: [
            {
                type: 'paragraph',
                content: `<strong>Brant</strong> is now fully functional.`
            },
            {
                type: 'paragraph',
                content: `<strong>Calcharo</strong> is now fully functional.`
            }
        ]
    },
    {
        date: '25/05/2025',
        entries: [
            {
                type: 'paragraph',
                content: `<strong>Yinlin</strong> is now fully functional.`
            },
            {
                type: 'paragraph',
                content: `<strong>Yuanwu</strong> is now fully functional.`
            },
            {
                type: 'paragraph',
                content: `<strong>Jinhsi</strong> is now fully functional.`
            }
        ]
    },
    {
        date: '26/05/2025',
        entries: [
            {
                type: 'paragraph',
                content: `<strong>Xiangli Yao</strong> is now fully functional.`
            },
            {
                type: 'paragraph',
                content: `<strong>Zani</strong> is now fully functional.`
            }
        ]
    },
    {
        date: '27/05/2025',
        entries: [
            {
                type: 'paragraph',
                content: `<strong>YangYang</strong> is now fully functional.`
            },
            {
                type: 'paragraph',
                content: `<strong>Jiyan</strong> is now fully functional.`
            },
            {
                type: 'paragraph',
                content: `<strong>Jianxin</strong> is now fully functional.`
            },
            {
                type: 'paragraph',
                content: `<strong>Rover: Aero Husbando</strong> is now fully functional.`
            },
            {
                type: 'paragraph',
                content: `<strong>Rover: Aero Waifu</strong> is now fully functional.`
            },
            {
                type: 'paragraph',
                content: `<strong>Ciaccona</strong> is now fully functional.`
            },
            {
                type: 'paragraph',
                content: `<strong>Rover: Spectro Husbando</strong> is now fully functional.`
            },
            {
                type: 'paragraph',
                content: `<strong>Rover: Spectro Waifu</strong> is now fully functional.`
            },
            {
                type: 'paragraph',
                content: `<strong>Verina</strong> is now fully functional.`
            },
            {
                type: 'paragraph',
                content: `<strong>Lumi</strong> is now fully functional.`
            },
            {
                type: 'paragraph',
                content: `<strong>Memoke- S-Shorekeeper</strong> is now fully functional.`
            },
            {
                type: 'paragraph',
                content: `<strong>Taoqi</strong> is now fully functional.`
            },
            {
                type: 'paragraph',
                content: `<strong>Danjin</strong> is now fully functional.`
            },
            {
                type: 'paragraph',
                content: `<strong>Camellya</strong> is now fully functional.`
            }
        ]
    },
    {
        date: '27/05/2025',
        entries: [
            {
                type: 'paragraph',
                content: `Added weapons (just base atk and main stats)`
            }
        ]
    },
    {
        date: '28/05/2025',
        entries: [
            {
                type: 'paragraph',
                content: `All 5 star weapons are now fully functional.`
            },
            {
                type: 'paragraph',
                content: `All other weapons are now fully functional.`
            }
        ]
    },
    {
        date: '29/05/2025',
        entries: [
            {
                type: 'paragraph',
                content: `Added echo buffs.`
            },
            {
                type: 'paragraph',
                content: `Added weapon buffs.`
            }
        ]
    },
    {
        date: '30/05/2025',
        entries: [
            {
                type: 'paragraph',
                content: `<strong>Rover: Havoc Waifu</strong> is now fully functional.`
            },
            {
                type: 'paragraph',
                content: `<strong>Rover: Havoc Husbando</strong> is now fully functional.`
            },
            {
                type: 'paragraph',
                content: `<strong>Roccia</strong> is now fully functional.`
            },
            {
                type: 'paragraph',
                content: `<strong>Cantarella</strong> is now fully functional.`
            },
            {
                type: 'paragraph',
                content: `Added character buffs.`
            }
        ]
    },
    {
        date: '30/05/2025',
        entries: [
            {
                type: 'paragraph',
                content: `Added rotations >.<.`
            }
        ]
    },
    {
        date: '06/06/2025',
        entries: [
            {
                type: 'paragraph',
                content: `Added ECHOES (WIP >.< (not anymore!)).`
            }
        ]
    },
    {
        date: '27/06/2025',
        entries: [
            {
                type: 'paragraph',
                content: `Added <strong>Phrolova</strong>.`
            },
            {
                type: 'paragraph',
                content: `Added <strong>Lethean Elegy</strong> rectifier.`
            },
            {
                type: 'paragraph',
                content: `Added <strong>Dream of the Lost</strong> set echoes.`
            }
        ]
    },
    {
        date: '07/08/2025',
        entries: [
            {
                type: 'paragraph',
                content: `Added <strong>Augusta</strong> and <strong>Iuno</strong>.`
            },
            {
                type: 'paragraph',
                content: `Added <strong>2.6</strong> beta content.`
            }
        ]
    },
    {
        date: '13/09/2025',
        entries: [
            {
                type: 'paragraph',
                content: `Added all <strong>2.7</strong> beta content excluding <strong>Galbrena</strong>.`
            },
            {
                type: 'paragraph',
                content: `<strong>Galbrena</strong> will be added later...`
            }
        ]
    },
    {
        date: '18/09/2025',
        entries: [
            {
                type: 'paragraph',
                content: `Added <strong>Galbrena</strong>.`,
            }
        ]
    },
    {
        date: '08/10/2025',
        entries: [
            {
                type: 'paragraph',
                content: `Added the new <strong>Guides Page</strong> with in-depth explanations for <em>Rotations</em>, <em>Team Buffs</em>, <em>Damage Calculations</em>, and <em>Echo Scoring</em>... and more stuff yeah...`,
            },
            {
                type: 'paragraph',
                content:
                    `
                        Guides can be accessed from the sidebar navigation or directly through in-app prompts.  
                        They’re divided into clear categories — such as <strong>Echoes</strong>, <strong>Rotations</strong>, <strong>Team Buffs</strong>, and <strong>Overview</strong> — each covering a specific part of the calculator.  
                        
                        You’ll often see small <em>“See Guide”</em> buttons or links throughout the app, appearing where you'd expect them to be.  
                        Clicking one of these instantly opens the relevant section or takes you to that category’s page in the <strong>Guides</strong> tab, letting you learn directly in context without hunting through menus.
                    `
            }
        ],
        shortDesc: `New <strong>Guides Page</strong> added~! Learn everything without leaving the app (〜^∇^)〜`
    },
    {
        date: '09/10/2025',
        entries: [
            {
                type: 'paragraph',
                content: `Added <strong>confirmation modals</strong> across key actions — including <em>Clear Rotation</em>, <em>Unequip All Echoes</em>, and <em>Delete</em> operations — to prevent accidental clicks and data loss.`,
            },
            {
                type: 'paragraph',
                content: `
                These confirmations appear before performing irreversible actions and let you review your choice before proceeding.  
                They follow the same styling as other popups, using the same smooth open/close animations and adaptive color scheme.  
                You can also cancel instantly without breaking your current workflow.  
                Basically: fewer "oops" moments, more peace of mind.
            `
            }
        ],
        shortDesc: `Added <strong>confirmation modals</strong>~! No more accidental oopsies (〜^∇^)〜`
    },
    {
        date: '10/10/2025',
        entries: [
            {
                type: 'paragraph',
                content: `
                Updated <strong>Galbrena’s Afterflame</strong> and <strong>Qiuyuan’s Inherent Skill: Quietude Within</strong> to correctly function as <em>Damage Taken</em> effects instead of <em>additive Damage Bonus</em>.  
                The English text originally described these as damage bonuses, but the Chinese text specified them as damage taken modifiers.  
                With <strong>Galbrena’s</strong> official release confirming the CN behavior, both effects have been adjusted to match the in-game mechanics — which also implies that <strong>Qiuyuan’s Inherent Skill: Quietude Within</strong> should follow the same rule.
                Apparently, <em>Kuro’s localization team</em> decided that “translation accuracy” was just another optional buff. (￣▽￣*)ゞ  
                `
            }
        ],
        shortDesc: `Updated <strong>Galbrena</strong> & <strong>Qiuyuan</strong>. Their effects now apply as <em>Damage Taken</em>`
    },
    {
        date: '13/10/2025',
        entries: [
            {
                type: 'paragraph',
                content: `
                Introduced the new <strong>Echo Presets</strong> system~!  
                Save, manage, and reapply full Echo loadouts across your characters with just one click.
            `
            },
            {
                type: 'paragraph',
                content: `
                Each preset remembers your exact Echo setup — including main stats, substats, and set bonuses.  
                You can now create build templates, compare setups, or instantly reapply your favorite configurations between characters.  
                Presets also sync automatically with your current equipped Echoes, showing when a saved build matches your runtime loadout.
            `
            },
            {
                type: 'paragraph',
                content: `
                A new <em>Echo Presets</em> category has also been added to the <strong>Guides Page</strong>, explaining how to use and manage them efficiently.  
            `
            }
        ],
        shortDesc: `New <strong>Echo Presets</strong> system~! (〜^∇^)〜`
    },
    {
        date: '13/10/2025',
        entries: [
            {
                type: 'paragraph',
                content: `
                Added full <strong>Font Customization</strong>~!  
                You can now personalize the calculator’s text style to match your vibe — clean, minimal, or classy.
            `
            },
            {
                type: 'paragraph',
                content: `
                Pick your favorite font and watch the entire interface update instantly — no reloads, no delay.  
                Your chosen font is saved locally and will persist across sessions, even after closing the browser.  
                All supported fonts are fully theme-aware for perfect readability in both light and dark modes.
            `
            }
        ],
        shortDesc: `Added <strong>Font Customization</strong>~! (〜^∇^)〜`
    },
    {
        date: '23/10/2025',
        entries: [
            {
                type: 'paragraph',
                content: `Added <strong>Buling</strong> and <strong>Chisa</strong>.`
            },
            {
                type: 'paragraph',
                content: `Added <strong>2.8</strong> beta content.`
            }
        ],
        shortDesc: `Added <strong>2.8</strong> beta content~! (〜^∇^)〜`
    },
    {
        date: '24/10/2025',
        entries: [
            {
                type: 'paragraph',
                content: `
            Instantly create randomized or optimized Echo builds for testing, theorycrafting, and stat benchmarking.
            The generator can simulate thousands of builds using adjustable parameters such as <em>bias</em>, <em>roll quality</em>, and <em>energy regen goals</em>.  
        `
            },
        ],
        shortDesc: `New <strong>Echo Generator</strong> system added~! (〜^∇^)〜`
    },
    {
        date: '28/10/2025',
        entries: [
            {
                type: 'paragraph',
                content: `
            You can now load in a premade rotation for most characters in the <strong>Rotation</strong> section. Only released characters for now...
        `
            },
        ],
        shortDesc: `Added <strong>Premade Rotations</strong>~! (〜^∇^)〜`
    },
];