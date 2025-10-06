import React, { useEffect } from 'react';

export default function NotificationToast({
                                              message = 'Yo!',
                                              icon = '',
                                              duration = 2500,
                                              onClose,
                                              color,
                                              position = 'top',
                                              bold = false,
                                              overlay = false,
                                          }) {
    useEffect(() => {
        if (duration && onClose) {
            const timer = setTimeout(onClose, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    const positionClasses = {
        'top-left': 'top-left',
        'top-right': 'top-right',
        'bottom-left': 'bottom-left',
        'bottom-right': 'bottom-right',
        'top': 'top-center',
        'bottom': 'bottom-center',
    };

    const posClass = positionClasses[position] || 'bottom-center';

    return (
        <>
            {overlay && <div className="notification-overlay" />}
            <div className={`notification-toast ${posClass}`}
                 style={{
                     color: color || 'white',
                     fontWeight: bold ? 'bold' : 'normal',
                 }}>
                <span className="notification-icon">{icon}</span>
                <span className="notification-text">{message}</span>
            </div>
        </>
    );
}