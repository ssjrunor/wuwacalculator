import React, { useState } from 'react';

export default function DropdownSelect({
                                           label,
                                           options,
                                           value,
                                           onChange,
                                           disabled = false,
                                           className = '',
                                           width = '60px'
                                       }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div
            className={`dropdown-select-wrapper ${className}`}
            style={{
                opacity: disabled ? 0.5 : 1,
                cursor: !disabled ? 'pointer' : 'not-allowed',
                width,
            }}
        >
            {label && <label className="dropdown-label">{label}</label>}
            <div className="select-container">
                <select
                    className="custom-select small"
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    onFocus={() => setIsOpen(true)}
                    onBlur={() => setIsOpen(false)}
                    disabled={disabled}
                    style={{
                        cursor: !disabled ? 'pointer' : 'not-allowed'
                    }}
                >
                    {options.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
                <span className="dropdown-arrow">▼</span>
            </div>
        </div>
    );
}