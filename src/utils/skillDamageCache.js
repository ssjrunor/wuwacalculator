import {isEqual} from "lodash";
import {getDefaultRotationEntries} from "../constants/charBasicRotations.js";
import {skillTypeIconMap, skillTypeLabelMap} from "../components/SkillMenu.jsx";

let cachedSkillDamage = [];

export function setSkillDamageCache(data) {
    cachedSkillDamage = data;
}

export function getSkillDamageCache() {
    return cachedSkillDamage;
}

export function buildRotation(charId, groupedSkillOptions) {
    const builtRotations = [];
    const rotationData = getDefaultRotationEntries(charId);
    const entries = rotationData?.entries;

    if (!Array.isArray(entries) || entries.length === 0) return null;

    function findSkillInGroups(entryName, entryTab = null) {
        const nameLower = entryName.toLowerCase();

        if (entryTab && groupedSkillOptions[entryTab]) {
            const foundInTab = groupedSkillOptions[entryTab].find(skill =>
                skill.name.toLowerCase().includes(nameLower)
            );
            if (foundInTab) return foundInTab;
        }

        for (const tab in groupedSkillOptions) {
            const found = groupedSkillOptions[tab].find(skill =>
                skill.name.toLowerCase().includes(nameLower)
            );
            if (found) return found;
        }

        return null;
    }

    for (const entry of entries) {
        const entryName = entry.name.toLowerCase();
        const entryTab = entry.tab ?? null;
        const skill = findSkillInGroups(entryName, entryTab);
        if (skill) {
            builtRotations.push(makeEntry(skill, entry));
        }
    }

    return { builtRotations, link: rotationData.link };
}


export function makeEntry (skill, entry = null) {
    const type = Array.isArray(skill.type) ? skill.type[0] : skill.type;
    const iconPath = type && typeof type === 'string' && skillTypeIconMap[type.toLowerCase?.()]
        ? skillTypeIconMap[type.toLowerCase()]
        : null;

    return {
        id: crypto.randomUUID(),
        label: skill.name,
        detail: skillTypeLabelMap[type] ?? type,
        tab: skill.tab,
        iconPath,
        visible: skill.visible,
        multiplier: entry?.multiplier ?? 1,
        locked: false,
        snapshot: undefined,
        createdAt: Date.now(),
        element: skill.element ?? null,
        type: 'skill'
    };
}