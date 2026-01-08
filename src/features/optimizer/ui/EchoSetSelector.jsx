import { Flex, Popover, Typography } from "antd";
import React, {useEffect, useMemo, useState} from "react";
import { setIconMap } from "@/constants/echoSetData2.js";
import {groupEchoSetsByPiece} from "@/features/optimizer/core/misc/setSolver.js";

const { Text } = Typography;



export function SetCompositionSelector({
                                           setOptions,
                                           handleSetOptionChange
}) {
    const [activePc, setActivePc] = useState("5");
    const pieceTypes = [
        { id: "5", label: "5 piece" },
        { id: "3", label: "3 piece" },
/*
        { id: "2", label: "2 piece" },
*/
    ];

    return (
        <Flex gap={25} className="custom-select__menu set-popover">
            <Flex vertical gap={12}>
                {pieceTypes.map((p) => {
                    const allSelected = setOptions[p.id].every(s => s.selected);
                    return (
                        <div
                            key={p.id}
                            className={`set-menu-item ${activePc === p.id ? "active" : ""}`}
                        >
                            <label
                                className="modern-checkbox"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const newStatus = !allSelected;
                                    const newSetOptions = {
                                        ...setOptions,
                                        [p.id]: setOptions[p.id].map(s => ({
                                            ...s,
                                            selected: newStatus
                                        }))
                                    };
                                    handleSetOptionChange(newSetOptions);
                                }}
                            >
                                <input type="checkbox" checked={allSelected} onChange={() => {}} />
                            </label>

                            <Text
                                strong={activePc === p.id}
                                style={{
                                    cursor: activePc !== p.id ? "pointer" : 'default',
                                    opacity: activePc === p.id ? 1 : 0.6,
                                    userSelect: "none"
                                }}
                                onClick={() => setActivePc(p.id)}
                            >
                                {p.label}
                            </Text>
                        </div>
                    );
                })}
            </Flex>

            <RightSetPane
                activePc={activePc}
                setOptions={setOptions}
                handleSetOptionChange={handleSetOptionChange}
            />
        </Flex>
    );
}

function RightSetPane({
                          activePc,
                          setOptions,
                          handleSetOptionChange
}) {
    const pc = Number(activePc);
    const col1 = setOptions[pc];

    return (
        <Flex gap={25}>
            <Flex vertical>
                {col1.map((s) => (
                    <ColumnSetRow
                        key={s.id}
                        id={s.id}
                        name={s.name}
                        icon={s.icon}
                        pc={s.pieceCount}
                        checked={s.selected}
                        onToggle={() => {
                            const newCol = setOptions[pc].map(item =>
                                item.id === s.id
                                    ? { ...item, selected: !item.selected }
                                    : item
                            );
                            const updated = {
                                ...setOptions,
                                [pc]: newCol
                            };
                            handleSetOptionChange(updated);
                        }}
                    />
                ))}
            </Flex>

            {/*{pc < 5 && (
                <>
                    <div className="divider" style={{ height: "100%", width: 1}}></div>
                    <Flex vertical>
                        {col2.map((s) => (
                            <ColumnSetRow
                                key={s.id + "-c2"}
                                id={s.id}
                                name={s.name}
                                icon={s.icon}
                                pc={s.pieceCount}
                                checked={selected[pc][s.id]}
                                onToggle={() => {
                                    setSelected({
                                        selectedSets: {
                                            ...selected,
                                            [pc]: {
                                                ...selected[pc],
                                                [s.id]: !selected[pc][s.id]
                                            }
                                        }
                                    });
                                }}
                            />
                        ))}
                    </Flex>
                </>
            )}*/}
        </Flex>
    );
}

function ColumnSetRow({ id, name, icon, pc, checked, onToggle }) {
    const displayName = `(${pc}pc) ${name}`;

    return (
        <Flex align="center" gap={8} className="set-menu-item"
              onClick={e => {
                  e.stopPropagation();
                  onToggle();
              }}
        >
            <label
                className="modern-checkbox"
            >
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={onToggle}
                />
            </label>

            <img src={icon} alt={name} style={{ width: 20, height: 20 }} />
            <Text style={{ whiteSpace: "nowrap" }}>{displayName}</Text>
        </Flex>
    );
}

export default function AllowedSetDropdown({
                                               setOptions,
                                               handleSetOptionChange
}) {
    const [open, setOpen] = useState(false);
    return (
        <Popover
            trigger="click"
            open={open}
            onOpenChange={setOpen}
            placement="bottomLeft"
            content={
                <div style={{ overflowY: "auto" }}>
                    <SetCompositionSelector
                        setOptions={setOptions}
                        handleSetOptionChange={handleSetOptionChange}
                    />
                </div>
            }
        >
            <button className="toggle custom-select small"> ◉ Allowed Sets</button>
        </Popover>
    );
}

export function groupEchoSelectorSetsByPiece() {
    const base = groupEchoSetsByPiece();

    const out = {};

    for (const pc of [5, 3, 2]) {
        const col1 = base[pc];
        let col2 = [];

        if (pc < 5) {
            const allSets = [...base[2], ...base[3], ...base[5]];

            col2 = allSets.filter(s => s.pieceCount + pc <= 5);
        }

        out[pc] = { col1, col2 };
    }

    return {base, grouped: out};
}
