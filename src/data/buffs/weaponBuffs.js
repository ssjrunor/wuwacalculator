import {elementToAttribute} from "@/utils/attributeHelpers.js";

export function applyWeaponBuffLogic({ mergedBuffs, characterState, activeCharacter }) {
    const state = characterState?.activeStates ?? {};

    const buffs = {
        staticMist: () => {
            const rank = state['staticMist_rank'] ?? 0;
            const values = [0, 10, 12.5, 15, 17.5, 20];
            mergedBuffs.atk.percent += values[rank];
        },
        stellarSymphony: () => {
            const rank = state['stellarSymphony_rank'] ?? 0;
            const values = [0, 14, 17.5, 21, 24.5, 28];
            mergedBuffs.atk.percent += values[rank];
        },
        luminousHymn: () => {
            const rank = state['luminousHymn_rank'] ?? 0;
            const values = [0, 30, 37.5, 45, 52.5, 60];
            mergedBuffs.skillType.spectroFrazzle.amplify += values[rank];
        },
        woodlandAria: () => {
            const rank = state['woodlandAria_rank'] ?? 0;
            const values = [0, 10, 11.5, 13, 14.5, 16];
            mergedBuffs.attribute.aero.resShred += values[rank];
        },
        bloodpactsPledge: () => {
            const rank = state['bloodpactsPledge_rank'] ?? 0;
            const values = [0, 10, 14, 18, 22, 26];
            mergedBuffs.attribute.aero.amplify += values[rank];
        },
        wildfireMark: () => {
            const rank = state['wildfireMark_rank'] ?? 0;
            const values = [0, 24, 30, 36, 42, 48];
            mergedBuffs.attribute.fusion.dmgBonus += values[rank];
        },
        emeraldSentence: () => {
            const rank = state['emeraldSentence_rank'] ?? 0;
            const values = [0, 20, 25, 30, 35, 40];
            mergedBuffs.skillType.echoSkill.dmgBonus += values[rank];
        },
        kumokiri: () => {
            const rank = state['kumokiri_rank'] ?? 0;
            const values = [0, 24, 30, 36, 42, 48];
            mergedBuffs.attribute.all.dmgBonus += values[rank];
        },
        spectrumBlaster: () => {
            const rank  = state['spectrumBlaster_rank'] ?? 0;
            const stacks = state['spectrumBlaster_stacks'] ?? 0;
            if (rank <= 0 || stacks <= 0) return;
            const perStackValues = [0, 8, 10, 12, 14, 16];
            const perStack = perStackValues[rank] ?? 0;
            const total = perStack * stacks;

            mergedBuffs.dmgBonus += total;
        },
        starfieldCalibrator: () => {
            const rank = state['starfieldCalibrator_rank'] ?? 0;
            const values = [0, 20, 25, 30, 35, 40];
            mergedBuffs.critDmg += values[rank];
        },
    };

    Object.keys(buffs).forEach(key => {
        if ((state[`${key}_rank`] ?? 0) > 0) {
            buffs[key]();
        }
    });

    return mergedBuffs;
}

export function applyWeaponSkillMetaBuffLogic({ mergedBuffs, characterState, skillMeta, combatState }) {
    const state = characterState?.activeStates ?? {};
    const element = skillMeta.element;

    const buffs = {
        /*woodlandAria: () => {
            const rank = state['woodlandAria_rank'] ?? 0;
            const values = [0, 10, 11.5, 13, 14.5, 16];
            skillMeta.skillResIgnore = (skillMeta.skillResIgnore ?? 0) +
                (element === 'aero' && combatState.aeroErosion ? values[rank] : 0);
        },*/
    };

    Object.keys(buffs).forEach(key => {
        if ((state[`${key}_rank`] ?? 0) > 0) {
            buffs[key]();
        }
    });

    return { skillMeta }
}

export function getActiveStateWeapons(activeStates) {
    if (!activeStates) return [];

    const weaponIdMap = {
        staticMist: 21030015,
        stellarSymphony: 21050036,
        luminousHymn: 21050046,
        bloodpactsPledge: 21020046,
        woodlandAria: 21030026,
        wildfireMark: 21010036,
        emeraldSentence: 21020066,
        kumokiri: 21010056,
        spectrumBlaster: 21030046,
        starfieldCalibrator: 21010066,
    };

    return Object.entries(weaponIdMap)
        .map(([key, id]) => {
            const value = activeStates?.[`${key}_rank`];
            return typeof value === 'number' && value > 0
                ? { id, key, value }
                : null;
        })
        .filter(Boolean);
}