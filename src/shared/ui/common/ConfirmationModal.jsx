import React, { useState, useEffect } from 'react';

export default function ConfirmationModal({
                                              open,
                                              title = 'Are you sure about this? (゜-゜)',
                                              message = 'This action cannot be undone...',
                                              confirmLabel = 'Confirm',
                                              cancelLabel = 'Nevermind',
                                              onConfirm,
                                              onCancel,
                                              onClose,
                                              currentSliderColor = '#7bf'
                                          }) {
    if (!open && !isClosing) return null;

    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        if (open) setIsClosing(false);
    }, [open]);


    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose?.();
            setIsClosing(false);
        }, 300);
    };

    const handleConfirm = () => {
        onConfirm?.();
        handleClose();
    };

    const handleCancel = () => {
        onCancel?.();
        handleClose();
    };

    return (
        <div
            className={`skills-modal-overlay ${isClosing ? 'closing' : ''}`}
            onClick={handleClose}
        >
            <div
                className={`skills-modal-content changelog-modal guides confirm ${isClosing ? 'closing' : ''}`}
                onClick={(e) => e.stopPropagation()}
            >
                <h3 style={{ marginBottom: 'unset' }}>{title}</h3>
                <h4
                    style={{
                        '--slider-color': currentSliderColor,
                    }}
                    dangerouslySetInnerHTML={{ __html: message }} />

                <div className="modal-footer" style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        className="edit-substat-button btn-primary echoes btn-cancel"
                        onClick={handleCancel}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        className="edit-substat-button btn-primary echoes btn-confirm"
                        onClick={handleConfirm}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}