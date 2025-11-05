import React, {useEffect, useRef, useState} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import {HelpCircle, History, Info, Moon, Settings, Sparkle, Sun} from "lucide-react";
import {getSyncData, restoreFromDrive, uploadToDrive} from "../utils/driveSync.js";
import NotificationToast from "../components/NotificationToast.jsx";
import ConfirmationModal from "../components/ConfirmationModal.jsx";
import ImportOverviewMini from "../components/ImportOverviewMini.jsx";
import {getPersistentValue, setPersistentValue, usePersistentState} from "../hooks/usePersistentState.js";
import {useGoogleAuth} from "../hooks/useGoogleAuth.js";
import {cropAndCompressImage} from "./calculator.jsx";
import {loadImage} from "../utils/imageCache.js";
import PlainModal from "../components/PlainModal.jsx";

const FONT_LINKS = {
    Onest: 'https://fonts.googleapis.com/css2?family=Onest:wght@100..900&display=swap',
    Fredoka: 'https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600&display=swap',
    Quicksand: 'https://fonts.googleapis.com/css2?family=Quicksand:wght@400;600&display=swap',
    'Comic Neue': 'https://fonts.googleapis.com/css2?family=Comic+Neue:wght@400;700&display=swap',
    Caveat: 'https://fonts.googleapis.com/css2?family=Caveat:wght@400;600&display=swap',
};

const localStorageDataMap = {
    "All Characters": "characterRuntimeStates",
    "Current Character": "_",
    "Echo Bag": "echoBag",
    "Echo Presets": "echoPresets",
    "Saved Team Rotations": "globalSavedTeamRotations",
    "Saved Rotations": "globalSavedRotations",
    "Settings": "__controls__",
    "All Data": "_",
};

export default function Setting(props) {
    const fileInputRef = useRef(null);
    const [showToast, setShowToast] = useState(false);
    const [popupMessage, setPopupMessage] = useState({
        icon: null,
        message: null,
        color: null,
        duration: 3000,
        prompt: {}
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
    const {
        theme,
        setTheme,
        variants,
        toggleBlurMode,
        lightVariant,
        darkVariant,
        backgroundVariant,
        setLightVariant,
        setDarkVariant,
        setBackgroundVariant,
        setBackgroundImage,
        backgroundImage,
        isDark,
        blurMode
    } = props;
    const [hamburgerOpen, setHamburgerOpen] = useState(false);
    const [importPreview, setImportPreview] = useState(null);
    const [showImportModal, setShowImportModal] = useState(false);
    const [importSuccess, setImportSuccess] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);

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

    function downloadCharacterState() {
        const characterRuntimeStates = getPersistentValue("characterRuntimeStates", {});
        const id = getPersistentValue("activeCharacterId", null);

        if (!characterRuntimeStates[id]) {
            setPopupMessage({
                message: "Oh... no cached character data found... (ㆆ ᴗ ㆆ)",
                icon: "✘",
                color: "red"
            });
            setShowToast(true);
            return;
        }

        const dataToSave = { ...characterRuntimeStates[id] };

        if (Array.isArray(dataToSave.Team)) {
            dataToSave.Team = [null, dataToSave.Team[1] ?? null, dataToSave.Team[2] ?? null];
        }

        const wrapped = {
            "Current Character": { [id]: dataToSave }
        };

        const blob = new Blob([JSON.stringify(wrapped, null, 2)], {
            type: "application/json"
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${characterRuntimeStates[id].Name ?? "character"}-cache.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function downloadAllData() {
        const keys = ["__charInfo__", "__controls__", "__stores__"];
        const combined = {
            "All Data": {}
        };

        for (const key of keys) {
            try {
                combined["All Data"][key] = JSON.parse(localStorage.getItem(key) || "{}");
            } catch (err) {
                console.warn(`Failed to read or parse ${key}:`, err);
                combined["All Data"][key] = { error: "Failed to parse data" };
            }
        }

        const blob = new Blob([JSON.stringify(combined, null, 2)], {
            type: "application/json"
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "all-data-backup.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function downloadDataFromMap(typeName) {
        const key = localStorageDataMap[typeName];
        if (!key) {
            setPopupMessage({
                message: `Oh no... unknown data type: ${typeName} (ㆆ ᴗ ㆆ)`,
                icon: "✘",
                color: "red"
            });
            setShowToast(true);
            return;
        }

        if (typeName === "Current Character") {
            downloadCharacterState();
            return;
        }
        if (typeName === "All Data") {
            downloadAllData();
            return;
        }

        const data = getPersistentValue(key, {});
        if (!data || Object.keys(data).length === 0) {
            setPopupMessage({
                message: `Oh... no cached ${typeName} data found... (ㆆ ᴗ ㆆ)`,
                icon: "✘",
                color: "red"
            });
            setShowToast(true);
            return;
        }

        const wrapped = { [typeName]: data };

        const blob = new Blob([JSON.stringify(wrapped, null, 2)], {
            type: "application/json"
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${typeName.replace(/\s+/g, "_").toLowerCase()}-backup.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function downloadSelectedBackups(selectedOptions = []) {
        selectedOptions.forEach((typeName) => downloadDataFromMap(typeName));
    }

    function importDataFromFile(event) {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const parsed = JSON.parse(e.target.result);
                const topLevelKeys = Object.keys(parsed);
                let importedCount = 0;

                const inverseMap = Object.fromEntries(
                    Object.entries(localStorageDataMap).map(([label, key]) => [label, key])
                );

                if (parsed["Current Character"]) {
                    const charObject = parsed["Current Character"];
                    const charId = Object.keys(charObject)[0];
                    const data = charObject[charId];

                    if (!charId || !data?.Id) {
                        throw new Error("Invalid Current Character file format.");
                    }

                    setImportPreview(data);
                    setShowImportModal(true);
                    return;
                }

                if (parsed["All Data"]) {
                    const nested = parsed["All Data"];
                    for (const k of Object.keys(nested)) {
                        localStorage.setItem(k, JSON.stringify(nested[k]));
                        importedCount++;
                    }
                    window.location.href = window.location.href;
                    return;
                }

                for (const label of topLevelKeys) {
                    const storageKey = inverseMap[label];

                    if (!storageKey || storageKey === "_") continue;

                    const value = parsed[label];
                    if (!value || typeof value !== "object") continue;

                    localStorage.setItem(storageKey, JSON.stringify(value));
                    importedCount++;
                }
                window.location.href = window.location.href;

            } catch (err) {
                console.error("[Import] Failed to parse or import:", err);
                setPopupMessage({
                    message: "This file doesn’t look like one of ours... (╹ -╹)?",
                    icon: "✘",
                    color: "red"
                });
                setShowToast(true);
            }
        };

        reader.readAsText(file);
    }

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

    const { user, accessToken, login, logout, refresh } = useGoogleAuth();
    const [loading, setLoading] = useState(false);

    async function handleBackup() {
        if (!accessToken) {
            setPopupMessage({
                message: 'You need sign in first... (￣￢￣ヾ)',
                icon: '✘',
                color: 'red'
            });
            setShowToast(true);
            return;
        }

        setLoading(true);
        try {
            await uploadToDrive(accessToken, getSyncData());

            setPopupMessage({
                message: 'Backup uploaded to Google Drive~! (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧',
                icon: '✔',
                color: { light: 'green', dark: 'limegreen' },
            });
            setShowToast(true);
        } catch (err) {
            console.error(err);

            setPopupMessage({
                message: 'O-oh... something went wrong... ◑ . ◑',
                icon: '✘',
                color: 'red',
            });
            setShowToast(true);
        } finally {
            setLoading(false);
        }
    }

    async function handleRestore() {
        if (!accessToken) {
            setPopupMessage({
                message: 'You need sign in first... (￣￢￣ヾ)',
                icon: '✘',
                color: 'red'
            });
            setShowToast(true);
            return;
        }

        setLoading(true);
        try {
            await restoreFromDrive(accessToken);
            setPopupMessage({
                message: 'Restore complete~! (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧',
                icon: '✔',
                color: { light: 'green', dark: 'limegreen' },
            });
            setShowToast(true);
        } catch (err) {
            console.error(err);

            setPopupMessage({
                message: 'O-oh... something went wrong... ◑ . ◑',
                icon: '✘',
                color: 'red',
            });
            setShowToast(true);
        } finally {
            setLoading(false);
        }
    }

    /*const listAllDriveFiles = async (accessToken) => {
        const res = await fetch(
            'https://www.googleapis.com/drive/v3/files?spaces=appDataFolder',
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        const data = await res.json();
        console.log('Files in AppData folder:', data.files);
    };*/

    const handleReset = () => {
        localStorage.clear();
        setPersistentValue('enemyLevel', 100);
        setPersistentValue('enemyRes', 20);
        setPersistentValue('characterRuntimeStates', {});
        setPersistentValue('activeCharacterId', 1506);
        window.location.href = '/';
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

    const location = useLocation();

    useEffect(() => {
        if (location.hash) {
            const section = document.querySelector(location.hash);
            if (section) {
                section.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        }
    }, [location]);

    const canPreview = validLink || !fontLink;
    const [modalOpen, setModalOpen] = useState(false);
    const [modalContentType, setModalContentType] = useState(null);
    const [clickCounter, setClickCounter] = useState(0);

    const [dataBackUpOption, setDataBackUpOption] = useState(new Set(["All Data"]));

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
                                Export or import build data to or from local storage.
                            </p>

                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                <button
                                    className="btn-primary"
                                    onClick={() => {
                                        setModalContentType("backup");
                                        setModalOpen(true);
                                    }}
                                >
                                    Export Data
                                </button>

                                <label htmlFor="import-character" className="btn-primary" style={{ cursor: 'pointer' }}>
                                    Import Data
                                </label>
                                <input
                                    type="file"
                                    id="import-character"
                                    accept="application/json"
                                    style={{ display: 'none' }}
                                    onChange={importDataFromFile}
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

                        <div className="echo-buff" id="theme-variants">
                            <h2>Appearance</h2>
                            <p style={{ marginBottom: '1rem' }}>
                                Choose your preferred theme variant for both light and dark modes.
                                These control the appearance of the interface depending on which mode is active.
                            </p>
                            <ThemeVariantGrid
                                mode="light"
                                value={lightVariant}
                                onChange={setLightVariant}
                                variants={variants}
                                theme={theme}
                                backgroundImage={backgroundImage}
                            />

                            <ThemeVariantGrid
                                mode="dark"
                                value={darkVariant}
                                onChange={setDarkVariant}
                                variants={variants}
                                theme={theme}
                                backgroundImage={backgroundImage}
                            />

                            <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>
                                Background themes may reduce performance on some systems and browsers. <span
                                    className={`dropzone-click-text`}
                                    onClick={() => {
                                        setModalContentType("backgroundModalGuide");
                                        setModalOpen(true);
                                    }}
                                >
                                    See more.
                                </span>
                            </p>
                            <ThemeVariantGrid
                                mode="background"
                                value={backgroundVariant}
                                onChange={setBackgroundVariant}
                                variants={variants}
                                unselect={theme !== 'background'}
                                theme={theme}
                                backgroundImage={backgroundImage}
                            />

                            {theme === 'background' && (
                                <>
                                    <p style={{ margin: '1rem 0 0.5rem 0' }}>
                                        Upload a picture you want as a background (*ᴗ͈ˬᴗ͈)ꕤ*.ﾟ
                                    </p>
                                    <div
                                        className="modal-dropzone"
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            const file = e.dataTransfer.files?.[0];
                                            if (file) setBackgroundImage(file);
                                        }}
                                    >
                                        <div className="modal-dropzone-text">
                                            <p
                                                className="dropzone-click-text"
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                Choose Image
                                            </p>
                                        </div>
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) setBackgroundImage(file);
                                        }}
                                    />
                                </>
                            )}
                            <p style={{
                                marginBottom: 'unset',
                                fontSize: '0.9rem',
                                opacity: 0.75,
                                textAlign: 'center'
                            }}>
                                Light and dark mode switching is disabled while using a background image.
                            </p>
                        </div>
                        <div className="echo-buff">
                            <h2>Google Drive Sync</h2>
                            <p style={{ marginBottom: '1rem' }}>
                                Your data is automatically synced between your device and a dedicated AppData folder in Google Drive. This website can't access any other files in your Google Drive.
                            </p>
                            {!accessToken ? (
                                <button className="btn-primary" onClick={login} disabled={loading}>
                                    Sign in
                                </button>
                            ) : (
                                <>
                                    <div style={{ display: 'flex', flexDirection: 'row', gap: '0.5rem' }}>
                                        <button className="btn-primary" onClick={logout} disabled={loading}>
                                            Sign Out
                                        </button>
                                        <button
                                            className="btn-primary"
                                            onClick={handleBackup}
                                            disabled={loading}
                                        >
                                            Backup
                                        </button>
                                        <button className="btn-primary" onClick={handleRestore} disabled={loading}>
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

                                    const prev = getPersistentValue('characterRuntimeStates', {});

                                    const newRuntimeStates = {
                                        ...prev,
                                        [charId]: importPreview,
                                    };

                                    setPersistentValue('characterRuntimeStates', newRuntimeStates);
                                    setPersistentValue('activeCharacterId', charId);
                                    setPersistentValue('team', [
                                        charId,
                                        importPreview.Team?.[1] ?? null,
                                        importPreview.Team?.[2] ?? null,
                                    ]);
                                    const rotationEntriesRaw = getPersistentValue('rotationEntriesStore', {});
                                    const newRotationEntries = {
                                        ...rotationEntriesRaw,
                                        [charId]: importPreview.rotationEntries ?? [],
                                    };
                                    setPersistentValue('rotationEntriesStore', newRotationEntries);

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
                    onClose={
                        popupMessage.onClose
                            ? popupMessage.onClose
                            : () => setTimeout(() => setShowToast(false), 300)
                    }
                    position={'top'}
                    bold={true}
                    duration={popupMessage.duration}
                    prompt={popupMessage.prompt}
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

            <PlainModal modalOpen={modalOpen} setModalOpen={setModalOpen} width="800px">
                {modalContentType === "backup" ? (
                    <DataBackupSelector
                        dataBackUpOption={dataBackUpOption}
                        setDataBackUpOption={setDataBackUpOption}
                        downloadSelectedBackups={downloadSelectedBackups}
                    />
                ) : (
                    <BackgroundModalGuide
                        blurMode={blurMode}
                        clickCounter={clickCounter}
                        setClickCounter={setClickCounter}
                        setShowToast={setShowToast}
                        toggleBlurMode={toggleBlurMode}
                        setPopupMessage={setPopupMessage}
                        showToast={showToast}
                    />
                )}
            </PlainModal>
        </div>
    );
}


export function ThemeVariantGrid({ mode = "dark", value, onChange, variants, unselect = false, theme, backgroundImage }) {
    const list = variants[mode] || [];
    const [refresh, setRefresh] = useState(0);
    const [previewMap, setPreviewMap] = useState({});
    const dynamicThemeMap = themeMap(backgroundImage);

    useEffect(() => {
        const observer = new MutationObserver(() => setRefresh((r) => r + 1));
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["style"],
        });
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        let isCancelled = false;

        async function loadPreviews() {
            for (const opt of list) {
                const entry = dynamicThemeMap[opt];
                if (!entry) continue;

                let previewValue = entry.preview;
                if (typeof previewValue === "function") {
                    previewValue = await Promise.resolve(entry.preview());
                }

                if (!isCancelled) {
                    setPreviewMap((prev) => ({ ...prev, [opt]: previewValue }));
                }
            }
        }

        loadPreviews();
        return () => (isCancelled = true);
    }, [list, refresh, backgroundImage]);

    return (
        <div className="theme-variant-grid">
            {list.map((opt) => {
                const isActive = value === opt && !unselect;
                const previewValue = previewMap[opt] || "#ccc";
                const disable = mode !== "background" && theme === "background";
                const backgroundImage = previewValue.startsWith("data:image")
                    ? `url(${previewValue})`
                    : ''

                return (
                    <div
                        key={opt}
                        data-tooltip={dynamicThemeMap[opt].name}
                        className="damage-tooltip-wrapper"
                        style={{
                            opacity: disable ? 0.5 : 1,
                            pointerEvents: disable ? 'none' : 'auto'
                        }}
                    >
                        <button
                            className={`theme-swatch 
                            ${isActive ? "active" : ""} 
                            ${mode !== 'background' ? (previewValue.startsWith('linear') ? 'gradient' : 'plain') : ''}`}
                            onClick={() => onChange(opt)}
                            style={{
                                '--preview-value': previewValue,
                                backgroundImage: backgroundImage,
                                backgroundRepeat: "no-repeat",
                                backgroundSize: "cover",
                                borderColor: mode === 'background' ? 'white' : 'transparent',
                                backgroundPosition: "center"
                            }}
                            disabled={disable}
                        >
                            {dynamicThemeMap[opt].newStatus && (
                                <span className="badge-new">NEW</span>
                            )}
                        </button>
                    </div>
                );
            })}
        </div>
    );
}

let cachedPreview = null;

export async function getFrostedAuroraPreview(backgroundImage) {
    try {
        if (cachedPreview) return cachedPreview;
        const cacheKey = `bgcache:${backgroundImage}:${window.innerWidth}x${window.innerHeight}`;
        const cachedBlob = await loadImage(cacheKey);

        let sourceUrl;

        if (cachedBlob) {
            sourceUrl = URL.createObjectURL(cachedBlob);
        } else {
            sourceUrl = backgroundImage;
        }

        const base64 = await cropAndCompressImage(sourceUrl, 0.6, 64, 64);
        cachedPreview = base64;

        return base64;
    } catch (err) {
        console.warn("⚠️ Failed to get frosted preview:", err);
        return "white";
    }
}

export const themeMap = (backgroundImage) => ({
    "light": {
        name: "Classic",
        newStatus: false,
        preview: "white",
    },
    "pastel-pink": {
        name: "Pastel Pink",
        newStatus: true,
        preview: "#ffd8e0",
    },
    "pastel-blue": {
        name: "Pastel Blue",
        newStatus: true,
        preview: "#d8ebff",
    },
    "vibrant-citrus": {
        name: "Vibrant Citrus",
        newStatus: true,
        preview: "#fff2d7",
    },
    "glassy-rainbow": {
        name: "Glassy Rainbow",
        newStatus: true,
        preview: "linear-gradient(135deg, #ffebf8, #e6faff, #fff9e6)",
    },
    "dark": {
        name: "Midnight",
        newStatus: false,
        preview: "#131922",
    },
    "dark-alt": {
        name: "Blackest",
        newStatus: false,
        preview: "black",
    },
    "cosmic-rainbow": {
        name: "Cosmic Rainbow",
        newStatus: true,
        preview: "linear-gradient(145deg, rgb(25 10 69), rgb(57 37 80))",
    },
    "scarlet-nebula": {
        name: "Scarlet Nebula",
        newStatus: true,
        preview: "linear-gradient(135deg, rgb(53, 0, 0), rgb(85, 0, 0))",
    },
    "frosted-aurora": {
        name: "Image",
        newStatus: true,
        preview: async () => await getFrostedAuroraPreview(backgroundImage),
    },
});

function BackgroundModalGuide({
                                  blurMode,
                                  clickCounter,
                                  setClickCounter,
                                  setShowToast,
                                  toggleBlurMode,
                                  setPopupMessage,
                                  showToast
                              }) {
    return (
        <>
            <h2 style={{ margin: 'unset' }}>About Background Themes</h2>
            <p style={{ lineHeight: 1.6, margin: 'unset' }}>
                Background themes use Frosted or blurred elements for most things on
                here which in turn use a real-time effect called
                <strong> BACKDROP FILTERING</strong>. It looks smooth and glassy but can
                be demanding on your GPU, especially when large images or multiple
                translucent layers are involved.
            </p>

            <p style={{ lineHeight: 1.6, margin: 'unset' }}>
                If your device feels slow, turn off blur or try switching to a simpler theme in
                the Appearance settings. You’ll get much faster animations and
                reduced memory usage with almost the same visual quality (just
                no custom background).
            </p>

            <p style={{ lineHeight: 1.6, opacity: 0.7, margin: 'unset' }}>
                *Technical note:* Each time the screen updates, the browser must
                re-render and blur everything behind your frosted layer. On some
                systems, this can cause frame drops or increased fan noise.
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: 'column', gap: '1rem' }}>
                        <span className="highlight">
                            ❯❯❯❯ To turn <span style={{ color: 'red' }}>{blurMode === "on" ? "OFF" : "ON"}</span> blur effect on some surfaces and elements click "THE Button"
                        </span>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                    {clickCounter <= 8 && (
                        <button
                            className="clear-button"
                            onClick={() => {
                                aLittleTrolling({
                                    clickCounter,
                                    setClickCounter,
                                    setShowToast,
                                    toggleBlurMode,
                                    setPopupMessage,
                                    showToast
                                })
                            }}
                            style={{ margin: 'unset' }}
                        >
                            a button
                        </button>
                    )}
                    <button
                        className="clear-button"
                        onClick={() => {
                            toggleBlurMode();
                            if (clickCounter > 8) {
                                setPopupMessage({
                                    message: `ok you get get the funny button back`,
                                    icon: '',
                                    color: {light: 'green', dark: 'limegreen'},
                                    duration: 10000,
                                });
                                setShowToast(true);
                                setTimeout(() => {
                                    setClickCounter(0);
                                }, 2000);
                            }
                        }}
                        style={{ margin: 'unset' }}
                    >
                        THE Button
                    </button>
                </div>
            </div>

{/*
            <button
                className="btn-primary"
                onClick={() => setModalOpen(false)}
                style={{ margin: 'unset', marginTop: 'auto' }}
            >
                Got it
            </button>
*/}
        </>
    )
}

function aLittleTrolling ({clickCounter, setClickCounter, setShowToast, toggleBlurMode, setPopupMessage, showToast}) {
    if (showToast) setShowToast(false);
    setTimeout(() => {
        if (clickCounter <= 4) {
            switch (clickCounter) {
                case 0:
                    setPopupMessage({
                        message: 'Oh did you click "a" button? hmm??',
                        icon: '',
                        color: {light: 'green', dark: 'limegreen'},
                        duration: 10000,
                        prompt: {
                            message: 'an enticing link~',
                            action: () => window.open('https://youtu.be/oPLObjVAvIU?si=xO8gapHdLmygFvUG', '_blank')
                        },
                        onClose: () => setTimeout(() => setShowToast(false), 300)
                    });
                    setShowToast(true);
                    setClickCounter(prev => prev + 1);
                    break;
                case 1:
                    setPopupMessage({
                        message: 'Again...? hmm...',
                        icon: '',
                        color: {light: 'green', dark: 'limegreen'},
                        duration: 10000,
                        prompt: {
                            message: "it's a link to something",
                            action: () => window.open('https://youtu.be/oPLObjVAvIU?si=xO8gapHdLmygFvUG', '_blank')
                        },
                        onClose: () => setTimeout(() => setShowToast(false), 300)
                    });
                    setShowToast(true);
                    setClickCounter(prev => prev + 1);
                    break;
                case 2:
                    setPopupMessage({
                        message: 'yeah just click the link...',
                        icon: '',
                        color: {light: 'green', dark: 'limegreen'},
                        duration: 10000,
                        prompt: {
                            message: "link",
                            action: () => window.open('https://youtu.be/oPLObjVAvIU?si=xO8gapHdLmygFvUG', '_blank')
                        },
                        onClose: () => setTimeout(() => setShowToast(false), 300)
                    });
                    setShowToast(true);
                    setClickCounter(prev => prev + 1);
                    break;
                case 3:
                    setPopupMessage({
                        message: 'why...',
                        icon: '',
                        color: {light: 'green', dark: 'limegreen'},
                        duration: 10000,
                        prompt: {
                            message: "you WILL be rick-rolled",
                            action: () => window.open('https://youtu.be/oPLObjVAvIU?si=xO8gapHdLmygFvUG', '_blank')
                        },
                        onClose: () => setTimeout(() => setShowToast(false), 300)
                    });
                    setShowToast(true);
                    setClickCounter(prev => prev + 1);
                    break;
                case 4:
                    setPopupMessage({
                        message: 'you win, just toggle it already',
                        icon: '',
                        color: {light: 'green', dark: 'limegreen'},
                        duration: 10000,
                        prompt: {
                            message: "toggle",
                            action: toggleBlurMode
                        },
                        onClose: () => setTimeout(() => setShowToast(false), 300)
                    });
                    setShowToast(true);
                    setClickCounter(prev => prev + 1);
                    break;
                default:
                    break;
            }
        } else if (clickCounter > 4 && clickCounter <= 7) {
            setPopupMessage({
                message: 'toggle blur effect',
                icon: '',
                color: {light: 'green', dark: 'limegreen'},
                duration: 10000,
                prompt: {
                    message: "toggle",
                    action: toggleBlurMode
                },
                onClose: () => setTimeout(() => setShowToast(false), 300)
            });
            setShowToast(true);
            setClickCounter(prev => prev + 1);
        } else {
            setPopupMessage({
                message: "Ok i'm taking away the button",
                icon: '',
                color: {light: 'green', dark: 'limegreen'},
                duration: 10000,
            });
            setShowToast(true);
            setTimeout(() => {
                setClickCounter(prev => prev + 1);
            }, 2000);
        }
    }, showToast ? 500 : 0);
}

export function DataBackupSelector({ dataBackUpOption = new Set(), setDataBackUpOption, onChange, downloadSelectedBackups }) {
    const toggleOption = (label) => {
        const newSet = new Set(dataBackUpOption);
        if (newSet.has(label)) newSet.delete(label);
        else newSet.add(label);
        setDataBackUpOption(newSet);
        onChange?.([...newSet]);
    };

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
                padding: "1rem 1rem 0 1rem",
                maxHeight: "400px",
                overflowY: "auto",
            }}
        >
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                <h2 style={{ margin: 0, fontSize: "1.25rem" }}>Select Data to Back Up</h2>
                {(dataBackUpOption.size > 0) && (
                    <button
                        className="btn-primary"
                        onClick={() => downloadSelectedBackups([...dataBackUpOption])}
                    >
                        Export Selected
                    </button>
                )}
            </div>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                    gap: "0.75rem",
                }}
            >
                {Object.keys(localStorageDataMap).map((label) => {
                    const isChecked = dataBackUpOption.has(label);
                    return (
                        <label
                            key={label}
                            className="modern-checkbox echo-buff"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                border: `1px solid ${isChecked ? "rgba(32,191,185,0.89)" : "#555"}`,
                                cursor: "pointer",
                                borderRadius: "0.5rem",
                                background: isChecked
                                    ? "rgba(102, 204, 255, 0.15)"
                                    : "transparent",
                                transition: "background 0.3s ease, border 0.3s ease",
                                padding: "0.6rem 1rem",
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleOption(label)}
                            />
                            <span>{label}</span>
                        </label>
                    );
                })}
            </div>

            <div
                className="highlight"
                style={{
                    marginTop: "0.5rem",
                    fontSize: "0.9rem",
                    opacity: 0.7,
                    textAlign: "center",
                }}
            >
                Selected:{" "}
                {dataBackUpOption.size > 0
                    ? [...dataBackUpOption].join(", ")
                    : "None"}
            </div>
        </div>
    );
}