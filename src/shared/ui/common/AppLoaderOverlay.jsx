import React from "react";

export default function AppLoaderOverlay({
    text = "Loading...",
    className = "",
    contentClassName = "",
}) {
    return (
        <div
            className={`app-loader-overlay ${className}`.trim()}
            aria-live="polite"
            aria-busy="true"
        >
            <div className={`app-loader-content ${contentClassName}`.trim()}>
                <div className="app-loader-spinner" />
                <span className="app-loader-text">{text}</span>
            </div>
        </div>
    );
}
