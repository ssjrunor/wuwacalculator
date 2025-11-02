import React, {useRef, useState} from 'react';

export default function PlainModal({ modalOpen, setModalOpen, children, height = null, width = null }) {
    if (!modalOpen) return null;

    const [isClosing, setIsClosing] = useState(false);
    const contentRef = useRef(null);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setModalOpen(false);
            setIsClosing(false);
        }, 300);
    };

    return (
        <div className={`skills-modal-overlay ${isClosing ? 'closing' : ''}`} onClick={handleClose}>
            <div
                className={`skills-modal-content ${isClosing ? 'closing' : ''}`}
                onClick={(e) => e.stopPropagation()}
                ref={contentRef}
            >
                {children}
            </div>
        </div>
    );
}