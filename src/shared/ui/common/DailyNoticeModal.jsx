import React from 'react';

export default function DailyNoticeModal({
    open,
    title = 'NOTICE',
    message = 'Placeholder notice text. Replace this copy with the actual message later.',
    confirmLabel = 'DIDN\'T ASK!',
    onConfirm,
}) {
    if (!open) return null;

    return (
        <div className="skills-modal-overlay" role="presentation">
            <div
                className="skills-modal-content changelog-modal guides"
                role="dialog"
                aria-modal="true"
                aria-labelledby="daily-notice-modal-title"
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: '560px', width: 'min(560px, calc(100vw - 2rem))' }}
            >
                <h3 id="daily-notice-modal-title" style={{ marginBottom: '0.75rem' }}>
                    {title}
                </h3>

                <div style={{ marginTop: 0, marginBottom: '1.25rem', lineHeight: 1.6 }}>
                    {message}
                </div>

                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        className="edit-substat-button btn-primary echoes btn-confirm"
                        onClick={onConfirm}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
