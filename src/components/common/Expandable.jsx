import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function ExpandableSection({ title, children, defaultOpen = false, className='' }) {
    const [open, setOpen] = useState(defaultOpen);
    const [height, setHeight] = useState(0);
    const contentRef = useRef(null);

    useEffect(() => {
        if (open && contentRef.current) {
            setHeight(contentRef.current.scrollHeight);
        } else {
            setHeight(0);
        }
    }, [open, children]);

    const [isClosing, setIsClosing] = useState(false);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsClosing(false);
        }, 250);
    };

    return (
        <div className={`buffs-box ${className}`}>
            <div
                 className="expandable-header"
                 style={{
                     padding: !open && !isClosing ? '0' : undefined,
                 }}
                 onClick={() => {
                     setOpen(prev => !prev)
                     handleClose();
                 }}
            >
                <span className="section-title">{title}</span>
                {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>

            <div
                className="expandable-body-wrapper"
                style={{
                    maxHeight: `${height}px`,
                    overflow: 'hidden',
                    transition: 'max-height 0.3s ease',
                }}
            >
                <div ref={contentRef} className="expandable-body">
                    {children}
                </div>
            </div>
        </div>
    );
}

export function ExpandableEchoSection({ echo, children, defaultOpen = false, imageCache, setIconMap }) {
    const [open, setOpen] = useState(defaultOpen);
    const [height, setHeight] = useState(0);
    const contentRef = useRef(null);

    useEffect(() => {
        if (open && contentRef.current) {
            setHeight(contentRef.current.scrollHeight);
        } else {
            setHeight(0);
        }
    }, [open, children]);

    const echoImage = imageCache[echo.icon]?.src || echo.icon;
    const setIcon = setIconMap[echo.selectedSet];

    const [isClosing, setIsClosing] = useState(false);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsClosing(false);
        }, 250);
    };

    return (
        <div className="buffs-box echo-section">
            <div
                className="expandable-header echo"
                style={{
                    padding: !open && !isClosing ? '0' : undefined,
                }}
                onClick={() => {
                    setOpen(prev => !prev)
                    handleClose();
                }}
            >
                <div className="echo-header-content">
                    <img
                        src={echoImage}
                        alt={echo.name}
                        className="echo-header-icon"
                        onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = '/assets/echoes/default.webp';
                        }}
                    />

                    {setIcon && (
                        <img
                            src={setIcon}
                            alt={`Set ${echo.selectedSet}`}
                            className="echo-set-icon-small"
                        />
                    )}

                    <span className="echo-slot-cost-badge bag expandable">{echo.cost}</span>
                    <span
                        className="echo-name"
                        style={{margin: '0'}}
                    >
                        {echo.name}
                    </span>
                </div>

                {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>

            <div
                className="expandable-body-wrapper"
                style={{
                    maxHeight: `${height}px`,
                    overflow: 'hidden',
                    transition: 'max-height 0.3s ease',
                }}
            >
                <div ref={contentRef} className="expandable-body">
                    {children}
                </div>
            </div>
        </div>
    );
}