import { useEffect, useState } from 'react';

function getInitialMobileState(defaultWidth) {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < defaultWidth;
}

export function useResponsiveSidebar({ mobileBreakpoint = 1070, defaultWidth = 700, closeDelayMs = 400 } = {}) {
    const [hamburgerOpen, setHamburgerOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(() => getInitialMobileState(defaultWidth));
    const [isOverlayVisible, setIsOverlayVisible] = useState(false);
    const [isOverlayClosing, setIsOverlayClosing] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;

        const handleResize = () => {
            setIsMobile(window.innerWidth < mobileBreakpoint);
        };

        handleResize();
        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
    }, [mobileBreakpoint]);

    useEffect(() => {
        if (isMobile) {
            setHamburgerOpen(false);
        }
    }, [isMobile]);

    useEffect(() => {
        let timeoutId;

        if (hamburgerOpen) {
            setIsOverlayVisible(true);
            setIsOverlayClosing(false);
        } else {
            setIsOverlayClosing(true);
            timeoutId = setTimeout(() => {
                setIsOverlayVisible(false);
                setIsOverlayClosing(false);
            }, closeDelayMs);
        }

        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [hamburgerOpen, closeDelayMs]);

    return {
        hamburgerOpen,
        setHamburgerOpen,
        isMobile,
        isOverlayVisible,
        isOverlayClosing,
    };
}
