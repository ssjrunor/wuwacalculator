//------------------------------------------------------
// 1. Group Echo Sets by piece type
//------------------------------------------------------

import { echoSets } from "@shared/constants/echoSetData2.js";
import { setIconMap } from "@shared/constants/echoSetData2.js";

 export function computeAllowTable(selected, setOptions) {
    const solverSelections = convertUISelectionToSolver(selected, setOptions.grouped);
    return buildAllowTableFromUISelections(solverSelections);
}

export function convertUISelectionToSolver(selected, grouped) {
    const selections = [];

    for (const pc of [5, 3, 2]) {
        const pcInt = Number(pc);
        const col1 = grouped[pcInt].col1;
        const col2 = grouped[pcInt].col2;

        const allSets = [...col1, ...col2];

        for (const s of allSets) {
            const isSelected = selected[pc]?.[s.id];
            if (isSelected) {
                selections.push({
                    setId: s.id,
                    pieceCount: s.pieceCount
                });
            }
        }
    }

    return selections;
}

function toEchoSetList(setObjMap = echoSets) {
    return Object.entries(setObjMap).map(([id, cfg]) => ({
        id: Number(id),
        name: cfg.name,
        fivePiece: cfg.desc?.fivePiece ?? cfg.fivePiece,
        threePiece: cfg.desc?.threePiece ?? cfg.threePiece,
        twoPiece: cfg.desc?.twoPiece ?? cfg.twoPiece
    }));
}

export function groupEchoSetsByPiece(setObjMap = echoSets) {
    const result = {
        5: [],
        3: [],
/*
        2: []
*/
    };

    for (const set of toEchoSetList(setObjMap)) {
        if (set.fivePiece) {
            result[5].push({
                id: set.id,
                name: set.name,
                icon: setIconMap[set.id],
                pieceCount: 5,
                selected: true
            });
        }

        if (set.threePiece) {
            result[3].push({
                id: set.id,
                name: set.name,
                icon: setIconMap[set.id],
                pieceCount: 3,
                selected: true
            });
        }
/*
        if (set.twoPiece) {
            result[2].push({
                id: set.id,
                name: set.name,
                icon: setIconMap[set.id],
                pieceCount: 2
            });
        }*/
    }

    return result;
}



//------------------------------------------------------
// 2. Precompute column 1 & 2 for the Set UI
//------------------------------------------------------
// Rules:
//  col1 → sets of EXACT piece count
//  col2 → sets where col1.pc + set.pc <= 5
//------------------------------------------------------

export function precomputeSetPaneColumns(grouped) {
    const result = {
        5: { col1: [], col2: [] },
        3: { col1: [], col2: [] },
        2: { col1: [], col2: [] }
    };

    const allPcs = [5, 3, 2];

    for (const pc of allPcs) {

        // Column 1: exact matches
        const col1 = grouped[pc] ?? [];

        // Column 2: only for pc < 5
        let col2 = [];

        if (pc < 5) {
            col2 = [
                ...grouped[2],
                ...grouped[3],
                ...grouped[5]
            ].filter((set) => set.pieceCount + pc <= 5);
        }

        result[pc] = { col1, col2 };
    }

    return result;
}



//------------------------------------------------------
// 3. Build user-selected base compositions
//------------------------------------------------------
// Example:
//  user picks 2pc Set X   → [X, X, 0, 0, 0]
//  user picks 3pc Set Y   → [Y, Y, Y, 0, 0]
//------------------------------------------------------

export function buildBaseCompositionsFromSelections(selections) {
    // selections = [{ setId: 18, pieceCount: 2 }, {...}, ...]

    const results = [];

    for (const sel of selections) {
        const sid = sel.setId;
        const pc = sel.pieceCount;

        const vector = [0, 0, 0, 0, 0];

        for (let i = 0; i < pc; i++) {
            vector[i] = sid;
        }

        results.push(vector);
    }

    return results;
}



//------------------------------------------------------
// 4. Permutation Generator (order-independent matching)
//------------------------------------------------------

export function generateAllOrders(arr) {
    const result = [];

    function permute(input, prefix = []) {
        if (input.length === 0) {
            result.push(prefix);
            return;
        }

        for (let i = 0; i < input.length; i++) {
            const copy = input.slice();
            const next = copy.splice(i, 1);
            permute(copy.slice(), prefix.concat(next));
        }
    }

    permute(arr);
    return result;
}



//------------------------------------------------------
// 5. Convert base compositions into ALL permutations
//    (This is what actually makes slot-order irrelevant)
//------------------------------------------------------

export function expandCompositions(baseComps) {
    const fullList = [];

    for (const base of baseComps) {
        const perms = generateAllOrders(base);
        fullList.push(...perms);
    }

    return fullList;
}



//------------------------------------------------------
// 6. Allow Table Construction
//------------------------------------------------------
// This maps each setId → allowed composition vectors that contain it.
//
// Example:
//   comp = [18,18,0,0,0]
//   comp = [18,18,18,18,0]
// produces:
//   allowTable.get(18) → Set{ [18,18,0,0,0], [18,18,18,18,0], ... }
//------------------------------------------------------

export function buildEchoSetAllowTable(compositions) {
    const table = new Map();

    for (const comp of compositions) {
        for (const s of comp) {
            if (s === 0) continue;
            if (!table.has(s)) table.set(s, new Set());
            table.get(s).add(comp);
        }
    }

    return table;
}



//------------------------------------------------------
// 7. End-to-end helper for UI → Allow filtering
//------------------------------------------------------

export function buildAllowTableFromUISelections(selections) {
    // Step 1: build base vectors
    const base = buildBaseCompositionsFromSelections(selections);

    // Step 2: expand into all permutations
    const expanded = expandCompositions(base);

    // Step 3: build allow-table
    return buildEchoSetAllowTable(expanded);
}



//------------------------------------------------------
// 8. Final Assembly — everything your solver needs
//------------------------------------------------------

export function buildFullEchoSetSolver(setObjMap = echoSets) {
    // Step A: group base sets by piece
    const grouped = groupEchoSetsByPiece(setObjMap);

    // Step B: precompute col1/col2 for UI
    const uiColumns = precomputeSetPaneColumns(grouped);

    return {
        grouped,       // {2:[],3:[],5:[]}
        uiColumns,     // {2:{col1,col2}, ...}
        buildBaseCompositionsFromSelections,
        expandCompositions,
        buildEchoSetAllowTable,
        buildAllowTableFromUISelections
    };
}
