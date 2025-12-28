import React from 'react';

export default function EnemyPane({
                                      enemyLevel, setEnemyLevel,
                                      enemyRes, setEnemyRes,
                                      combatState, setCombatState
                                  }) {
    if (enemyLevel == null || enemyRes == null) return null;

    const handleLevelChange = (val) => {
        const clamped = Math.min(120, Math.max(1, Number(val)));
        setEnemyLevel(clamped);
        setCombatState(prev => ({ ...prev, enemyLevel: clamped }));
    };

    const handleResChange = (val) => {
        const clamped = Math.min(100, Math.max(0, Number(val)));
        setEnemyRes(clamped);
        setCombatState(prev => ({ ...prev, enemyRes: clamped }));
    };

    const handleDebuffChange = (key, val, max = 60) => {
        const clamped = Math.min(max, Math.max(0, Number(val)));
        setCombatState(prev => ({ ...prev, [key]: clamped }));
    };

    return (
        <div className="character-settings enemy-pane">
            <h2 className="enemy-title">Enemy Settings</h2>

            <div className="echo-buff">
                <h3 className="enemy-subtitle">Base Config</h3>
                <div className="slider-group">
                    <div className="slider-label-with-input">
                        <label htmlFor="enemy-level">Enemy Level</label>
                        <input
                            id="enemy-level"
                            type="number"
                            min="1"
                            max="120"
                            className="character-level-input"
                            value={enemyLevel}
                            onChange={(e) => handleLevelChange(e.target.value)}
                        />
                    </div>
                    <input
                        type="range"
                        min="1"
                        max="120"
                        value={enemyLevel}
                        onChange={(e) => handleLevelChange(e.target.value)}
                        style={{
                            '--slider-color': '#777777',
                            '--slider-fill': `${((enemyLevel - 1) / 119) * 100}%`
                        }}
                    />
                </div>

                <div className="slider-group">
                    <div className="slider-label-with-input">
                        <label htmlFor="enemy-res">Enemy Resistance</label>
                        <input
                            id="enemy-res"
                            type="number"
                            min="0"
                            max="100"
                            className="character-level-input"
                            value={enemyRes}
                            onChange={(e) => handleResChange(e.target.value)}
                        />
                        <span>%</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={enemyRes}
                        onChange={(e) => handleResChange(e.target.value)}
                        style={{
                            '--slider-color': '#777777',
                            '--slider-fill': `${(enemyRes / 100) * 100}%`
                        }}
                    />
                </div>
            </div>

            <div className="echo-buff">
                <h3 className="enemy-subtitle">Tunability</h3>
                <div className="slider-group">
                    <div className="slider-label-with-input">
                        <label htmlFor="enemy-level">Tune Strain - Interfered</label>
                        <input
                            id="tune-strain-interfered"
                            type="number"
                            min="0"
                            max="10000"
                            className="character-level-input"
                            value={combatState.tuneStrain ?? 0}
                            onChange={(e) => handleDebuffChange('tuneStrain', e.target.value, 10000)}
                        />
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="10000"
                        value={combatState.tuneStrain ?? 0}
                        onChange={(e) => handleDebuffChange('tuneStrain', e.target.value, 10000)}
                        style={{
                            '--slider-color': '#d3d3d3',
                            '--slider-fill': `${((combatState.tuneStrain ?? 0) / 10000) * 100}%`
                        }}
                    />
                </div>
            </div>

            <div className="echo-buff">
                <h3 className="enemy-subtitle">Negative Effects</h3>
                <div className="slider-group">
                    <div className="slider-label-with-input">
                        <label htmlFor="spectro-frazzle">Spectro Frazzle</label>
                        <input
                            id="spectro-frazzle"
                            type="number"
                            min="0"
                            max="60"
                            className="character-level-input"
                            value={combatState.spectroFrazzle ?? 0}
                            onChange={(e) => handleDebuffChange('spectroFrazzle', e.target.value)}
                        />
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="60"
                        value={combatState.spectroFrazzle ?? 0}
                        onChange={(e) => handleDebuffChange('spectroFrazzle', e.target.value)}
                        style={{
                            '--slider-color': 'rgb(202,179,63)',
                            '--slider-fill': `${((combatState.spectroFrazzle ?? 0) / 60) * 100}%`
                        }}
                    />
                </div>

                <div className="slider-group">
                    <div className="slider-label-with-input">
                        <label htmlFor="aero-erosion">Aero Erosion</label>
                        <input
                            id="aero-erosion"
                            type="number"
                            min="0"
                            max="6"
                            className="character-level-input"
                            value={combatState.aeroErosion ?? 0}
                            onChange={(e) => handleDebuffChange('aeroErosion', e.target.value)}
                        />
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="12"
                        value={combatState.aeroErosion ?? 0}
                        onChange={(e) => handleDebuffChange('aeroErosion', e.target.value)}
                        style={{
                            '--slider-color': 'rgb(15,205,160)',
                            '--slider-fill': `${((combatState.aeroErosion ?? 0) / 12) * 100}%`
                        }}
                    />
                </div>

                <div className="slider-group">
                    <div className="slider-label-with-input">
                        <label htmlFor="havoc-bane">Havoc Bane</label>
                        <input
                            id="havoc-bane"
                            type="number"
                            min="0"
                            max="6"
                            className="character-level-input"
                            value={combatState.havocBane ?? 0}
                            onChange={(e) => handleDebuffChange('havocBane', e.target.value)}
                        />
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="6"
                        value={combatState.havocBane ?? 0}
                        onChange={(e) => handleDebuffChange('havocBane', e.target.value)}
                        style={{
                            '--slider-color': 'rgb(172,9,96)',
                            '--slider-fill': `${((combatState.havocBane ?? 0) / 6) * 100}%`
                        }}
                    />
                </div>

                <div className="slider-group">
                    <div className="slider-label-with-input">
                        <label htmlFor="electro-flare">Electro Flare</label>
                        <input
                            id="electro-flare"
                            type="number"
                            min="0"
                            max="13"
                            className="character-level-input"
                            value={combatState.electroFlare ?? 0}
                            onChange={(e) => handleDebuffChange('electroFlare', e.target.value)}
                        />
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="13"
                        value={combatState.electroFlare ?? 0}
                        onChange={(e) => handleDebuffChange('electroFlare', e.target.value)}
                        style={{
                            '--slider-color': 'rgb(167,13,209)',
                            '--slider-fill': `${((combatState.electroFlare ?? 0) / 13) * 100}%`
                        }}
                    />
                </div>
            </div>
        </div>
    );
}