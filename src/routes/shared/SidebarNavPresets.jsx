import React from 'react';
import { HelpCircle, History, Info, Moon, Settings, Sparkle, Sun } from 'lucide-react';

function SidebarButton({ icon: Icon, label, onClick, active = false, iconClassName = '' }) {
    return (
        <button
            type="button"
            className={`sidebar-button ${active ? 'active' : ''}`}
            onClick={onClick}
            aria-current={active ? 'page' : undefined}
        >
            <div className="icon-slot">
                <Icon size={24} className={iconClassName} stroke="currentColor" />
            </div>
            <div className="label-slot">
                <span className="label-text">{label}</span>
            </div>
        </button>
    );
}

function ThemeToggleButton({ theme, isDark, onToggleTheme }) {
    if (theme === 'background') return null;

    return (
        <button type="button" className="sidebar-button" onClick={onToggleTheme}>
            <div className="icon-slot theme-toggle-icon">
                <Sun className="icon-sun" size={24} />
                <Moon className="icon-moon" size={24} />
            </div>
            <div className="label-slot">
                <span className="label-text">{!isDark ? 'Dawn' : 'Dusk'}</span>
            </div>
        </button>
    );
}

export function HomeSidebar({ navigate, theme, isDark, onToggleTheme }) {
    return (
        <>
            <SidebarButton icon={Sparkle} label="Home" onClick={() => navigate('/')} />
            <SidebarButton icon={Settings} label="Settings" onClick={() => navigate('/settings')} iconClassName="settings-icon" />
            <SidebarButton icon={Info} label="Info" onClick={() => navigate('/info')} />
            <SidebarButton icon={HelpCircle} label="Guides" onClick={() => navigate('/guides')} iconClassName="help-icon" />
            <SidebarButton icon={History} label="Changelog" onClick={() => navigate('/changelog')} iconClassName="changelog-icon" />
            <ThemeToggleButton theme={theme} isDark={isDark} onToggleTheme={onToggleTheme} />
        </>
    );
}

export function LegalSidebar({ navigate, theme, isDark, onToggleTheme }) {
    return (
        <>
            <SidebarButton icon={Sparkle} label="Home" onClick={() => navigate('/')} />
            <SidebarButton icon={Info} label="Info" onClick={() => navigate('/info')} />
            <SidebarButton icon={Info} label="Privacy Policy" onClick={() => navigate('/privacy')} />
            <SidebarButton icon={History} label="Terms of Service" onClick={() => navigate('/terms')} />
            <ThemeToggleButton theme={theme} isDark={isDark} onToggleTheme={onToggleTheme} />
        </>
    );
}

export function InfoHubSidebar({ current, navigate, theme, isDark, onToggleTheme }) {
    return (
        <>
            <SidebarButton icon={Sparkle} label="Home" onClick={() => navigate('/')} />
            <SidebarButton icon={Info} label="Info" onClick={() => navigate('/info')} active={current === 'info'} />
            <SidebarButton
                icon={HelpCircle}
                label="Guides"
                onClick={() => navigate('/guides')}
                active={current === 'guides'}
                iconClassName="help-icon"
            />
            <SidebarButton
                icon={History}
                label="Changelog"
                onClick={() => navigate('/changelog')}
                active={current === 'changelog'}
                iconClassName="changelog-icon"
            />
            <SidebarButton icon={Settings} label="Settings" onClick={() => navigate('/settings')} iconClassName="settings-icon" />
            <ThemeToggleButton theme={theme} isDark={isDark} onToggleTheme={onToggleTheme} />
        </>
    );
}
