import {isEqual} from "lodash";
import {getDefaultRotationEntries} from "../constants/charBasicRotations.js";
import {skillTypeIconMap, skillTypeLabelMap} from "../components/rotations-ui/SkillMenu.jsx";

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

function makeId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }

    if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
        const buf = new Uint8Array(16);
        crypto.getRandomValues(buf);

        const hex = [...buf].map(b => b.toString(16).padStart(2, "0")).join("");
        return (
            hex.slice(0, 8) + "-" +
            hex.slice(8, 12) + "-" +
            hex.slice(12, 16) + "-" +
            hex.slice(16, 20) + "-" +
            hex.slice(20)
        );
    }

    return (
        "fallback-" +
        Date.now().toString(36) +
        "-" +
        Math.random().toString(36).slice(2)
    );
}

export function makeEntry (skill, entry = null) {
    const type = Array.isArray(skill.type) ? skill.type[0] : skill.type;
    const iconPath =
        type &&
        typeof type === "string" &&
        skillTypeIconMap[type.toLowerCase?.()]
            ? skillTypeIconMap[type.toLowerCase()]
            : null;

    return {
        id: makeId(),
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
        type: "skill",
    };
}