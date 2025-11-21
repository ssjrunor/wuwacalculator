import {Info} from "lucide-react";
import {EchoOptimizer} from "../../optimizer/EchoOptimizer.js";
import React from "react";

export function EchoOptimizerControlBox({
                                            runOptimizer,
                                            resultsLimit,
                                            searchLength,
                                            combinations = 0,
                                            progress,
                                            updateGeneralOptimizerSettings,
                                            keepPercent,
                                            handleFilteredChange,
                                            pendingCombinations,
                                            batchSize,
                                            handleReset,
                                            isLoading,
                                            resultLength,
                                            onEquipOptimizerResult,
                                            setOptimizerResults,
                                            success,
                                            cancelled
                                        }) {
    return (
        <div className="sticky-controls inherent-skills-box">

            <div className="section-title-row" style={{ margin: 'unset' }}>
                <span className="section-title">Permutations</span>
                <span className="icon-help">
                    <Info size={20} />
                </span>
            </div>
            {/*

            <div className="perm-row">
                <span className="perm-name">Head</span>
                <div className="dash-separator" />
                <span className="perm-value">1 / 15 - (7%)</span>
            </div>

            <div className="perm-row">
                <span className="perm-name">Hands</span>
                <div className="dash-separator" />
                <span className="perm-value">1 / 16 - (7%)</span>
            </div>

            <div className="perm-row">
                <span className="perm-name">Body</span>
                <div className="dash-separator" />
                <span className="perm-value">1 / 16 - (7%)</span>
            </div>

            <div className="perm-row">
                <span className="perm-name">Feet</span>
                <div className="dash-separator" />
                <span className="perm-value">1 / 13 - (8%)</span>
            </div>

            <div className="perm-row">
                <span className="perm-name">Sphere</span>
                <div className="dash-separator" />
                <span className="perm-value">1 / 16 - (7%)</span>
            </div>

            <div className="perm-row">
                <span className="perm-name">Rope</span>
                <div className="dash-separator" />
                <span className="perm-value">1 / 17 - (6%)</span>
            </div>
*/}

            <div className="perm-row">
                <span className="perm-name">Permutations</span>
                <div className="dash-separator" />
                <span className="perm-value">{`${!pendingCombinations ? combinations.toLocaleString() : 'calculating...'}`}</span>
            </div>

            <div className="perm-row">
                <span className="perm-name">Processed</span>
                <div className="dash-separator" />
                <span className="perm-value">{progress.processed.toLocaleString()}</span>
            </div>

            <div className="perm-row">
                <span className="perm-name">Batch Size</span>
                <div className="dash-separator" />
                <span className="perm-value">
                    {batchSize ? batchSize.toLocaleString() : "..."}
                </span>
            </div>

            <div className="perm-row">
                <span className="perm-name">Filtered Echoes</span>
                <div className="dash-separator" />
                <span className="perm-value">{searchLength}</span>
            </div>

            <div className="perm-row">
                <span className="perm-name">Results</span>
                <div className="dash-separator" />
                <span className="perm-value">{resultLength || '...'}</span>
            </div>

            {/*<div className="perm-row">
                <span className="perm-name">Elapsed</span>
                <div className="dash-separator" />
                <span className="perm-value">
                    {formatTime(progress.elapsedMs)}
                </span>
            </div>*/}

            <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>
                    {isLoading
                        ? (
                            Number.isFinite(progress.remainingMs)
                                ? ` Time left - ${formatTime(progress.remainingMs)} (${progress.speed.toLocaleString()} / sec)`
                                : 'Estimating...'
                        )
                        : cancelled ? 'Cancelled' : 'Progress'}
                </span>
                <span>{success ? 'Done~!' : ''}</span>
            </div>

            <div className="progress-bar">
                <div
                    className="progress-bar-inner"
                    style={{ width: `${progress.progress * 100}%` }}
                />
            </div>

            <div className="progress-label">{Math.floor(progress.progress * 100)}%</div>

            <div className="section-title">Controls</div>

            <button
                className="btn-primary echoes"
                onClick={runOptimizer}
                disabled={isLoading || pendingCombinations}
                style={{
                    pointerEvents: isLoading ? "none" : "auto",
                    filter: isLoading ? 'grayscale(1)' : 'unset'
                }}
            >
                {!isLoading ? 'Run Optimizer' : 'Running...'}
            </button>

            <div className="row-buttons">
                <button className="btn-primary" onClick={handleReset}>Reset</button>
                <button
                    className="btn-primary"
                    onClick={() => {
                        EchoOptimizer.cancel();
                    }}
                >
                    HALT
                </button>
            </div>

            <div className="section-title-row">
                <span className="section-title">Configurations</span>
                <span className="icon-help">?</span>
            </div>

            <div className="echo-buff optimizer-configurations">
                <div className="slider-group">
                    <div className="slider-item">
                        <span>Result Limit</span>
                        <div className="dash-separator" />
                        <span>{resultsLimit.toLocaleString()}</span>
                    </div>
                    <div className="slider-row">
                        <input
                            disabled={isLoading}
                            type="range"
                            min="32"
                            max={32 ** 2}
                            step="32"
                            value={resultsLimit}
                            onChange={(e) =>
                                updateGeneralOptimizerSettings(
                                    {resultsLimit: Number(e.target.value)}
                                )
                            }
                        />
                    </div>
                </div>

                <div className="slider-group">
                    <div className="slider-item">
                        <span>Filter Strength</span>
                        <div className="dash-separator" />
                        <span>{(keepPercent * 100).toFixed(0)}%</span>
                    </div>
                    <div className="slider-row">
                        <input
                            disabled={isLoading || pendingCombinations}
                            type="range"
                            min="0"
                            max="0.9"
                            step="0.1"
                            value={keepPercent}
                            onChange={(e) => {
                                const v = Number(e.target.value);
                                updateGeneralOptimizerSettings(
                                    {keepPercent: v}
                                );
                                handleFilteredChange(v);
                            }
                            }
                        />
                    </div>
                </div>
            </div>

            <div className="section-title-row">
                <span className="section-title">Results</span>
            </div>

            <div className="row-buttons">
                <button className="btn-primary" onClick={onEquipOptimizerResult}>Equip</button>
                <button className="btn-primary" onClick={() => setOptimizerResults([])}>Clear</button>
            </div>

            {/*
            <div className="row-buttons">
                <button className="btn-primary">Pin builds</button>
                <button className="btn-primary">Clear pins</button>
            </div>
*/}

        </div>
    );
}

function formatTime(ms) {
    if (!Number.isFinite(ms)) return 'Calculating...';

    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;

    if (min === 0) return `${sec}s`;
    return `${min}m ${sec}s`;
}