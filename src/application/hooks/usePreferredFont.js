import { useEffect } from 'react';
import { usePersistentState } from '@shared/hooks/usePersistentState.js';

const SYSTEM_UI_STACK = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif';
const DEFAULT_FONT = "'Onest', sans-serif";

export function usePreferredFont() {
    const [selectedFont] = usePersistentState('userBodyFontName', 'Onest');
    const [fontLink] = usePersistentState('userBodyFontURL', '');

    useEffect(() => {
        if (selectedFont === 'System UI') {
            document.documentElement.style.setProperty('--body-font', SYSTEM_UI_STACK);
            document.documentElement.style.setProperty('--preview-font', SYSTEM_UI_STACK);
            return;
        }

        if (fontLink && fontLink.includes('fonts.googleapis.com')) {
            const existingLink = document.querySelector(`link[href="${fontLink}"]`);
            if (!existingLink) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = fontLink;
                document.head.appendChild(link);
            }
        }

        if (selectedFont) {
            document.documentElement.style.setProperty('--body-font', `'${selectedFont}', sans-serif`);
            document.documentElement.style.setProperty('--preview-font', `'${selectedFont}', sans-serif`);
            return;
        }

        document.documentElement.style.setProperty('--body-font', DEFAULT_FONT);
        document.documentElement.style.setProperty('--preview-font', DEFAULT_FONT);
    }, [selectedFont, fontLink]);
}
