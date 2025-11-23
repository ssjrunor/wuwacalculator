import {Info} from "lucide-react";
import {EchoOptimizer} from "../../optimizer/EchoOptimizer.js";
import React, {useLayoutEffect, useState} from "react";
import {Tooltip} from "antd";

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
                                            cancelled,
                                            openGuide,
                                            isWide = true
                                        }) {
    return (
        <>
            {isWide ? (
                <div className="sticky-wrapper">
                    <div className="sticky-controls inherent-skills-box">
                        <div className="section-title-row" style={{ margin: 'unset' }}>
                            <span className="section-title">Permutations</span>
                            <Tooltip
                                title={
                                    <div style={{ maxWidth: 260 }}>
                                        The optimizer estimates the number of somewhat unique echo permutations
                                        it will test. This helps you understand how large the search
                                        space is for the current filters.
                                    </div>
                                }
                                placement="rightTop"
                                mouseEnterDelay={0.1}
                            >
                                <span className="icon-help" style={{ cursor: "pointer" }}>
                                    <Info size={16} />
                                </span>
                            </Tooltip>
                        </div>

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
                            <Tooltip
                                title={
                                    <div className="tool-tip-content">
                                        <div className="tool-tip-section">
                                            <span className="highlight"> Result Limit</span>
                                            <p>
                                                This controls how many top builds the optimizer
                                                keeps after each GPU batch and in the final list. Higher values
                                                give you more options, but use more memory and can be a bit slower.
                                            </p>
                                        </div>
                                        <div className="tool-tip-section">
                                            <span className="highlight"> Filter Strength</span>
                                            <p>
                                                This controls how aggressively weaker
                                                combinations are pruned while searching. Higher values mean
                                                stronger pruning and faster runs, lower values mean a gentler
                                                filter and a more thorough search.
                                            </p>
                                        </div>
                                    </div>
                                }
                                placement="right"
                                mouseEnterDelay={0.1}
                            >
                    <span className="icon-help" style={{ cursor: "pointer" }}>
                        <Info size={16} />
                    </span>
                            </Tooltip>
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
                        <div className="row-buttons">
                            <button className="btn-primary" onClick={() => openGuide('Optimizer')}>See Guide</button>
                        </div>

                    </div>
                </div>
            ) : (
                <div className="sticky-controls inherent-skills-box bottom landscape">
                    <div className="optimizer-landscape-row">
                        {/* Column 1: Permutations & Progress */}
                        <div className="optimizer-col metrics">
                            <div className="section-title-row" style={{ margin: "unset" }}>
                                <span className="section-title">Permutations</span>
                                <Tooltip
                                    title={
                                        <div style={{ maxWidth: 260 }}>
                                            The optimizer estimates the number of somewhat unique echo permutations
                                            it will test. This helps you understand how large the search
                                            space is for the current filters.
                                        </div>
                                    }
                                    placement="rightTop"
                                    mouseEnterDelay={0.1}
                                >
                                    <span className="icon-help" style={{ cursor: "pointer" }}>
                                        <Info size={16} />
                                    </span>
                                </Tooltip>
                            </div>

                            <div className="perm-row">
                                <span className="perm-name">Permutations</span>
                                <div className="dash-separator" />
                                <span className="perm-value">
                                    {!pendingCombinations
                                        ? combinations.toLocaleString()
                                        : "calculating..."}
                                </span>
                            </div>

                            <div className="perm-row">
                                <span className="perm-name">Processed</span>
                                <div className="dash-separator" />
                                <span className="perm-value">
                                    {progress.processed.toLocaleString()}
                                </span>
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
                        </div>

                        <div className="optimizer-col metrics">
                            <div className="perm-row">
                                <span className="perm-name">Results</span>
                                <div className="dash-separator" />
                                <span className="perm-value">{resultLength || "..."}</span>
                            </div>

                            <div
                                className="section-title"
                                style={{ display: "flex", justifyContent: "space-between" }}
                            >
                                <span>
                                    {isLoading
                                        ? Number.isFinite(progress.remainingMs)
                                            ? ` Time left - ${formatTime(progress.remainingMs)} (${progress.speed.toLocaleString()} / sec)`
                                            : "Estimating..."
                                        : cancelled
                                            ? "Cancelled"
                                            : "Progress"}
                                </span>
                                <span>{success ? "Done~!" : ""}</span>
                            </div>

                            <div className="progress-bar">
                                <div
                                    className="progress-bar-inner"
                                    style={{ width: `${progress.progress * 100}%` }}
                                />
                            </div>

                            <div className="progress-label">
                                {Math.floor(progress.progress * 100)}%
                            </div>
                        </div>

                        {/* Column 2: Controls */}
                        <div className="optimizer-col controls">
                            <div className="section-title">Controls</div>

                            <button
                                className="btn-primary echoes"
                                onClick={runOptimizer}
                                disabled={isLoading || pendingCombinations}
                                style={{
                                    pointerEvents: isLoading ? "none" : "auto",
                                    filter: isLoading ? "grayscale(1)" : "unset",
                                }}
                            >
                                {!isLoading ? "Run Optimizer" : "Running..."}
                            </button>

                            <div className="row-buttons">
                                <button className="btn-primary" onClick={handleReset}>
                                    Reset
                                </button>
                                <button
                                    className="btn-primary"
                                    onClick={() => {
                                        EchoOptimizer.cancel();
                                    }}
                                >
                                    HALT
                                </button>
                            </div>
                        </div>

                        <div className="optimizer-col controls">
                            <span className="section-title">Results</span>

                            <div className="row-buttons">
                                <button className="btn-primary" onClick={onEquipOptimizerResult}>
                                    Equip
                                </button>
                                <button
                                    className="btn-primary"
                                    onClick={() => setOptimizerResults([])}
                                >
                                    Clear
                                </button>
                            </div>
                            <div className="row-buttons">
                                <button
                                    className="btn-primary"
                                    onClick={() => openGuide("Optimizer")}
                                >
                                    See Guide
                                </button>
                            </div>
                        </div>

                        {/* Column 3: Configurations */}
                        <div className="optimizer-col config">
                            <div className="section-title-row">
                                <span className="section-title">Configurations</span>
                                <Tooltip
                                    title={
                                        <div className="tool-tip-content">
                                            <div className="tool-tip-section">
                                                <span className="highlight"> Result Limit</span>
                                                <p>
                                                    This controls how many top builds the optimizer
                                                    keeps after each GPU batch and in the final list. Higher values
                                                    give you more options, but use more memory and can be a bit slower.
                                                </p>
                                            </div>
                                            <div className="tool-tip-section">
                                                <span className="highlight"> Filter Strength</span>
                                                <p>
                                                    This controls how aggressively weaker
                                                    combinations are pruned while searching. Higher values mean
                                                    stronger pruning and faster runs, lower values mean a gentler
                                                    filter and a more thorough search.
                                                </p>
                                            </div>
                                        </div>
                                    }
                                    placement="right"
                                    mouseEnterDelay={0.1}
                                >
                        <span className="icon-help" style={{ cursor: "pointer" }}>
                            <Info size={16} />
                        </span>
                                </Tooltip>
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
                                                updateGeneralOptimizerSettings({
                                                    resultsLimit: Number(e.target.value),
                                                })
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
                                                updateGeneralOptimizerSettings({ keepPercent: v });
                                                handleFilteredChange(v);
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </>
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