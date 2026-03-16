import React, {useCallback, useEffect, useRef, useState} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import {HelpCircle, History, Info, Moon, Settings as SettingsIcon, Sparkle, Sun} from "lucide-react";
import {getSyncData, restoreFromDrive, uploadToDrive} from '@shared/utils/driveSync.js';
import NotificationToast from "@shared/ui/common/NotificationToast.jsx";
import ConfirmationModal from "@shared/ui/common/ConfirmationModal.jsx";
import ImportOverviewMini from "@shared/ui/common/ImportOverviewMini.jsx";
import {getPersistentValue, setPersistentValue, usePersistentState} from '@shared/hooks/usePersistentState.js';
import {useGoogleAuth} from '@shared/hooks/useGoogleAuth.js';
import PlainModal from "@shared/ui/common/PlainModal.jsx";
import { useKarmitisAuth } from '@shared/hooks/useKarmitisAuth.js';
import ThemeVariantGrid from "@/features/settings/ui/ThemeVariantGrid.jsx";
import DataBackupSelector from "@/features/settings/ui/DataBackupSelector.jsx";
import BackgroundModalGuide from "@/features/settings/ui/BackgroundModalGuide.jsx";
import { FONT_LINKS, LOCAL_STORAGE_DATA_MAP } from "@/features/settings/model/settingsConstants.js";
import { useResponsiveSidebar } from "@routes/shared/useResponsiveSidebar.js";

const KARMITIS_ENABLED = false;
const KARMITIS_DISABLED_DETAIL = 'Cloud backup is still in development.';

export default function SettingsRoute(props) {
    const { user: googleUser, accessToken: googleAccessToken, login: googleLogin, logout: googleLogout } = useGoogleAuth();
    const { user: karmitisUser, accessToken: karmitisAccessToken, error: karmitisError, login: karmitisLogin, logout: karmitisLogout, exchangeCode: exchangeKarmitisCode } = useKarmitisAuth();

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
    const location = useLocation();
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
    const {
        hamburgerOpen,
        setHamburgerOpen,
        isMobile,
        isOverlayVisible,
        isOverlayClosing,
    } = useResponsiveSidebar();
    const [importPreview, setImportPreview] = useState(null);
    const [showImportModal, setShowImportModal] = useState(false);
    const [importSuccess, setImportSuccess] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [activeProvider, setActiveProvider] = useState(null); // 'google' | 'karmitis' | null
    const [selectedProvider, setSelectedProvider] = useState(null);
    const [pendingProvider, setPendingProvider] = useState(null);
    const karmitisRestoredRef = useRef(false);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    };



    const clearPendingProvider = useCallback(() => {
        setPendingProvider(null);
        try {
            localStorage.removeItem('cloud_pending_provider');
        } catch {
            /* ignore */
        }
    }, []);



    
    function startProviderLogin(provider) {
        if (provider === 'karmitis' && !KARMITIS_ENABLED) {
            setPopupMessage({
                message: 'Karmitis backup is still in development... (￣ω￣;)',
                icon: '✘',
                color: 'red'
            });
            setShowToast(true);
            return;
        }

        setPendingProvider(provider);
        try {
            localStorage.setItem('cloud_pending_provider', provider);
        } catch {
            /* ignore */
        }

        if (provider === 'google') {
            googleLogin();
            return;
        }

        karmitisLogin();
    }

    useEffect(() => {
        if (importSuccess) {
            const timeout = setTimeout(() => setImportSuccess(''), 5000);
            return () => clearTimeout(timeout);
        }
    }, [importSuccess]);

    // If the user just signed in to Karmitis, auto-restore their latest appdata once.
    useEffect(() => {
        if (activeProvider !== 'karmitis') return;
        if (!karmitisUser) return;
        if (karmitisRestoredRef.current) return;
        karmitisRestoredRef.current = true;
/*
        handleRestore();
*/
    }, [activeProvider, karmitisUser]);

    function handleProviderContinue() {
        if (!selectedProvider) return;
        if (selectedProvider === 'google') {
            if (googleSignedIn) {
                setActiveProvider('google');
                clearPendingProvider();
                return;
            }
            startProviderLogin('google');
            return;
        }
        if (selectedProvider === 'karmitis') {
            if (!KARMITIS_ENABLED) {
                startProviderLogin('karmitis');
                return;
            }
            if (karmitisSignedIn) {
                setActiveProvider('karmitis');
                clearPendingProvider();
                return;
            }
            startProviderLogin('karmitis');
        }
    }

    function handleProviderSignOut() {
        if (activeProvider === 'google') {
            googleLogout();
            clearPendingProvider();
            setActiveProvider(null);
            setSelectedProvider(null);
            return;
        }
        if (activeProvider === 'karmitis') {
            karmitisLogout();
            clearPendingProvider();
            setActiveProvider(null);
            setSelectedProvider(null);
        }
    }

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
        const key = LOCAL_STORAGE_DATA_MAP[typeName];
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
                    Object.entries(LOCAL_STORAGE_DATA_MAP).map(([label, key]) => [label, key])
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

    const [loading, setLoading] = useState(false);
    const googleSignedIn = Boolean(googleAccessToken);
    const karmitisSignedIn = Boolean(karmitisAccessToken);



    useEffect(() => {
        if (!pendingProvider) return;
        if (pendingProvider === 'google' && googleSignedIn) {
            setActiveProvider('google');
            clearPendingProvider();
        }
        if (KARMITIS_ENABLED && pendingProvider === 'karmitis' && karmitisSignedIn) {
            setActiveProvider('karmitis');
            clearPendingProvider();
        }
    }, [pendingProvider, googleSignedIn, karmitisSignedIn, clearPendingProvider]);

    useEffect(() => {
        if (activeProvider || pendingProvider) return;
        if (googleSignedIn && !karmitisSignedIn) {
            setActiveProvider('google');
            return;
        }
        if (KARMITIS_ENABLED && karmitisSignedIn && !googleSignedIn) {
            setActiveProvider('karmitis');
        }
    }, [activeProvider, pendingProvider, googleSignedIn, karmitisSignedIn]);

    useEffect(() => {
        if (activeProvider === 'google' && !googleSignedIn) setActiveProvider(null);
        if (activeProvider === 'karmitis' && (!KARMITIS_ENABLED || !karmitisSignedIn)) setActiveProvider(null);
    }, [activeProvider, googleSignedIn, karmitisSignedIn]);



    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const code = params.get('code');
        if (code) {
            if (!KARMITIS_ENABLED) {
                params.delete('code');
                params.delete('state');
                const newSearch = params.toString();
                navigate(newSearch ? `${location.pathname}?${newSearch}` : location.pathname, { replace: true });
                return;
            }
            exchangeKarmitisCode(code);
            params.delete('code');
            params.delete('state');
            const newSearch = params.toString();
            navigate(newSearch ? `${location.pathname}?${newSearch}` : location.pathname, { replace: true });
        }
    }, [location, navigate, exchangeKarmitisCode]);



    useEffect(() => {
        if (activeProvider) return;
        if (googleSignedIn) {
            setActiveProvider('google');
        } else if (KARMITIS_ENABLED && karmitisSignedIn) {
            setActiveProvider('karmitis');
        }
    }, [googleSignedIn, karmitisSignedIn, activeProvider]);

    async function handleBackup() {
        if (!activeProvider) {
            setPopupMessage(prev => ({
                ...prev,
                message: 'Choose a provider and sign in first... (￣￢￣ヾ)',
                icon: '✘',
                color: 'red'
            }));
            setShowToast(true);
            return;
        }

        if (activeProvider === 'google') {
            if (!googleAccessToken) {
                setPopupMessage(prev => ({
                    ...prev,
                    message: 'Sign in with Google first... (￣￢￣ヾ)',
                    icon: '✘',
                    color: 'red'
                }));
                setShowToast(true);
                return;
            }
            setLoading(true);
            try {
                await uploadToDrive(googleAccessToken, getSyncData());
                setPopupMessage(prev => ({
                    ...prev,
                    message: 'Backup uploaded to Google Drive~! (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧',
                    icon: '✔',
                    color: { light: 'green', dark: 'limegreen' },
                }));
            } catch (err) {
                console.error(err);
                setPopupMessage(prev => ({
                    ...prev,
                    message: 'Drive backup failed ◑ . ◑',
                    icon: '✘',
                    color: 'red',
                }));
            } finally {
                setLoading(false);
                setShowToast(true);
            }
            return;
        }

        // Karmitis backup
        setLoading(true);
        try {
            if (!karmitisSignedIn) {
                throw new Error("karmitis_not_logged_in");
            }
            if (!karmitisUser?.id) {
                throw new Error("karmitis_user_missing");
            }
            const payload = JSON.parse(getSyncData());
            const resp = await fetch("/api/karmitis-backup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ payload, userId: karmitisUser.id }),
            });
            if (!resp.ok) {
                const txt = await resp.text();
                throw new Error(txt || "karmitis_backup_failed");
            }
            setPopupMessage(prev => ({
                ...prev,
                message: 'Backup uploaded to Karmitis! (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧',
                icon: '✔',
                color: { light: 'green', dark: 'limegreen' },
            }));
        } catch (err) {
            console.error(err);
            setPopupMessage(prev => ({
                ...prev,
                message: 'Karmitis backup failed ◑ . ◑',
                icon: '✘',
                color: 'red',
            }));
        } finally {
            setLoading(false);
            setShowToast(true);
        }
    }
    async function handleRestore() {
        if (!activeProvider) {
            setPopupMessage({
                message: 'Choose a provider and sign in first... (￣￢￣ヾ)',
                icon: '✘',
                color: 'red'
            });
            setShowToast(true);
            return;
        }

        if (activeProvider === 'google') {
            if (!googleAccessToken) {
                setPopupMessage(prev => ({
                    ...prev,
                    message: 'Sign in with Google first... (￣￢￣ヾ)',
                    icon: '✘',
                    color: 'red'
                }));
                setShowToast(true);
                return;
            }

            setLoading(true);
            try {
                await restoreFromDrive(googleAccessToken);
                setPopupMessage(prev => ({
                    ...prev,
                    message: 'Restore complete~! (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧',
                    icon: '✔',
                    color: { light: 'green', dark: 'limegreen' },
                }));
            } catch (err) {
                console.error(err);
                setPopupMessage(prev => ({
                    ...prev,
                    message: 'Drive restore failed ◑ . ◑',
                    icon: '✘',
                    color: 'red',
                }));
            } finally {
                setLoading(false);
                setShowToast(true);
            }
            return;
        }

        // Karmitis restore (latest backup)
        setLoading(true);
        try {
            if (!karmitisSignedIn) {
                throw new Error("karmitis_not_logged_in");
            }
            if (!karmitisUser?.id) {
                throw new Error("karmitis_user_missing");
            }
            const resp = await fetch(`/api/karmitis-backup?userId=${encodeURIComponent(karmitisUser.id)}`);
            if (!resp.ok) {
                const txt = await resp.text();
                throw new Error(txt || "karmitis_restore_failed");
            }
            const data = await resp.json();
            const payload = data?.payload?.appdata || data?.payload?.appData || data?.payload;
            if (!payload) throw new Error("no_payload");

            if (payload["All Data"]) {
                for (const [key, value] of Object.entries(payload["All Data"])) {
                    localStorage.setItem(key, JSON.stringify(value ?? {}));
                }
            } else {
                for (const [key, value] of Object.entries(payload)) {
                    setPersistentValue(key, value);
                }
            }

            window.location.href = "/";
        } catch (err) {
            console.error(err);
            setPopupMessage(prev => ({
                ...prev,
                message: 'Karmitis restore failed ◑ . ◑',
                icon: '✘',
                color: 'red',
            }));
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
    const cardSurface = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
    const cardBorder = isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.12)';
    const mutedText = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)';
    const chipBg = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';
    const chipText = isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.7)';
    const accentColor = 'var(--slider-color, #00bcd4)';

    const karmitisDisplayName =
        karmitisUser?.username ||
        karmitisUser?.email ||
        (karmitisSignedIn ? 'Karmitis account' : '');

    const providerOptions = [
        {
            id: 'google',
            label: 'Google',
            description: 'Use your Google account.',
            detail: googleUser?.email || (googleSignedIn ? 'Google account' : ''),
            signedIn: googleSignedIn,
            disabled: false,
        },
        {
            id: 'karmitis',
            label: 'Karmitis',
            description: KARMITIS_ENABLED ? 'Use your Karmitis account.' : 'Unavailable for now.',
            detail: KARMITIS_ENABLED ? karmitisDisplayName : KARMITIS_DISABLED_DETAIL,
            signedIn: karmitisSignedIn,
            disabled: !KARMITIS_ENABLED,
        },
    ];

    const selectedMeta = providerOptions.find((option) => option.id === selectedProvider);
    const continueDisabled =
        !selectedMeta ||
        selectedMeta.disabled ||
        (selectedMeta.id === 'google' ? loading : false);

    const [providerSelected, setProviderSelected] = useState(false);

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
                                <SettingsIcon size={24} className="settings-icon" stroke="currentColor" />
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
                            <h2>Cloud Backup</h2>
                            <p style={{ marginBottom: '0.75rem' }}>
                                Choose a provider to sync your data. <a
                                    href="https://karmitis.com/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Karmitis
                                </a> keeps app-scoped backups; Google Drive uses your AppData folder.
                            </p>

                            {!activeProvider ? (
                                <div
                                    style={{
                                        border: `1px solid ${cardBorder}`,
                                        background: cardSurface,
                                        borderRadius: '16px',
                                        padding: '1rem',
                                        display: 'grid',
                                        gap: '0.75rem',
                                    }}
                                >
                                    <div>
                                        <span style={{ fontSize: '1.05rem', fontWeight: "bold" }}>Sign in</span>
                                        <div style={{ fontSize: '0.9rem', color: mutedText }}>
                                            Choose an account to continue to Wuthering Waves Damage Calculator &amp; Optimizer.
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gap: '0.6rem', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
                                        {providerOptions.map((option) => {
                                            const isSelected = selectedProvider === option.id;
                                            return (
                                                <button
                                                    key={option.id}
                                                    type="button"
                                                    disabled={option.disabled}
                                                    onClick={() => {
                                                        if (option.disabled) return;
                                                        setSelectedProvider(option.id);
                                                        setProviderSelected(true);
                                                        if (pendingProvider && pendingProvider !== option.id) {
                                                            clearPendingProvider();
                                                        }
                                                    }}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        gap: '1rem',
                                                        padding: '0.75rem 0.9rem',
                                                        borderRadius: '12px',
                                                        border: `1px solid ${isSelected ? accentColor : cardBorder}`,
                                                        background: 'transparent',
                                                        cursor: option.disabled ? 'not-allowed' : 'pointer',
                                                        textAlign: 'left',
                                                        opacity: option.disabled ? 0.6 : 1,
                                                    }}
                                                >
                                                    <div style={{ display: 'grid', gap: '0.2rem' }}>
                                                        <span style={{ fontWeight: 600 }}>{option.label}</span>
                                                        <span style={{ fontSize: '0.85rem', color: mutedText }}>
                                                            {option.description}
                                                        </span>
                                                        {option.detail && (
                                                            <span style={{ fontSize: '0.82rem', opacity: 0.85 }}>
                                                                {option.detail}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span
                                                        style={{
                                                            fontSize: '0.75rem',
                                                            padding: '0.15rem 0.5rem',
                                                            borderRadius: '999px',
                                                            background: chipBg,
                                                            color: chipText,
                                                            whiteSpace: 'nowrap',
                                                        }}
                                                    >
                                                        {option.disabled ? 'In development' : option.signedIn ? 'Signed in' : 'Sign in'}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>



                                    {pendingProvider &&
                                        !(
                                            (pendingProvider === 'google' && googleSignedIn) ||
                                            (pendingProvider === 'karmitis' && karmitisSignedIn)
                                        ) && (
                                            <div style={{ fontSize: '0.85rem', color: mutedText }}>
                                                Waiting for {pendingProvider === 'google' ? 'Google' : 'Karmitis'} sign-in…
                                            </div>
                                        )}

                                    {KARMITIS_ENABLED && karmitisError && (
                                        <div style={{ color: '#fca5a5', fontSize: '0.9rem' }}>
                                            {karmitisError}
                                        </div>
                                    )}

                                    {providerSelected && (
                                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                            <button
                                                className="btn-primary"
                                                onClick={handleProviderContinue}
                                                disabled={continueDisabled}
                                            >
                                                Continue
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div
                                    style={{
                                        border: `1px solid ${cardBorder}`,
                                        background: cardSurface,
                                        borderRadius: '16px',
                                        padding: '1rem',
                                        display: 'grid',
                                        gap: '0.75rem',
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            justifyContent: 'space-between',
                                            gap: '0.75rem',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <div style={{ display: 'grid', gap: '0.2rem' }}>
                                            <span style={{ fontWeight: 600 }}>
                                                Signed in with {activeProvider === 'google' ? 'Google' : 'Karmitis'}
                                            </span>
                                            <span style={{ fontSize: '0.85rem', color: mutedText }}>
                                                {activeProvider === 'google'
                                                    ? googleUser?.email || 'Google account'
                                                    : karmitisDisplayName}
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        <button
                                            className="btn-primary"
                                            onClick={handleBackup}
                                            disabled={loading}
                                        >
                                            Backup
                                        </button>
                                        <button
                                            className="btn-primary"
                                            onClick={handleRestore}
                                            disabled={loading}
                                        >
                                            Restore
                                        </button>
                                        <button
                                            className="btn-primary"
                                            onClick={handleProviderSignOut}
                                            disabled={loading}
                                        >
                                            Sign Out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <ImportOverviewMini
                importPreview={importPreview}
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                onConfirm={() => {
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
            />

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
                        dataOptions={Object.keys(LOCAL_STORAGE_DATA_MAP)}
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
