import React, { useState } from 'react';

export default function DropdownSelect({
                                           label,
                                           options,
                                           value,
                                           onChange,
                                           disabled = false,
                                           className = '',
                                           width = '80px',
                                           locked = false,
    text = ''
                                       }) {
    const [isOpen, setIsOpen] = useState(false);
    const normalizedOptions = (options ?? []).map((opt) => {
        if (typeof opt === 'object') {
            return { label: opt.label ?? opt.value, value: opt.value };
        }
        return { label: opt, value: opt };
    });
    const stringValue = value === undefined || value === null ? '' : String(value);

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
                    value={stringValue}
                    onChange={(e) => {
                        const selected = normalizedOptions.find(
                            (opt) => String(opt.value ?? '') === e.target.value
                        );
                        onChange(selected?.value ?? e.target.value);
                    }}
                    onFocus={() => setIsOpen(true)}
                    onBlur={() => setIsOpen(false)}
                    disabled={disabled}
                    style={{
                        cursor: !disabled ? 'pointer' : 'not-allowed'
                    }}
                >
                    {normalizedOptions.map((opt) => (
                        <option key={String(opt.value ?? opt.label)} value={String(opt.value ?? '')}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                <span className="dropdown-arrow">▼</span>
            </div>
            { locked && (
                <span style={{ fontSize: '12px', color: 'gray' }}>
                                {text}
                            </span>
            )}

        </div>
    );
}
