import React, {useEffect, useState} from "react";
import { useNavigate } from "react-router-dom";
import {Sun, Moon, Sparkle, Info, Settings, History, HelpCircle} from "lucide-react";
import useDarkMode from "../hooks/useDarkMode";
import {googleLogout, useGoogleLogin} from '@react-oauth/google';
import {getSyncData, restoreFromDrive, uploadToDrive} from "../utils/driveSync.js";
import NotificationToast from "../components/NotificationToast.jsx";
import ConfirmationModal from "../components/ConfirmationModal.jsx";
import ImportOverviewMini from "../components/ImportOverviewMini.jsx";
import {usePersistentState} from "../hooks/usePersistentState.js";
import {useGoogleAuth} from "../hooks/useGoogleAuth.js";

const FONT_LINKS = {
    Onest: 'https://fonts.googleapis.com/css2?family=Onest:wght@100..900&display=swap',
    Fredoka: 'https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600&display=swap',
    Quicksand: 'https://fonts.googleapis.com/css2?family=Quicksand:wght@400;600&display=swap',
    'Comic Neue': 'https://fonts.googleapis.com/css2?family=Comic+Neue:wght@400;700&display=swap',
    Caveat: 'https://fonts.googleapis.com/css2?family=Caveat:wght@400;600&display=swap',
};

export default function Setting() {
    const [showToast, setShowToast] = useState(false);
    const [popupMessage, setPopupMessage] = useState({
        icon: null,
        message: null,
        color: null
    });

    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmMessage, setConfirmMessage] = useState({
        title: null,
        message: null,
        confirmLabel: null,
        cancelLabel: null,
        onConfirm: () => {},
        onCancel: () => {}
    });

    const navigate = useNavigate();
    const { theme, setTheme, darkVariant, setDarkVariant, effectiveTheme } = useDarkMode();
    const [hamburgerOpen, setHamburgerOpen] = useState(false);
    const [importPreview, setImportPreview] = useState(null);
    const [showImportModal, setShowImportModal] = useState(false);
    const [importSuccess, setImportSuccess] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        const storedToken = localStorage.getItem('googleAccessToken');
        const storedUser = localStorage.getItem('googleUser');

        if (storedToken) setAccessToken(storedToken);
        if (storedUser) setUser(JSON.parse(storedUser));
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    };

    useEffect(() => {
        if (importSuccess) {
            const timeout = setTimeout(() => setImportSuccess(''), 5000);
            return () => clearTimeout(timeout);
        }
    }, [importSuccess]);

    const downloadCharacterState = () => {
        const runtime = JSON.parse(localStorage.getItem("characterRuntimeStates") || "{}");
        const id = JSON.parse(localStorage.getItem("activeCharacterId") || "null");

        if (!runtime[id]) {
            setPopupMessage({
                message: 'Oh... no cached character data found... (ㆆ ᴗ ㆆ)',
                icon: '✘',
                color: 'red'
            });
            setShowToast(true);
            return;
        }

        const dataToSave = { ...runtime[id] };

        if (Array.isArray(dataToSave.Team)) {
            dataToSave.Team = [null, dataToSave.Team[1] ?? null, dataToSave.Team[2] ?? null];
        }

        const blob = new Blob([JSON.stringify({ [id]: dataToSave }, null, 2)], {
            type: "application/json"
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${runtime[id].Name ?? "character"}-cache.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const importCharacterState = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const parsed = JSON.parse(e.target.result);
                const charId = Object.keys(parsed)[0];
                const data = parsed[charId];

                if (!charId || !data?.Id) throw new Error("Invalid format.");

                setImportPreview(data);
                setShowImportModal(true);
            } catch (err) {
                setPopupMessage({
                    message: 'This isn\'t a character file... what were you trying to do...? (╹ -╹)?',
                    icon: '✘',
                    color: 'red'
                });
                setShowToast(true);
            }
        };
        reader.readAsText(file);
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

    const { user, login, accessToken, logout, validateToken, refresh } = useGoogleAuth();

    async function handleBackup() {
        const token = await refresh();
        if (!token) return alert('Please reconnect Google Drive.');
        await uploadToDrive(token, getSyncData());
        alert('Backup uploaded!');
    }

    async function handleRestore() {
        const token = await refresh();
        if (!token) return alert('Please reconnect Google Drive.');
        await restoreFromDrive(token);
    }


    async function listAllDriveFiles(accessToken) {
        const res = await fetch(
            'https://www.googleapis.com/drive/v3/files?spaces=appDataFolder',
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        const data = await res.json();
        //console.log('Files in AppData folder:');
    }

    useEffect(() => {
        if (!accessToken) return;

        const listAllDriveFiles = async (accessToken) => {
            const res = await fetch(
                'https://www.googleapis.com/drive/v3/files?spaces=appDataFolder',
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );

            const data = await res.json();
            //console.log('Files in AppData folder:', data.files);
        };

        //listAllDriveFiles(accessToken);
    }, [accessToken]);

    const handleReset = () => {
        localStorage.clear();
        localStorage.setItem('enemyLevel', JSON.stringify(100));
        localStorage.setItem('enemyRes', JSON.stringify(20));
        localStorage.setItem('characterRuntimeStates', JSON.stringify({}));
        localStorage.setItem('sliderValues', JSON.stringify({
            normalAttack: 1,
            resonanceSkill: 1,
            forteCircuit: 1,
            resonanceLiberation: 1,
            introSkill: 1,
            sequence: 0
        }));
        localStorage.setItem('activeCharacterId', JSON.stringify(1506));
        window.location.href = '/';
    };

    const skillNameMap = {
        normalAttack: 'Normal Attack',
        forteCircuit: 'Forte Circuit',
        resonanceSkill: 'Resonance Skill',
        resonanceLiberation: 'Resonance Liberation',
        introSkill: 'Intro Skill',
        outroSkill: 'Outro Skill',
        sequence: 'Sequence',
    };

    const [selectedFont, setSelectedFont] = usePersistentState('userBodyFontName', 'System UI');
    const [fontLink, setFontLink] = usePersistentState('userBodyFontURL', `${FONT_LINKS[selectedFont]}`);
    const [fontChanged, setFontChanged] = useState(false);
    const [loadingFont, setLoadingFont] = useState(false);
    const [validLink, setValidLink] = useState(true);

    function getCurrentFontName() {
        const raw = getComputedStyle(document.documentElement)
            .getPropertyValue('--body-font')
            .trim();
        const primary = raw.split(',')[0].replace(/['"]/g, '').trim();

        const isSystemFont = raw.includes('-apple-system') ||
            raw.includes('Segoe UI') ||
            raw.includes('BlinkMacSystemFont') ||
            raw.includes('Roboto');

        if (isSystemFont) return 'System UI';

        return primary || 'Unknown';
    }

    const currentFont = getCurrentFontName();

    useEffect(() => {
        if (!selectedFont) return;
        const loadPreviewFont = async () => {
            try {
                setLoadingFont(true);

                if (selectedFont === 'System UI') {
                    setValidLink(true);
                    document.documentElement.style.setProperty(
                        '--preview-font',
                        `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif`
                    );
                    return;
                }

                if (fontLink && fontLink.includes('fonts.googleapis.com')) {
                    const isValid = /^https:\/\/fonts\.googleapis\.com\/css2\?family=/.test(fontLink);
                    setValidLink(isValid);

                    if (!isValid) {
                        document.documentElement.style.setProperty('--preview-font', `'${selectedFont}', sans-serif`);
                        return;
                    }

                    if (!document.querySelector(`link[href="${fontLink}"]`)) {
                        const linkEl = document.createElement('link');
                        linkEl.rel = 'stylesheet';
                        linkEl.href = fontLink;
                        document.head.appendChild(linkEl);
                        await new Promise((res) => setTimeout(res, 200));
                    }

                    const match = fontLink.match(/family=([^:&]+)/);
                    const extracted = match
                        ? decodeURIComponent(match[1]).replace(/\+/g, ' ')
                        : selectedFont;

                    setFontChanged(
                        extracted.toLowerCase().trim() !== currentFont.toLowerCase().trim()
                    );

                    setSelectedFont(extracted);
                    document.documentElement.style.setProperty('--preview-font', `'${selectedFont}', sans-serif`);
                } else {
                    setValidLink(false);
                    document.documentElement.style.setProperty('--preview-font', `'${selectedFont}', sans-serif`);
                }
            } catch (err) {
                console.warn('Preview font failed to load:', err);
                setValidLink(false);
            } finally {
                setLoadingFont(false);
            }
        };

        loadPreviewFont();
    }, [selectedFont, fontLink]);

    function updateFont() {
        if (selectedFont === 'System UI') {
            document.documentElement.style.setProperty(
                '--body-font',
                `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif`
            );
            document.documentElement.style.setProperty(
                '--preview-font',
                `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif`
            );

            setValidLink(true);
            setFontChanged(false);

            setPopupMessage({
                message: `Switched to ${selectedFont} successfully~! (〜^∇^)〜`,
                icon: '✔',
                color: { light: 'green', dark: 'limegreen' },
            });
            setShowToast(true);
            return;
        }

        if (fontLink && fontLink.includes('fonts.googleapis.com')) {
            const match = fontLink.match(/family=([^:&]+)/);
            const extracted = match
                ? decodeURIComponent(match[1]).replace(/\+/g, ' ')
                : selectedFont;

            if (!document.querySelector(`link[href="${fontLink}"]`)) {
                const linkEl = document.createElement('link');
                linkEl.rel = 'stylesheet';
                linkEl.href = fontLink;
                document.head.appendChild(linkEl);
            }

            document.documentElement.style.setProperty('--body-font', `'${extracted}', sans-serif`);
            setSelectedFont(extracted);
            setValidLink(true);
        }

        else {
            document.documentElement.style.setProperty('--body-font', `'${selectedFont}', sans-serif`);
            setValidLink(false);
        }

        setFontChanged(false);
        setPopupMessage({
            message: `Switched to ${selectedFont} successfully~! (〜^∇^)〜`,
            icon: '✔',
            color: { light: 'green', dark: 'limegreen' },
        });
        setShowToast(true);
    }

    const canPreview = validLink || !fontLink;

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
                                <Settings size={24} className="settings-icon" stroke="currentColor" />
                            </div>
                            <div className="label-slot">
                                <span className="label-text">Settings</span>
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

                <div className="main-content settings-page" style={{ padding: '2rem' }}>
                    <div className="settings-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <h1>Settings</h1>
                        <p
                            className={`dropzone-click-text go-to-guides`}
                            onClick={() =>navigate('/guides?category=App%20Controls')}
                        >
                            See guides
                        </p>
                    </div>

                    <div className="settings-body">
                        <div className="echo-buff">
                            <h2>Import/Export Data</h2>
                            <p style={{ marginBottom: '1rem' }}>
                                Export or import character build data to or from local storage.
                            </p>

                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                <button className="btn-primary" onClick={downloadCharacterState}>
                                    Export Character Data
                                </button>

                                <label htmlFor="import-character" className="btn-primary" style={{ cursor: 'pointer' }}>
                                    Import Character Data
                                </label>
                                <input
                                    type="file"
                                    id="import-character"
                                    accept="application/json"
                                    style={{ display: 'none' }}
                                    onChange={importCharacterState}
                                />
                            </div>
                            {importSuccess && (
                                <p style={{ color: 'limegreen', fontWeight: 'bold', marginTop: '1rem' }}>
                                    {importSuccess}
                                </p>
                            )}
                        </div>
                        <div className="echo-buff">
                            <h2>Delete All Data</h2>
                            <p style={{ marginBottom: '1rem' }}>
                                Reset all saved characters, weapons, and buffs. This action is irreversible.
                            </p>
                            <button
                                className="btn-primary clear rotation-button"
                                onClick={() => {
                                    setConfirmMessage({
                                        title: 'Delete All Data? ( ˵ •̀ □ •́ ˵ )',
                                        confirmLabel: 'Delete',
                                        message: 'This will completely delete all your data and set to default. This action cannot be undone...',
                                        onConfirm: handleReset,
                                    });
                                    setShowConfirm(true);
                                }}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                Delete
                            </button>
                        </div>

                        <div className="echo-buff">
                            <h2>Body Font</h2>
                            <p style={{ marginBottom: '1rem' }}>
                                Choose a Google Font for body text. You can paste a Google Fonts link to apply a custom typeface. ONLY EN fonts!!
                            </p>

                            <div className="settings-label" style={{ marginBottom: '0.75rem' }}>
                                <h4 className="main-stat-label" style={{ marginBottom: 'unset' }}>
                                    Default Body Font:
                                </h4>

                                <select
                                    id="font-select"
                                    className="main-stat-select"
                                    value={selectedFont}
                                    style={{ marginTop: '0.5rem' }}
                                    onChange={(e) => {
                                        const fontName = e.target.value;
                                        setSelectedFont(fontName);
                                        if (fontName === 'System UI') {
                                            setFontLink('');
                                        } else {
                                            const link = FONT_LINKS[fontName];
                                            if (link) setFontLink(link);
                                        }
                                        setFontChanged(true);
                                    }}
                                >
                                    {![
                                        'System UI',
                                        'Onest',
                                        'Fredoka',
                                        'Quicksand',
                                        'Comic Neue',
                                        'Caveat'
                                    ].includes(selectedFont) && (
                                        <option value={selectedFont}>{selectedFont}</option>
                                    )}
                                    <option value="System UI">System UI</option>
                                    <option value="Onest">Onest</option>
                                    <option value="Fredoka">Fredoka</option>
                                    <option value="Quicksand">Quicksand</option>
                                    <option value="Comic Neue">Comic Neue</option>
                                    <option value="Caveat">Caveat</option>
                                </select>
                            </div>

                            {/* Paste your own font link */}
                            <div className="settings-label">
                                <h4 style={{ marginBottom: 'unset' }}>Custom Font Link:</h4>
                                <input
                                    id="font-link"
                                    type="url"
                                    placeholder="https://fonts.googleapis.com/css2?family=Caveat"
                                    value={fontLink}
                                    className="entry-name-edit"
                                    style={{ width: '100%', marginTop: '0.5rem' }}
                                    onChange={(e) => {
                                        setFontLink(e.target.value);
                                        setFontChanged(true);
                                    }}
                                />
                            </div>

                            {selectedFont && (
                                <>
                                    <h4 style={{ marginBottom: 'unset' }}>Preview:</h4>

                                    <div
                                        style={{
                                            position: 'relative',
                                            marginTop: '0.5rem',
                                            padding: '0.6rem 0.9rem',
                                            borderRadius: '6px',
                                            border: '1px solid rgba(128,128,128,0.3)',
                                            backdropFilter: 'blur(4px)',
                                            background: 'rgba(255,255,255,0.05)',
                                            minHeight: '2.5rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        {loadingFont ? (
                                            <div className="font-loader" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div
                                                    style={{
                                                        width: '1rem',
                                                        height: '1rem',
                                                        border: '2px solid rgba(255,255,255,0.3)',
                                                        borderTop: '2px solid var(--slider-color, #00bcd4)',
                                                        borderRadius: '50%',
                                                        animation: 'spin 0.9s linear infinite',
                                                    }}
                                                />
                                                <span style={{ opacity: 0.8, fontSize: '0.9rem' }}>Loading font...</span>
                                            </div>
                                        ) : (
                                            <>
                                                {canPreview ? (
                                                    <h4
                                                        style={{
                                                            fontFamily: 'var(--preview-font)',
                                                            fontSize: '1.15rem',
                                                            margin: 0,
                                                            textShadow: '0 0 4px rgba(0,0,0,0.25)',
                                                            transition: 'all 0.2s ease',
                                                        }}
                                                    >
                                                        ₊✩‧₊˚౨ৎ˚₊✩‧₊ YOU (yes you) are amazinggg~! ₊✩‧₊˚౨ৎ˚₊✩‧₊
                                                    </h4>
                                                ) : (
                                                    <h4
                                                        style={{
                                                            fontFamily: 'var(--body-font)',
                                                            fontSize: '1.15rem',
                                                            margin: 0,
                                                            color: 'red',
                                                            textShadow: '0 0 4px rgba(0,0,0,0.25)',
                                                            transition: 'all 0.2s ease',
                                                        }}
                                                    >
                                                        not a font link dude/dudette~!
                                                    </h4>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </>
                            )}

                            <div className="settings-label" style={{ marginTop: '0.75rem' }}>
                                <a
                                    href="https://fonts.google.com/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                        fontSize: '0.95rem',
                                        fontWeight: 500,
                                        color: 'var(--slider-color, #00bcd4)',
                                        textDecoration: 'none',
                                        transition: 'color 0.2s ease',
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,0,50,0.81)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--slider-color, #00bcd4)')}
                                >
                                    Browse Google Fonts →
                                </a>
                                <p style={{ fontSize: '0.85rem', opacity: 0.7, marginTop: '0.25rem' }}>
                                    Copy the font’s link (the one that starts with
                                    <code style={{ margin: '0 4px', fontSize: '0.85rem' }}>https://fonts.googleapis.com/</code>)
                                    and paste it above.
                                </p>
                            </div>

                            {fontChanged && validLink && (
                                <button
                                    className="btn-primary echoes"
                                    style={{ marginLeft: 'auto', marginTop: '1rem' }}
                                    onClick={updateFont}
                                >
                                    Confirm Changes
                                </button>
                            )}
                        </div>

                        <div className="echo-buff">
                            <h2>Dark Mode Theme</h2>
                            <p style={{ marginBottom: '1rem' }}>
                                Choose your preferred dark mode theme. This only affects how the interface looks when dark mode is enabled.
                            </p>
                            <div className="settings-label">
                                <label htmlFor="main-stat-select" className="main-stat-label" style={{ marginRight: '1rem' }}>Default Dark theme:</label>
                                <select
                                    id="dark-variant"
                                    className="main-stat-select"
                                    style={{ marginTop: '0.5rem' }}
                                    value={darkVariant}
                                    onChange={(e) => {
                                        const newVariant = e.target.value;
                                        setDarkVariant(newVariant);
                                    }}
                                >
                                    <option value="dark">Midnight</option>
                                    <option value="dark-alt">Blackest</option>
                                </select>
                            </div>
                        </div>
                        <div className="echo-buff">
                            <h2>Google Drive Sync</h2>
                            <p style={{ marginBottom: '1rem' }}>
                                Your data is automatically synced between your device and a dedicated AppData folder in Google Drive. This website can't access any other files in your Google Drive.
                            </p>
                            {!user ? (
                                <button className="btn-primary" onClick={login}>
                                    Sign in
                                </button>
                            ) : (
                                <>
                                    <div style={{ display: 'flex', flexDirection: 'row', gap: '0.5rem' }}>
                                        <button className="btn-primary" onClick={logout}>
                                            Sign Out
                                        </button>
                                        {accessToken && (
                                            <>
                                                <button
                                                    className="btn-primary"
                                                    onClick={handleBackup}
                                                >
                                                    Backup
                                                </button>
                                                <button className="btn-primary" onClick={handleRestore}>
                                                    Restore
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showImportModal && (
                <div
                    className="skills-modal-overlay"
                    onClick={() => setShowImportModal(false)}
                >
                    <div
                        className="skills-modal-content settings-import changelog-modal guides"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2>Import Preview</h2>
                        <h3 style={{ margin: 'unset'}} >You’re about to import the following character:</h3>

                        <ImportOverviewMini importPreview={importPreview} />

                        <div className="modal-footer" style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                                className="edit-substat-button btn-primary echoes"
                                onClick={() => setShowImportModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="edit-substat-button btn-primary echoes"
                                onClick={() => {
                                    const charId =
                                        importPreview?.Id ??
                                        importPreview?.id ??
                                        importPreview?.link;
                                    const prev = JSON.parse(
                                        localStorage.getItem('characterRuntimeStates') ||
                                        '{}'
                                    );

                                    const newRuntimeStates = {
                                        ...prev,
                                        [charId]: importPreview,
                                    };

                                    localStorage.setItem(
                                        'characterRuntimeStates',
                                        JSON.stringify(newRuntimeStates)
                                    );
                                    localStorage.setItem(
                                        'activeCharacterId',
                                        JSON.stringify(charId)
                                    );

                                    localStorage.setItem(
                                        'team',
                                        JSON.stringify([
                                            charId,
                                            importPreview.Team?.[1] ?? null,
                                            importPreview.Team?.[2] ?? null,
                                        ])
                                    );

                                    const rotationEntriesRaw = JSON.parse(
                                        localStorage.getItem('rotationEntriesStore') || '{}'
                                    );
                                    const newRotationEntries = {
                                        ...rotationEntriesRaw,
                                        [charId]: importPreview.rotationEntries ?? [],
                                    };
                                    localStorage.setItem(
                                        'rotationEntriesStore',
                                        JSON.stringify(newRotationEntries)
                                    );
                                    setShowImportModal(false);
                                    window.location.href = '/';
                                }}
                            >
                                Confirm Import
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showToast && popupMessage.message && (
                <NotificationToast
                    message={popupMessage.message}
                    icon={popupMessage.icon}
                    color={popupMessage.color}
                    onClose={() => setShowToast(false)}
                    position={'top'}
                    bold={true}
                    duration={3000}
                />
            )}

            {showConfirm && (
                <ConfirmationModal
                    open={showConfirm}
                    title={confirmMessage.title}
                    message={confirmMessage.message}
                    confirmLabel={confirmMessage.confirmLabel}
                    onConfirm={confirmMessage.onConfirm}
                    onCancel={confirmMessage.onCancel}
                    onClose={() => setShowConfirm(false)}
                />
            )}
        </div>
    );
}