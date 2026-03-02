import React from 'react';

export default function DataBackupSelector({
    dataBackUpOption = new Set(),
    setDataBackUpOption,
    onChange,
    downloadSelectedBackups,
    dataOptions = [],
}) {
    const toggleOption = (label) => {
        const next = new Set(dataBackUpOption);
        if (next.has(label)) next.delete(label);
        else next.add(label);
        setDataBackUpOption(next);
        onChange?.([...next]);
    };

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                padding: '1rem 1rem 0 1rem',
                maxHeight: '400px',
                overflowY: 'auto',
            }}
        >
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Select Data to Back Up</h2>
                {dataBackUpOption.size > 0 && (
                    <button className="btn-primary" onClick={() => downloadSelectedBackups([...dataBackUpOption])}>
                        Export Selected
                    </button>
                )}
            </div>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                    gap: '0.75rem',
                }}
            >
                {dataOptions.map((label) => {
                    const isChecked = dataBackUpOption.has(label);
                    return (
                        <label
                            key={label}
                            className="modern-checkbox echo-buff"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                border: `1px solid ${isChecked ? 'rgba(32,191,185,0.89)' : '#555'}`,
                                cursor: 'pointer',
                                borderRadius: '0.5rem',
                                background: isChecked ? 'rgba(102, 204, 255, 0.15)' : 'transparent',
                                transition: 'background 0.3s ease, border 0.3s ease',
                                padding: '0.6rem 1rem',
                            }}
                        >
                            <input type="checkbox" checked={isChecked} onChange={() => toggleOption(label)} />
                            <span>{label}</span>
                        </label>
                    );
                })}
            </div>

            <div
                className="highlight"
                style={{
                    marginTop: '0.5rem',
                    fontSize: '0.9rem',
                    opacity: 0.7,
                    textAlign: 'center',
                }}
            >
                Selected: {dataBackUpOption.size > 0 ? [...dataBackUpOption].join(', ') : 'None'}
            </div>
        </div>
    );
}
