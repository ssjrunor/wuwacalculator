import React, { useState } from 'react';
import { setPersistentValue } from '@shared/hooks/usePersistentState.js';

export default function CookieNotice({ onClose }) {
    const [closing, setClosing] = useState(false);

    const handleClose = () => {
        try {
            setPersistentValue('cookieNoticeDismissed', 'true');
        } catch (error) {
            console.warn('Failed to save cookie notice dismissal:', error);
        }
        setClosing(true);
        setTimeout(() => onClose?.(), 400);
    };

    return (
        <div className={`cookie-notice ${closing ? 'slide-out' : 'slide-in'}`} role="region" aria-label="Cookie notice">
          <span>
            This site uses cookies to analyze traffic via Google Analytics.
            No personal information is shared.{` `}
              <a href="/privacy" target="_blank" rel="noopener noreferrer">
              Learn more
            </a>.
          </span>

            <button className="cookie-close-btn" onClick={handleClose} aria-label="Close cookie notice">
                Close
            </button>
        </div>
    );
}
