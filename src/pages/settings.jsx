import React, {useEffect, useState} from "react";
import { useNavigate } from "react-router-dom";
import {Sun, Moon, Sparkle, Info, Settings, History, HelpCircle} from "lucide-react";
import useDarkMode from "../hooks/useDarkMode";
import ResetSettingsButton from '../components/ResetSettingsButton.jsx';
import {googleLogout, useGoogleLogin} from '@react-oauth/google';
import {getSyncData, restoreFromDrive, uploadToDrive} from "../utils/driveSync.js";
import NotificationToast from "../components/NotificationToast.jsx";

export default function Setting() {
    const [popupMessage, setPopupMessage] = useState({
        icon: null,
        message: null,
        color: null,
    });

    const [showToast, setShowToast] = useState(false);

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
                    message: 'Failed to import: ' + err.message + ' (ㆆ ᴗ ㆆ)',
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

    const [user, setUser] = useState(null);
    const [accessToken, setAccessToken] = useState(null);

    const login = useGoogleLogin({
        scope: 'https://www.googleapis.com/auth/drive.appdata',
        flow: 'implicit',
        onSuccess: async (tokenResponse) => {
            const accessToken = tokenResponse.access_token;
            setAccessToken(accessToken);
            localStorage.setItem('googleAccessToken', accessToken);

            try {
                const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                });
                const userInfo = await res.json();
                setUser(userInfo);
                localStorage.setItem('googleUser', JSON.stringify(userInfo));
            } catch (err) {
                console.error("Failed to fetch user info", err);
            }
        },
        onError: () => alert('Google login failed'),
    });

    const handleLogout = () => {
        googleLogout();
        setUser(null);
        setAccessToken(null);
        localStorage.removeItem('googleAccessToken');
        localStorage.removeItem('googleUser');
    };

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
                    <div className="settings-header">
                        <h1>Settings</h1>
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
                            <ResetSettingsButton />
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
                            {!accessToken ? (
                                <button className="btn-primary" onClick={login}>
                                    Sign in
                                </button>
                            ) : (
                                <>
                                    <div style={{ display: 'flex', flexDirection: 'row', gap: '0.5rem' }}>
                                        <button className="btn-primary" onClick={handleLogout}>
                                            Sign Out
                                        </button>
                                        <button
                                            className="btn-primary"
                                            onClick={async () => {
                                                const data = getSyncData();
                                                try {
                                                    await uploadToDrive(accessToken, data);
                                                    setPopupMessage({
                                                        message: 'Backup to Google Drive successful~! (〜^∇^)〜',
                                                        icon: '✔',
                                                        color: { light: 'green', dark: 'limegreen' },
                                                    });
                                                    setShowToast(true);
                                                } catch (err) {
                                                    setPopupMessage({
                                                        message: 'Drive sync failed... (ㆆ ᴗ ㆆ)',
                                                        icon: '✘',
                                                        color: 'red'
                                                    });
                                                    setShowToast(true);
                                                }
                                            }}
                                        >
                                            Backup
                                        </button>
                                        <button className="btn-primary" onClick={() => restoreFromDrive(accessToken)}>
                                            Restore
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showImportModal && (
                <div className="skills-modal-overlay" onClick={() => setShowImportModal(false)}>
                    <div className="skills-modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Import Preview</h2>
                        <p>You’re about to import the following character:</p>
                        <ul>
                            <li><strong>Name:</strong> {importPreview?.Name ?? 'Unknown'}</li>
                            <li><strong>Level:</strong> {importPreview?.CharacterLevel}</li>
                            {/*
                            <li>
                                <strong>Skill Levels:</strong>{' '}
                                {Object.entries(importPreview?.SkillLevels ?? {}).map(
                                    ([k, v]) => `${k}: ${v}`
                                ).join(', ')}
                            </li>
                            */}
                        </ul>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                            <button className="btn-primary" onClick={() => setShowImportModal(false)}>
                                Cancel
                            </button>
                            <button
                                className="btn-primary"
                                onClick={() => {
                                    const charId = importPreview?.Id ?? importPreview?.id ?? importPreview?.link;
                                    const prev = JSON.parse(localStorage.getItem("characterRuntimeStates") || "{}");

                                    const newRuntimeStates = {
                                        ...prev,
                                        [charId]: importPreview
                                    };

                                    localStorage.setItem("characterRuntimeStates", JSON.stringify(newRuntimeStates));
                                    localStorage.setItem("activeCharacterId", JSON.stringify(charId));

                                    localStorage.setItem("team", JSON.stringify([
                                        charId,
                                        importPreview.Team?.[1] ?? null,
                                        importPreview.Team?.[2] ?? null
                                    ]));

                                    const rotationEntriesRaw = JSON.parse(localStorage.getItem("rotationEntriesStore") || "{}");
                                    const newRotationEntries = {
                                        ...rotationEntriesRaw,
                                        [charId]: importPreview.rotationEntries ?? []
                                    };
                                    localStorage.setItem("rotationEntriesStore", JSON.stringify(newRotationEntries));
                                    setShowImportModal(false);
                                    window.location.href = "/";
                                    //setImportSuccess(`Imported: ${importPreview?.Name} successfully.`);
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
        </div>
    );
}