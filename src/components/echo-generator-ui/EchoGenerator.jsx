import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Wrench } from "lucide-react";
import {
    getEchoScores,
    getTop5SubstatScoreDetails,
} from "../../utils/echoHelper.js";
import { getEquippedEchoesScoreDetails } from "../echoes-pane-ui/EchoesPane.jsx";
import { attributeColors, elementToAttribute } from "../../utils/attributeHelpers.js";
import { echoSets as echoSetData } from "../../constants/echoSetData2.js";
import { setIconMap } from "../../constants/echoSetData2.js";
import { echoes as allEchoes } from "../../json-data-scripts/getEchoes.js";
import EchoMenu from "../echoes-pane-ui/EchoMenu.jsx";
import SkillMenu, {tabDisplayOrder} from "../rotations-ui/SkillMenu.jsx";
import { EchoGridPreview } from "../overview-ui/OverviewDetailPane.jsx";
import {getGroupedSkillOptions} from "../../utils/prepareDamageData.js";

const echoSetList = Object.entries(echoSetData).map(([id, cfg]) => ({
    id: Number(id),
    name: cfg.name,
    twoPiece: cfg.desc?.twoPiece,
    threePiece: cfg.desc?.threePiece,
    fivePiece: cfg.desc?.fivePiece
}));

export function EchoGenerator({
                                  open,
                                  onClose,
                                  echoData,
                                  charId,
                                  getImageSrc,
                                  characterRuntimeStates,
                                  setCharacterRuntimeStates,
                                  onEquipGenerated,
                                  skillResults,
                                  activeCharacter,
                                  baseCharacterState,
                                  mergedBuffs,
                                  allSkillLevels
                              }) {
    const updateRandGenSettings = (patch) => {
        if (!activeCharacter) return;
        const charId = activeCharacter.Id ?? activeCharacter.id ?? activeCharacter.link;
        setCharacterRuntimeStates((prev) => {
            const prevChar = prev[charId] ?? {};
            return {
                ...prev,
                [charId]: {
                    ...prevChar,
                    randGenSettings: {
                        ...(prevChar.randGenSettings ?? {}),
                        ...patch,
                    },
                },
            };
        });
    };

    const randGen = characterRuntimeStates?.[charId]?.randGenSettings;
    const [editConfig, setEditConfig] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [showSkillOptions, setShowSkillOptions] = useState(false);
    const [isClosingSkillMenu, setIsClosingSkillMenu] = useState(false);
    const menuRef = useRef(null);
    const level = randGen?.level ?? null;
    const tab = randGen?.tab ?? "";
    const [isLoading, setIsLoading] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [builtEchoes, setBuiltEchoes] = useState([null, null, null, null, null]);
    const workerRef = useRef(null);
    const [progress, setProgress] = useState(0);

    const groupedSkillOptions = useMemo(() => {
        return getGroupedSkillOptions({ skillResults });
    }, [skillResults]);

    const [expandedTabs, setExpandedTabs] = useState(() =>
        Object.fromEntries(tabDisplayOrder.map((key) => [key, true]))
    );
    const toggleTab = (key) =>
        setExpandedTabs((prev) => ({...prev, [key]: !prev[key]}));
    const handleAddSkill = (skill) => {
        const newTab = skill?.tab;
        updateRandGenSettings({ tab: newTab });

        const match = allSkillLevels?.[newTab]?.find(
            (l) => l?.label?.includes(skill?.name) || l?.Name?.includes(skill?.name)
        );
        if (match) updateRandGenSettings({ level: match });
        setShowSkillOptions(false);
    };
    const closeMenu = () => {
        setIsClosingSkillMenu(true);
        setTimeout(() => {
            setShowSkillOptions(false);
            setIsClosingSkillMenu(false);
        }, 200);
    };
    const entry = {
        label: level?.Name,
        detail: level?.Type ?? tab,
        tab,
    };
    const skill = skillResults
        ?.find(skill => (skill.name === level?.label || skill.name === level?.Name) && skill.tab === tab) ?? {};

    useEffect(() => {
        const worker = new Worker(
            new URL("../../workers/generatorWorker.js", import.meta.url),
            { type: "module" }
        );
        workerRef.current = worker;

        worker.onmessage = (e) => {
            const data = e.data;
            if (data.type === 'progress') {
                setProgress(data.progress);
            } else if (data.type === 'result') {
                setBuiltEchoes(data.builtEchoes);
                setIsLoading(false);
                setProgress(100);
            } else if (data.type === 'error') {
                console.error('Worker error:', data.message);
                setIsLoading(false);
            }
        };

        return () => {
            worker.terminate();
            workerRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (!open || !workerRef.current) return;
        setIsLoading(true);

        const payload = {
            characterRuntimeStates,
            charId,
            activeCharacter,
            entry,
            levelData: level,
            randGen,
            baseCharacterState,
            mergedBuffs,
            echoData,
            skill,
        };

        workerRef.current.postMessage({ payload });
    }, [open]);

    function runRandomizer() {
        if (!workerRef.current) return;
        setIsLoading(true);
        setProgress(0);

        const payload = {
            characterRuntimeStates,
            charId,
            activeCharacter,
            entry,
            levelData: randGen?.level ?? null,
            randGen,
            baseCharacterState,
            mergedBuffs,
            echoData,
            skill,
        };

        workerRef.current.postMessage({ payload });
    }

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsClosing(false);
            onClose?.();
        }, 300);
    };

    const activeId = charId;
    const echoes = builtEchoes;

    const maxScore = getTop5SubstatScoreDetails(activeId).total;
    const buildScoreCur = getEquippedEchoesScoreDetails(charId, {
        [charId]: { ...characterRuntimeStates[charId], equippedEchoes: echoes },
    });
    const percentScoreCur = (buildScoreCur.total / (maxScore * 5)) * 100 || 0;

    if (!randGen) return null;

    return (
        <div
            className={`skills-modal-overlay ${isClosing ? "closing" : ""}`}
            onClick={(e) => {
                e.stopPropagation();
                handleClose();
            }}
        >
            <div
                className={`skills-modal-content preset-preview changelog-modal guides modal-main-content echo-preview-view echo-generator ${
                    isClosing ? "closing" : ""
                }`}
                onClick={(e) => e.stopPropagation()}
                style={{gap: "unset"}}
            >
                <div style={{display: "flex", flexDirection: "row", alignItems: "center"}}>
                    <h2 style={{margin: 'unset'}}>Echo Generator</h2>
                    <div style={{marginLeft: "auto", textAlign: "right"}}>
                        <h4 style={{margin: '4px'}} className="echo-buff">
                            {!isLoading ? `Build Score: ${percentScoreCur.toFixed(1)}%` : 'wait one minute...'}
                        </h4>
                    </div>
                </div>

                <div style={{display: "flex", alignItems: "center"}}>
                    <h3>{editConfig ? "Configuration:" : "Echoes generated:"}</h3>
                    <div
                        style={{
                            marginLeft: "auto",
                            display: "flex",
                            gap: "0.75rem",
                        }}
                    >
                        <button
                            className="btn-primary echoes"
                            onClick={() => setEditConfig(!editConfig)}
                        >
                            <Wrench size={15}/>
                        </button>
                        <button
                            className="btn-primary echoes"
                            onClick={() => {
                                onEquipGenerated(builtEchoes);
                                handleClose();
                            }}
                        >
                            Equip
                        </button>
                        <button
                            className="rotation-button clear echoes"
                            disabled={isLoading}
                            onClick={() => {
                                if (isLoading) return;
                                setEditConfig(false);
                                runRandomizer();
                            }}
                            style={{
                                opacity: isLoading ? 0.6 : 1,
                                backgroundColor: isLoading ? "palevioletred" : "crimson",
                                cursor: isLoading ? "not-allowed" : "pointer",
                            }}
                        >
                            {isLoading ? "Generating..." : "Regenerate"}
                        </button>
                    </div>
                </div>

                <div
                    className={`echo-grid main-echo-description guides ${
                        isLoading || editConfig ? "loading" : ""
                    }`}
                    style={{marginBottom: "1rem"}}
                >
                    {editConfig ? (
                        <div className="edit-config">
                            <div className="config-selector-group">
                                <h4>Main Echo:</h4>
                                <div
                                    className="config-selector btn-primary echoes"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setMenuOpen((prev) => !prev);
                                    }}
                                >
                                    {randGen?.mainEcho?.name ?? "Select Echo"}
                                </div>

                                <h4>Target Skill:</h4>
                                <div
                                    className="config-selector btn-primary echoes"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowSkillOptions(true);
                                    }}
                                >
                                    {skill?.name ?? "Target Skill"}
                                </div>

                                <div style={{display: "flex", gap: "1rem", alignItems: "center"}}>
                                    <h4>Target Energy Regen:</h4>
                                    <input
                                        type="number"
                                        style={{marginTop: "4px"}}
                                        min="0"
                                        max="200"
                                        step="100"
                                        value={randGen.targetEnergyRegen}
                                        onChange={(e) => {
                                            const val = Number(e.target.value);
                                            const clamped = Math.max(0, Math.min(val, 200));
                                            updateRandGenSettings({targetEnergyRegen: clamped});
                                        }}
                                        className="character-level-input"
                                    />
                                </div>

                                <SonataSetPlanner
                                    selectedSets={randGen.setId}
                                    updateRandGenSettings={updateRandGenSettings}
                                />
                            </div>

                            {/* ---- Sliders ---- */}
                            <div className="config-sliders">
                                {/* Iterations */}
                                <div className="slider-group">
                                    <div className="slider-item">
                                        <label>Iterations:</label>
                                        <input
                                            type="number"
                                            min="100"
                                            max="150000"
                                            step="100"
                                            value={randGen.iterations}
                                            onChange={(e) =>
                                                updateRandGenSettings({
                                                    iterations: Math.max(
                                                        100,
                                                        Math.min(Number(e.target.value), 150000)
                                                    ),
                                                })
                                            }
                                            className="character-level-input"
                                        />
                                    </div>
                                    <div className="slider-row">
                                        <input
                                            type="range"
                                            min="100"
                                            max="150000"
                                            step="100"
                                            value={randGen.iterations}
                                            onChange={(e) =>
                                                updateRandGenSettings({
                                                    iterations: Number(e.target.value),
                                                })
                                            }
                                            className="slider iterations"
                                        />
                                    </div>
                                </div>

                                {/* Bias */}
                                <div className="slider-group">
                                    <div className="slider-item">
                                        <label>Bias:</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="1"
                                            step="0.1"
                                            value={randGen.bias}
                                            onChange={(e) =>
                                                updateRandGenSettings({
                                                    bias: Math.max(
                                                        0,
                                                        Math.min(Number(e.target.value), 1)
                                                    ),
                                                })
                                            }
                                            className="character-level-input"
                                        />
                                    </div>
                                    <div className="slider-row">
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.1"
                                            value={randGen.bias}
                                            onChange={(e) =>
                                                updateRandGenSettings({
                                                    bias: Number(e.target.value),
                                                })
                                            }
                                            className="slider bias"
                                        />
                                    </div>
                                </div>

                                {/* Roll Quality */}
                                <div className="slider-group">
                                    <div className="slider-item">
                                        <label>Roll Quality:</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="1"
                                            step="0.1"
                                            value={randGen.rollQuality}
                                            onChange={(e) =>
                                                updateRandGenSettings({
                                                    rollQuality: Math.max(
                                                        0,
                                                        Math.min(Number(e.target.value), 1)
                                                    ),
                                                })
                                            }
                                            className="character-level-input"
                                        />
                                    </div>
                                    <div className="slider-row">
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.1"
                                            value={randGen.rollQuality}
                                            onChange={(e) =>
                                                updateRandGenSettings({
                                                    rollQuality: Number(e.target.value),
                                                })
                                            }
                                            className="slider quality"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : !isLoading ? (
                        [...Array(5)].map((_, i) => {
                            const echo = echoes[i];
                            const score = echo
                                ? (getEchoScores(charId, echo).totalScore / maxScore) * 100
                                : 0;
                            return (
                                <div
                                    key={i}
                                    className="echo-tile overview inherent-skills-box echo-parser-preview"
                                    style={{margin: "unset"}}
                                >
                                    <EchoGridPreview
                                        echo={echo}
                                        getImageSrc={getImageSrc}
                                        score={score}
                                        setIconMap={setIconMap}
                                        className="echo-parser-preview preset-preview"
                                    />
                                </div>
                            );
                        })
                    ) : (
                        <div className="fancy-loader-container">
                            <div
                                className="fancy-loader"
                                style={{
                                    borderTopColor:
                                        attributeColors[elementToAttribute[activeCharacter?.attribute]] ??
                                        "#66ccff",
                                }}
                            ></div>
                            <span className="loader-text">
                                {(() => {
                                    if (randGen.iterations > 99999) {
                                        if (progress < 40) return "um... so how has your day been~?";
                                        else if (progress < 80) return "hope it's been amazing~";
                                        else return "it's almost done~";
                                    } else return "hang on...";
                                })()}
                            </span>
                            <span className="loader-text">
                                {progress}%
                            </span>
                        </div>
                    )}
                </div>
                <span className="preset-date overview-weapon-details" style={{ position: 'unset'}}>
                    {`✿ If you find something weird do 
                    drop by the discord server to slime me out~! ദ്ദി(˵ •̀ ᴗ - ˵ ) ✧`}
                </span>
            </div>

            <EchoMenu
                echoes={allEchoes}
                handleEchoSelect={(sel) => {
                    updateRandGenSettings({mainEcho: sel});
                    setMenuOpen(false);
                }}
                menuRef={menuRef}
                menuOpen={menuOpen}
                setMenuOpen={setMenuOpen}
            />

            <SkillMenu
                open={showSkillOptions}
                isClosing={isClosingSkillMenu}
                closeMenu={closeMenu}
                groupedSkillOptions={groupedSkillOptions}
                expandedTabs={expandedTabs}
                toggleTab={toggleTab}
                handleAddSkill={handleAddSkill}
                onClickOut={(e) => {
                    e.stopPropagation();
                    setIsClosingSkillMenu(true);
                    setTimeout(() => {
                        setShowSkillOptions(false);
                        setIsClosingSkillMenu(false);
                    }, 200);
                }}
            />
        </div>
    );
}

export function SonataSetPlanner({ selectedSets, updateRandGenSettings }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [animationClass, setAnimationClass] = useState("");
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

    const triggerRef = useRef(null);
    const menuRef = useRef(null);

    const closeMenu = () => {
        setAnimationClass("fade-out");
        setTimeout(() => {
            setMenuOpen(false);
            setAnimationClass("");
        }, 200);
    };

    const handleButtonClick = (e) => {
        e.stopPropagation();
        if (menuOpen) closeMenu();
        else {
            const rect = e.currentTarget.getBoundingClientRect();
            setMenuPosition({ top: rect.bottom + window.scrollY, left: rect.left });
            setMenuOpen(true);
            setAnimationClass("");
            requestAnimationFrame(() => setAnimationClass("fade-in"));
        }
    };

    useEffect(() => {
        if (!menuOpen) return;
        const handleOutsideClick = (e) => {
            if (
                menuRef.current?.contains(e.target) ||
                triggerRef.current?.contains(e.target)
            ) return;
            closeMenu();
        };
        document.addEventListener("mousedown", handleOutsideClick);
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, [menuOpen]);

    const totalCount = selectedSets.reduce((sum, s) => sum + s.count, 0);

    const setSelectedSets = (updater) => {
        const next =
            typeof updater === "function" ? updater(selectedSets) : updater;
        updateRandGenSettings({ setId: next });
    };

    const handleSelectSet = (setObj) => {
        const validCounts = Object.keys(setObj)
            .filter((k) => k.match(/Piece$/))
            .map((k) => {
                const num = parseInt(k.replace(/[^0-9]/g, ""), 10);
                if (isNaN(num)) {
                    if (k.includes("two")) return 2;
                    if (k.includes("three")) return 3;
                    if (k.includes("five")) return 5;
                }
                return num;
            })
            .filter(Boolean)
            .sort((a, b) => a - b);

        const defaultCount = validCounts[0] ?? 2;
        if (selectedSets.some((s) => s.setId === setObj.id)) return;

        const newEntry = {
            setId: setObj.id,
            count: defaultCount,
            modifiedAt: Date.now(),
        };

        setSelectedSets((prev) => {
            let next = [...prev, newEntry];
            next.sort((a, b) => b.modifiedAt - a.modifiedAt);
            let total = next.reduce((sum, s) => sum + s.count, 0);

            if (total > 5 && next.length > 1) {
                next.splice(1, 1);
                total = next.reduce((sum, s) => sum + s.count, 0);
            }

            while (total > 5 && next.length > 0) {
                const oldest = next.reduce((oldest, s) =>
                    s.modifiedAt < oldest.modifiedAt ? s : oldest
                );
                next = next.filter((s) => s !== oldest);
                total = next.reduce((sum, s) => sum + s.count, 0);
            }

            return next;
        });

        closeMenu();
    };

    const handleCountChange = (id, value) => {
        const setObj = echoSetList.find((s) => s.id === id);
        if (!setObj) return;

        const validCounts = Object.keys(setObj)
            .filter((k) => k.match(/Piece$/))
            .map((k) => {
                const num = parseInt(k.replace(/[^0-9]/g, ""), 10);
                if (isNaN(num)) {
                    if (k.includes("two")) return 2;
                    if (k.includes("three")) return 3;
                    if (k.includes("five")) return 5;
                }
                return num;
            })
            .filter(Boolean)
            .sort((a, b) => a - b);

        if (validCounts.length === 0) return;

        const numeric = Number(value);
        if (isNaN(numeric)) return;

        const closest = validCounts.reduce((a, b) =>
            Math.abs(b - numeric) < Math.abs(a - numeric) ? b : a
        );
        const min = validCounts[0];
        const max = validCounts[validCounts.length - 1];
        const clamped = Math.min(Math.max(closest, min), max);

        setSelectedSets((prev) => {
            let updated = prev.map((s) =>
                s.setId === id
                    ? { ...s, count: clamped, modifiedAt: Date.now() }
                    : s
            );

            updated.sort((a, b) => b.modifiedAt - a.modifiedAt);

            let total = updated.reduce((sum, s) => sum + s.count, 0);
            while (total > 5 && updated.length > 0) {
                const oldest = updated.reduce((oldest, s) =>
                    s.modifiedAt < oldest.modifiedAt ? s : oldest
                );
                updated = updated.filter((s) => s !== oldest);
                total = updated.reduce((sum, s) => sum + s.count, 0);
            }
            return updated;
        });
    };

    const handleRemoveSet = (id) => {
        setSelectedSets((prev) => prev.filter((s) => s.setId !== id));
    };

    // -------- rendering --------
    return (
        <div className="sonata-set-planner">
            <h4>Sonata Set Plan:</h4>

            {selectedSets.map(({ setId, count }) => {
                const setData = echoSetList.find((s) => s.id === setId);
                if (!setData) return null;
                return (
                    <div key={setId} className="selected-set-entry">
                        <input
                            type="number"
                            min="2"
                            max="5"
                            value={count}
                            onChange={(e) => {
                                const val = e.target.value;
                                setSelectedSets((prev) =>
                                    prev.map((s) =>
                                        s.setId === setId
                                            ? {
                                                ...s,
                                                count:
                                                    val === ""
                                                        ? ""
                                                        : Number(val),
                                            }
                                            : s
                                    )
                                );
                            }}
                            onBlur={(e) => {
                                if (e.target.value === "") {
                                    handleCountChange(setId, 0);
                                } else {
                                    handleCountChange(
                                        setId,
                                        Number(e.target.value)
                                    );
                                }
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter")
                                    handleCountChange(
                                        setId,
                                        Number(e.target.value)
                                    );
                            }}
                            className="set-count-input"
                        />
                        pc.
                        <img
                            src={setIconMap[setId]}
                            alt={setData.name}
                            className="set-icon"
                        />
                        <span className="set-name">{setData.name}</span>
                        <span
                            className="remove-substat-button remove-set"
                            onClick={() => handleRemoveSet(setId)}
                        >
                            −
                        </span>
                    </div>
                );
            })}

            {(!totalCount || (totalCount < 4 && selectedSets.length < 2)) && (
                <div className="add-set-section">
                    <button
                        ref={triggerRef}
                        className="remove-substat-button"
                        style={{ fontSize: "0.75rem" }}
                        onClick={handleButtonClick}
                    >
                        + Add Set
                    </button>

                    {menuOpen &&
                        createPortal(
                            <div
                                ref={menuRef}
                                className={`set-menu ${animationClass}`}
                                style={{
                                    position: "absolute",
                                    top: menuPosition.top,
                                    left: menuPosition.left,
                                    zIndex: 9999,
                                }}
                            >
                                {echoSetList.map((setObj) => (
                                    <div
                                        key={setObj.id}
                                        className="set-menu-item"
                                        onClick={() => handleSelectSet(setObj)}
                                    >
                                        <img
                                            src={setIconMap[setObj.id]}
                                            alt={setObj.name}
                                            className="set-icon"
                                        />
                                        <span>{setObj.name}</span>
                                    </div>
                                ))}
                            </div>,
                            document.body
                        )}
                </div>
            )}
        </div>
    );
}
