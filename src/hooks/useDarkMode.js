import { useEffect, useLayoutEffect, useState } from "react";
import { getPersistentValue, setPersistentValue } from "./usePersistentState.js";

const THEME_KEY = "user-theme";
const LIGHT_VARIANT_KEY = "user-light-variant";
const DARK_VARIANT_KEY = "user-dark-variant";
const USER_HAS_SELECTED = "user-has-selected-theme";

const THEME_VARIANTS = {
    light: ["light", "pastel-pink", "pastel-blue", "vibrant-citrus", "glassy-rainbow"],
    dark: ["dark", "dark-alt", "cosmic-rainbow", "scarlet-nebula"],
};

export default function useDarkMode() {
    // --- helpers ---
    const getInitialTheme = () => {
        const stored = getPersistentValue(THEME_KEY);
        if (stored === "light" || stored === "dark") return stored;
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    };

    const getInitialVariant = (key, family) => {
        const stored = getPersistentValue(key);
        const valid = THEME_VARIANTS[family];
        return valid.includes(stored) ? stored : valid[0];
    };

    // --- state ---
    const [theme, setThemeState] = useState(getInitialTheme);
    const [lightVariant, setLightVariantState] = useState(() =>
        getInitialVariant(LIGHT_VARIANT_KEY, "light")
    );
    const [darkVariant, setDarkVariantState] = useState(() =>
        getInitialVariant(DARK_VARIANT_KEY, "dark")
    );

    // --- derived variant based on current theme ---
    const currentVariant = theme === "dark" ? darkVariant : lightVariant;

    // --- setters ---
    const setTheme = (value) => {
        setPersistentValue(USER_HAS_SELECTED, "true");
        setPersistentValue(THEME_KEY, value);
        setThemeState(value);
    };

    const setVariant = (value) => {
        if (theme === "dark") {
            setPersistentValue(DARK_VARIANT_KEY, value);
            setDarkVariantState(value);
        } else {
            setPersistentValue(LIGHT_VARIANT_KEY, value);
            setLightVariantState(value);
        }
    };

    // --- apply class to document ---
    useLayoutEffect(() => {
        const root = document.documentElement;
        const allClasses = [...THEME_VARIANTS.light, ...THEME_VARIANTS.dark];
        root.classList.remove(...allClasses);
        root.classList.add(currentVariant);
    }, [currentVariant]);

    // --- sync with system preference ---
    useEffect(() => {
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const handleSystemChange = () => {
            const systemTheme = mediaQuery.matches ? "dark" : "light";
            setTheme(systemTheme);
        };
        mediaQuery.addEventListener("change", handleSystemChange);
        return () => mediaQuery.removeEventListener("change", handleSystemChange);
    }, []);

    return {
        theme,
        setTheme,
        variant: currentVariant,
        setVariant,
        variants: THEME_VARIANTS,
        lightVariant,
        darkVariant,
        setLightVariant: (value) => {
            setPersistentValue(LIGHT_VARIANT_KEY, value);
            setLightVariantState(value);
            if (theme === "light") {
                const root = document.documentElement;
                const allClasses = [...THEME_VARIANTS.light, ...THEME_VARIANTS.dark];
                root.classList.remove(...allClasses);
                root.classList.add(value);
            }
        },
        setDarkVariant: (value) => {
            setPersistentValue(DARK_VARIANT_KEY, value);
            setDarkVariantState(value);
            if (theme === "dark") {
                const root = document.documentElement;
                const allClasses = [...THEME_VARIANTS.light, ...THEME_VARIANTS.dark];
                root.classList.remove(...allClasses);
                root.classList.add(value);
            }
        },
        isDark: theme === "dark",
        effectiveTheme: currentVariant,
    };
}