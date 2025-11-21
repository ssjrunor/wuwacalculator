import React, { useEffect, useRef, useState } from 'react';
import useDarkMode from "../../hooks/useDarkMode.js";
import {getCuteMessage} from "./cuteMessages.jsx";

export default function NotificationToast({
                                              message = 'Yo!',
                                              icon = '',
                                              duration = 3000,
                                              onClose,
                                              color,
                                              position = 'top',
                                              overlay = false,
                                              prompt = null,
                                              borderColor = 'black'
                                          }) {
    const { isDark } = useDarkMode();

    const toastRef = useRef(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        setVisible(true);

        const hideTimer = setTimeout(() => setVisible(false), duration - 300);
        const closeTimer = setTimeout(onClose, duration);

        return () => {
            clearTimeout(hideTimer);
            clearTimeout(closeTimer);
        };
    }, [duration, onClose]);

    useEffect(() => {
        function handleClickOutside(e) {
            if (toastRef.current && !toastRef.current.contains(e.target)) {
                closeWithAnimation();
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    });

    const closeWithAnimation = () => {
        if (!visible) return;
        setVisible(false);
        setTimeout(() => onClose?.(), 300);
    };

    const positionClasses = {
        'top-left': 'top-left',
        'top-right': 'top-right',
        'bottom-left': 'bottom-left',
        'bottom-right': 'bottom-right',
        top: 'top-center',
        bottom: 'bottom-center',
    };
    const posClass = positionClasses[position] || 'bottom-center';

    const handlePromptClick = () => {
        closeWithAnimation();
        prompt?.action?.();
    };

    return (
        <>
            {overlay && (
                <div
                    className={`notification-overlay ${visible ? 'show' : 'hide'}`}
                    onClick={closeWithAnimation}
                />
            )}

            <div
                ref={toastRef}
                className={`notification-toast ${visible ? 'show' : 'hide'} ${posClass}`}
                style={{
                    color: color
                        ? color.light
                            ? isDark
                                ? color.dark
                                : color.light
                            : color
                        : 'white',
                    cursor: prompt?.action ? 'pointer' : 'unset',
                    '--slider-color': borderColor,
                }}
                onClick={prompt?.action ? handlePromptClick : undefined}
            >
                <div className="notification-main">
                    <div className="notification-icon">{icon}</div>
                    <div
                        className="notification-text"
                        dangerouslySetInnerHTML={{ __html: message }}
                    />
                </div>

                {prompt?.message && (
                    <span
                        className={`notification-prompt ${prompt.action ? 'clickable' : ''}`}
                    >
                        {prompt.message}
                    </span>
                )}
            </div>
        </>
    );
}