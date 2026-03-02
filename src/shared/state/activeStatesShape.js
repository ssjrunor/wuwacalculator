// Shared helpers for the structured activeStates shape.
// This adds nested containers but does not migrate legacy flat keys.

export function activeStates() {
    return {
        // Per-character switches/stacks/passives
        character: {
            toggles: {},   // booleans keyed by effect
            stacks: {},    // numeric stacks keyed by effect
            passives: {},  // e.g., sequence, innate conversions
            skill: {},     // skill-slot specific toggles if needed
        },

        // Weapon-bound toggles/ranks/stacks
        weapon: {
            id: null,
            rank: null,
            toggles: {},
            stacks: {},
        },

        // Echo-related toggles (main slot and set effects)
        echo: {
            main: { enabled: true, toggles: {}, stacks: {} },
            sets: {},      // per-set {p1?, p2?, stacks?, value?}
            specials: {},  // echo-specific toggles/stacks not tied to sets
        },

        // Team-level effects (optional)
        team: [],         // e.g., [{slot:0,charId:...,buffs:{}}]

        // Rotation-specific gates
        rotation: {
            toggles: {},
            stacks: {},
        },

        // Misc/UI-only flags
        misc: {
            uiFlags: {},
            debug: {},
        },
    };
}
