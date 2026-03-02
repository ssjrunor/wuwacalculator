import { useEffect, useLayoutEffect, useState } from "react";
import { getPersistentValue, setPersistentValue, usePersistentState } from "./usePersistentState.js";
import backgroundImageUrl from "/assets/backgrounds/wallpaperflare1.jpg";
import { saveImage, loadImage } from '@shared/utils/imageCache.js';

const THEME_KEY = "user-theme";
const LIGHT_VARIANT_KEY = "user-light-variant";
const DARK_VARIANT_KEY = "user-dark-variant";
const BACKGROUND_KEY = "user-background-variant";
const BLUR_MODE_KEY = "user-blur-mode";
const USER_HAS_SELECTED = "user-has-selected-theme";

const THEME_VARIANTS = {
    light: ["light", "pastel-pink", "pastel-blue", "vibrant-citrus", "glassy-rainbow"],
    dark: ["dark", "dark-alt", "cosmic-rainbow", "scarlet-nebula"],
    background: ["frosted-aurora"]
};

function getImageBrightness(imgSrc, callback) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imgSrc;
    img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let total = 0;
        for (let i = 0; i < data.length; i += 4) {
            total += (data[i] + data[i + 1] + data[i + 2]) / 3;
        }
        callback(total / (data.length / 4));
    };
}

function getImageMainColor(imgSrc, callback, isDark) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imgSrc;
    img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const width = (canvas.width = img.width);
        const height = (canvas.height = img.height);
        ctx.drawImage(img, 0, 0, width, height);
        const { data } = ctx.getImageData(0, 0, width, height);

        const colorCount = {};
        for (let i = 0; i < data.length; i += 40) { // skip pixels for speed
            const r = Math.floor(data[i] / 32) * 32;
            const g = Math.floor(data[i + 1] / 32) * 32;
            const b = Math.floor(data[i + 2] / 32) * 32;
            const key = `${r},${g},${b}`;
            colorCount[key] = (colorCount[key] || 0) + 1;
        }

        const dominant = Object.entries(colorCount).reduce((a, b) =>
            b[1] > a[1] ? b : a
        )[0];

        let [r, g, b] = dominant.split(",").map(Number);

        // --- Lighten or darken based on theme ---
        const adjustFactor = isDark ? 0.7 : 1.3; // < 1 darkens, > 1 lightens
        r = Math.min(255, Math.max(0, Math.round(r * adjustFactor)));
        g = Math.min(255, Math.max(0, Math.round(g * adjustFactor)));
        b = Math.min(255, Math.max(0, Math.round(b * adjustFactor)));

        const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b)
            .toString(16)
            .slice(1)}`;

        callback({ r, g, b, hex });
    };
}

export default function useDarkMode() {
    const [backgroundImage, setBackgroundImageState] = useState(null);
    const [isDark, setIsDark] = usePersistentState("isDark", null);
    const [blurMode, setBlurMode] = useState(() => getPersistentValue(BLUR_MODE_KEY) || "on");
    const [bgMainColor, setBgMainColor] = usePersistentState("user-bg-main-color", null);

    const getInitialTheme = () => {
        const stored = getPersistentValue(THEME_KEY);
        if (["light", "dark", "background"].includes(stored)) return stored;
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    };

    const [theme, setThemeState] = useState(getInitialTheme);
    const [lightVariant, setLightVariantState] = useState(() =>
        getPersistentValue(LIGHT_VARIANT_KEY) ?? THEME_VARIANTS.light[0]
    );
    const [darkVariant, setDarkVariantState] = useState(() =>
        getPersistentValue(DARK_VARIANT_KEY) ?? THEME_VARIANTS.dark[0]
    );
    const [backgroundVariant, setBackgroundVariantState] = useState(() =>
        getPersistentValue(BACKGROUND_KEY) ?? THEME_VARIANTS.background[0]
    );

    const currentVariant =
        theme === "background"
            ? backgroundVariant
            : theme === "dark"
                ? darkVariant
                : lightVariant;

    const setTheme = (value) => {
        setPersistentValue(USER_HAS_SELECTED, "true");
        setPersistentValue(THEME_KEY, value);
        setThemeState(value);
    };

    const setVariant = (value) => {
        if (theme === "background") {
            setPersistentValue(BACKGROUND_KEY, value);
            setBackgroundVariantState(value);
        } else if (theme === "dark") {
            setPersistentValue(DARK_VARIANT_KEY, value);
            setDarkVariantState(value);
        } else {
            setPersistentValue(LIGHT_VARIANT_KEY, value);
            setLightVariantState(value);
        }
    };

    useLayoutEffect(() => {
        const root = document.documentElement;
        root.classList.remove(
            ...THEME_VARIANTS.light,
            ...THEME_VARIANTS.dark,
            ...THEME_VARIANTS.background
        );
        root.classList.add(currentVariant);

        const blurMode = getPersistentValue(BLUR_MODE_KEY);
        if (blurMode === "off") {
            root.classList.add("blur-off");
        } else {
            root.classList.remove("blur-off");
        }

        root.dataset.themeLocked = "true";
        root.dataset.themeLoaded = "true";
    }, [currentVariant]);

    useEffect(() => {
        if (!bgMainColor && backgroundImage) {
            getImageMainColor(backgroundImage, (color) => {
                const root = document.documentElement;
                root.style.setProperty("--bg-main-color", color.hex);
                setBgMainColor(color.hex);
            }, isDark);
        } else if (bgMainColor) {
            document.documentElement.style.setProperty("--bg-main-color", bgMainColor);
        }
    }, [backgroundImage, bgMainColor, isDark, setBgMainColor]);

    useEffect(() => {
        if (theme === "background") return;

        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        const update = () => setTheme(mq.matches ? "dark" : "light");
        mq.addEventListener("change", update);

        return () => mq.removeEventListener("change", update);
    }, [theme]);

    useEffect(() => {
        let skipNextFocus = false;

        const applyActiveBackground = async () => {
            if (skipNextFocus) {
                skipNextFocus = false;
                return;
            }

            const activeKey = getPersistentValue('activeBgKey');
            let url = backgroundImageUrl; // default background fallback

            if (activeKey) {
                const blob = await loadImage(activeKey);
                if (blob) {
                    url = URL.createObjectURL(blob);
                }
            }

            setBackgroundImageState(url);

            const root = document.documentElement;
            root.style.backgroundImage = `url(${url})`;
            root.style.backgroundSize = 'cover';
            root.style.backgroundPosition = 'center';
            root.style.backgroundAttachment = 'fixed';
            root.style.backgroundRepeat = 'no-repeat';
        };

        applyActiveBackground();

        const onFocus = () => applyActiveBackground();
        const onPopState = () => applyActiveBackground();
        const onHashChange = () => applyActiveBackground();

        window.addEventListener('focus', onFocus);
        window.addEventListener('popstate', onPopState);
        window.addEventListener('hashchange', onHashChange);

        const originalClick = HTMLInputElement.prototype.click;
        HTMLInputElement.prototype.click = function (...args) {
            if (this.type === 'file') skipNextFocus = true;
            return originalClick.apply(this, args);
        };

        return () => {
            window.removeEventListener('focus', onFocus);
            window.removeEventListener('popstate', onPopState);
            window.removeEventListener('hashchange', onHashChange);
            HTMLInputElement.prototype.click = originalClick;
        };
    }, []);

    const setDarkVariant = (value) => {
        setPersistentValue(DARK_VARIANT_KEY, value);
        setDarkVariantState(value);
        if (isDark) setTheme("dark");
        if (theme === "dark") {
            const root = document.documentElement;
            root.classList.remove(
                ...THEME_VARIANTS.light,
                ...THEME_VARIANTS.dark,
                ...THEME_VARIANTS.background
            );
            root.classList.add(value);
        }
    };

    const setLightVariant = (value) => {
        setPersistentValue(LIGHT_VARIANT_KEY, value);
        setLightVariantState(value);
        if (!isDark) setTheme("light");
        if (theme === "light") {
            const root = document.documentElement;
            root.classList.remove(
                ...THEME_VARIANTS.light,
                ...THEME_VARIANTS.dark,
                ...THEME_VARIANTS.background
            );
            root.classList.add(value);
        }
    };

    const setBackgroundVariant = (value) => {
        if (theme === "background") {
            setTheme(getPersistentValue("user-previous-theme"));
            return;
        }
        setPersistentValue(BACKGROUND_KEY, value);
        setBackgroundVariantState(value);
        setPersistentValue("user-previous-theme", theme);
        setTheme("background");

        const root = document.documentElement;
        root.classList.remove(
            ...THEME_VARIANTS.light,
            ...THEME_VARIANTS.dark,
            ...THEME_VARIANTS.background
        );
        root.classList.add(value);
    };

    const setBackgroundImage = async (file) => {
        try {
            const blob = file instanceof Blob ? file : await (await fetch(file)).blob();
            const cacheKey = `user-upload-bg:${file.name || "custom"}`;
            await saveImage(cacheKey, blob);
            setPersistentValue("activeBgKey", cacheKey);

            const url = URL.createObjectURL(blob);
            setBackgroundImageState(url);

            const root = document.documentElement;

            // Preload and decode the image before transition
            const img = new Image();
            img.src = url;
            await img.decode();

            const fade = document.createElement("div");
            Object.assign(fade.style, {
                position: "fixed",
                top: "0",
                left: "0",
                width: "100%",
                height: "100%",
                zIndex: "0",
                pointerEvents: "none",
                backgroundImage: `url(${url})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundAttachment: "fixed",
                backgroundRepeat: "no-repeat",
                opacity: "0",
                transition: "opacity 0.8s ease-in-out",
                willChange: "opacity",
            });

            document.body.prepend(fade);

            requestAnimationFrame(() => {
                fade.style.opacity = "1";
            });

            setTimeout(() => {
                root.style.backgroundImage = `url(${url})`;
                fade.remove();
            }, 800);

            getImageBrightness(url, (b) => setIsDark(b < 130));

            getImageMainColor(url, (color) => {
                const root = document.documentElement;
                root.style.setProperty("--bg-main-color", color.hex);
                setBgMainColor(color.hex);
            }, isDark);
        } catch (err) {
            console.warn("⚠️ Failed to set custom background:", err);
        }
    };

    useEffect(() => {
        const activeKey = getPersistentValue('activeBgKey');
        if (activeKey && activeKey.startsWith('user-upload-bg:')) {
            (async () => {
                const blob = await loadImage(activeKey);
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    setBackgroundImageState(url);
                    const root = document.documentElement;
                    root.style.backgroundImage = `url(${url})`;
                    root.style.backgroundSize = 'cover';
                    root.style.backgroundPosition = 'center';
                    root.style.backgroundAttachment = 'fixed';
                    root.style.backgroundRepeat = 'no-repeat';
                }
            })();
        }
    }, []);

    const toggleBlurMode = () => {
        const newMode = blurMode === "on" ? "off" : "on";
        setBlurMode(newMode);
        setPersistentValue(BLUR_MODE_KEY, newMode);
        document.documentElement.classList.toggle("blur-off", newMode === "off");
    };

    return {
        theme,
        setTheme,
        variant: currentVariant,
        setVariant,
        variants: THEME_VARIANTS,
        lightVariant,
        darkVariant,
        backgroundVariant,
        setLightVariant,
        setDarkVariant,
        setBackgroundVariant,
        isDark: theme === "background" ? isDark : theme === "dark",
        effectiveTheme: currentVariant,
        setBackgroundImage,
        backgroundImage,
        toggleBlurMode,
        blurMode
    };
}
