import React, { useEffect, useRef, useState } from 'react';
import { guides } from '../data/guides.js';
import { useNavigate } from 'react-router-dom';

export default function GuidesModal({ open, category, onClose, shouldScroll = false }) {
    if (!open) return null;

    const navigate = useNavigate();
    const guideRef = useRef(null);
    const [isClosing, setIsClosing] = useState(false);
    const [activeCategory, setActiveCategory] = useState(
        Array.isArray(category) ? category[0] : category
    );

    // Find selected guide data
    const selected = guides.find(g => g.category === activeCategory);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
            setIsClosing(false);
        }, 300);
    };

    useEffect(() => {
        if (open && shouldScroll && guideRef.current) {
            guideRef.current.scrollTop = guideRef.current.scrollHeight;
        }
    }, [open, shouldScroll]);

    return (
        <div
            className={`skills-modal-overlay ${isClosing ? 'closing' : ''}`}
            onClick={handleClose}
        >
            <div
                className={`skills-modal-content changelog-modal guides ${isClosing ? 'closing' : ''}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.5rem'
                    }}
                >
                    {Array.isArray(category) && category.length > 1 ? (
                        <div
                            className="rotation-view-toggle"
                            style={{ marginTop: '0.5rem', marginBottom: '0' }}
                        >
                            {category.map((cat) => (
                                <div
                                    key={cat}
                                    className={`view-toggle-button ${activeCategory === cat ? 'active' : ''}`}
                                    onClick={() => setActiveCategory(cat)}
                                >
                                    {cat}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <h2
                            className="section-title"
                            style={{
                                margin: '0.5rem 0 0 0',
                                display: 'flex',
                                alignSelf: 'center'
                            }}
                        >
                            {selected ? selected.category : 'Guide Not Found'}
                        </h2>
                    )}
                </div>

                <div className="changelog-entries main-echo-description guides" ref={guideRef}>
                    {!selected && (
                        <p>No guide found for <strong>{activeCategory}</strong>.</p>
                    )}

                    {selected && selected.guides.map((guide, index) => (
                        <div key={index} className="changelog-block">
                            <h3 className="changelog-date">{guide.title}</h3>
                            <p
                                className="guide-short"
                                dangerouslySetInnerHTML={{ __html: guide.shortDesc }}
                            />
                            <div
                                className="changelog-entries-content"
                                dangerouslySetInnerHTML={{
                                    __html: guide.content.replace(
                                        /<strong>(.*?)<\/strong>/g,
                                        '<span class="highlight">$1</span>'
                                    ),
                                }}
                            />
                        </div>
                    ))}
                </div>

                <div className="modal-footer" style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="edit-substat-button btn-primary echoes" onClick={handleClose}>
                        Close
                    </button>
                    {selected && (
                        <button
                            className="edit-substat-button btn-primary echoes"
                            onClick={() => {
                                handleClose();
                                navigate(`/guides?category=${encodeURIComponent(activeCategory)}`);
                            }}
                        >
                            View Full {activeCategory} Guide
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}