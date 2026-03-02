import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useDarkMode from '@shared/hooks/useDarkMode.js';
import { guides } from '@/features/guides/model/guidesContent.js';
import { RouteLayout } from '@routes/shared/RouteChrome.jsx';
import { useResponsiveSidebar } from '@routes/shared/useResponsiveSidebar.js';
import { InfoHubSidebar } from '@routes/shared/SidebarNavPresets.jsx';

function GuideEntry({ guide, isOpen }) {
    const contentRef = useRef(null);
    const [height, setHeight] = useState('0px');

    useEffect(() => {
        if (isOpen && contentRef.current) {
            setHeight(`${contentRef.current.scrollHeight}px`);
        } else {
            setHeight('0px');
        }
    }, [isOpen, guide.content]);

    return (
        <div className="guide-entry">
            <h3 className="guide-title" style={{ margin: 'unset' }}>
                {guide.title}
            </h3>
            <p className="guide-short" style={{ marginBottom: '1rem' }}>
                {guide.shortDesc}
            </p>

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
                    onClick={(event) => event.stopPropagation()}
                    dangerouslySetInnerHTML={{
                        __html: guide.content.replace(
                            /<strong>(.*?)<\/strong>/g,
                            '<span class="highlight">$1</span>',
                        ),
                    }}
                />
            </div>
        </div>
    );
}

function GuideSection({ section, isOpen, onToggle }) {
    return (
        <div
            className="info-section echo-buff guides"
            data-category={section.category}
            style={{ marginBottom: '2rem' }}
            onClick={onToggle}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <h2 className="section-title">{section.category}</h2>
                <button className="toggle-effect-button guides" style={{ margin: 'unset' }}>
                    {isOpen ? 'Read Less' : 'Read More'}
                </button>
            </div>

            {section.guides.map((guide, index) => (
                <GuideEntry
                    key={`${section.category}-${index}`}
                    guide={guide}
                    isOpen={isOpen}
                />
            ))}
        </div>
    );
}

export default function GuidesRoute() {
    const navigate = useNavigate();
    const location = useLocation();
    const { theme, setTheme, isDark } = useDarkMode();
    const {
        hamburgerOpen,
        setHamburgerOpen,
        isMobile,
        isOverlayVisible,
        isOverlayClosing,
    } = useResponsiveSidebar();

    const [openSections, setOpenSections] = useState({});

    const toggleTheme = () => {
        const nextTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(nextTheme);
    };

    const toggleSection = (category, forceOpen = null) => {
        setOpenSections((previous) => {
            const isOpen = previous[category];
            return {
                ...previous,
                [category]: forceOpen !== null ? forceOpen : !isOpen,
            };
        });
    };

    const sectionMap = useMemo(() => {
        return guides.reduce((accumulator, section) => {
            accumulator[section.category] = section;
            return accumulator;
        }, {});
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const queryCategory = params.get('category');
        const hashCategory = location.hash?.replace('#', '');
        const category = queryCategory || hashCategory;
        if (!category || !sectionMap[category]) return;

        const tryScroll = (attempts = 0) => {
            const target = document.querySelector(`[data-category="${category}"]`);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                setTimeout(() => {
                    toggleSection(category, true);
                }, 400);

                const url = new URL(window.location.href);
                url.searchParams.delete('category');
                window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
                return;
            }

            if (attempts < 10) {
                setTimeout(() => tryScroll(attempts + 1), 100);
            }
        };

        tryScroll();
    }, [location, sectionMap]);

    return (
        <RouteLayout
            isDark={isDark}
            hamburgerOpen={hamburgerOpen}
            setHamburgerOpen={setHamburgerOpen}
            isMobile={isMobile}
            isOverlayVisible={isOverlayVisible}
            isOverlayClosing={isOverlayClosing}
            sidebar={
                <InfoHubSidebar
                    current="guides"
                    navigate={navigate}
                    theme={theme}
                    isDark={isDark}
                    onToggleTheme={toggleTheme}
                />
            }
        >
            <div
                className="main-content info-page"
                style={{
                    padding: '2rem',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <header
                    className="legal-header"
                    style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', maxWidth: '100ch' }}
                >
                    <h1>Guides</h1>
                </header>

                {guides.map((section, index) => {
                    const isOpen = Boolean(openSections[section.category]);
                    return (
                        <GuideSection
                            key={`${section.category}-${index}`}
                            section={section}
                            isOpen={isOpen}
                            onToggle={() => toggleSection(section.category)}
                        />
                    );
                })}
            </div>
        </RouteLayout>
    );
}
