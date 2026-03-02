import React, {useEffect, useRef, useState} from "react";
import {echoSetById, echoSetList, setIconMap} from "@shared/constants/echoSetData2.js";
import {createPortal} from "react-dom";

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
        const setObj = echoSetById?.[id];
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
                const setData = echoSetById?.[setId];
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
