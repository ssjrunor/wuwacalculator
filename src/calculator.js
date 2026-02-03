// Centralized calculator-level helpers so heavy per-render work can be done
// once in Calculator.jsx and passed into child components as props.

import { getSetCounts } from "@/utils/echoHelper.js";
import { echoSetList } from "@/constants/echoSetData2.js";
import {
  getEchoStatsFromEquippedEchoes,
  getEchoScores,
  getTop5SubstatScoreDetails,
} from "@/utils/echoHelper.js";
import { statKeywords } from "@/constants/echoSetData.jsx";
import { groupEchoSetsByPiece } from "@/features/optimizer/core/misc/index.js";
import { getGroupedSkillOptions } from "@/utils/prepareDamageData.js";
import { getEchoPresetById } from "@/state/echoPresetStore.js";

const DEFAULT_ENEMY_RES = {
  0: 20,
  1: 60,
  2: 20,
  3: 20,
  4: 20,
  5: 20,
  6: 20,
};

// ---------- Echoes ----------
export const echoesService = {
  /**
   * Precompute expensive echo-derived aggregates for a character.
   */
  computeEchoMeta({ charId, equippedEchoes = [] }) {
    const setCounts = getSetCounts(equippedEchoes);

    const setRequirements = new Map(
      echoSetList.map((set) => [set.id, set.threePiece ? 3 : 2])
    );
    const hasSetEffects = Object.entries(setCounts).some(([setId, count]) => {
      const required = setRequirements.get(Number(setId)) ?? 2;
      return count >= required;
    });

    const echoStatTotals = getEchoStatsFromEquippedEchoes(equippedEchoes);
    const maxScore = getTop5SubstatScoreDetails(charId).total;
    const perEchoScores = equippedEchoes.map((echo, idx) => {
      const score = getEchoScores(charId, echo).totalScore ?? 0;
      return { index: idx, score, echo };
    });

    return {
      setCounts,
      setRequirements,
      hasSetEffects,
      echoStatTotals,
      maxScore,
      perEchoScores,
    };
  },
};

// ---------- Weapons ----------
export const weaponService = {
  /**
   * Build filtered/sorted lists and lookups for weapons of a given type.
   */
  prepareWeapons({ weapons = {}, weaponType }) {
    const list = Object.values(weapons)
      .filter(
        (w) =>
          typeof w.Id === "number" &&
          String(w.Id).length >= 8 &&
          (weaponType == null || w.Type === weaponType)
      )
      .sort((a, b) => (b.Rarity ?? 0) - (a.Rarity ?? 0));

    const weaponById = Object.fromEntries(list.map((w) => [w.Id, w]));
    const iconPaths = list.map((w) => `/assets/weapon-icons/${w.Id}.webp`);
    const keywords = [
      ...statKeywords.flatMap((key) => [
        `${key} DMG Bonus`,
        `${key} Damage Bonus`,
        `${key} DMG`,
        `${key} Damage`,
        key,
      ]),
      "Negative Statuses",
      "Negative Status",
    ];

    return { list, weaponById, iconPaths, keywords };
  },
};

// ---------- Enemies ----------
export const enemyService = {
  buildEnemyMap(enemies = [], customEnemies = []) {
    const all = [...enemies, ...customEnemies];
    const map = {};
    all.forEach((e) => {
      const key = String(e?.Id ?? e?.id ?? e?.monsterId ?? "");
      if (key) map[key] = e;
    });
    return { all, map };
  },

  normalizeRes(resolvedEnemy, currentRes, toaActive) {
    const res = resolvedEnemy?.baseData?.res ?? currentRes ?? {};
    const normalized = { ...DEFAULT_ENEMY_RES };
    for (let i = 0; i <= 6; i++) {
      const key = String(i);
      if (typeof res[i] === "number") normalized[i] = res[i];
      else if (typeof res[key] === "number") normalized[i] = res[key];
    }
    if (!toaActive) return normalized;

    // apply ToA mapping
    const mapped = {};
    Object.entries(normalized).forEach(([k, v]) => {
      const num = Number(v);
      if (Number.isFinite(num) && num === 10) mapped[k] = 20;
      else if (Number.isFinite(num) && num === 40) mapped[k] = 60;
      else mapped[k] = num;
    });
    return mapped;
  },

  filterEnemies({ enemies = [], search = "", element = null, enemyClass = null }) {
    const term = search.trim().toLowerCase();
    return enemies.filter((e) => {
      const matchesSearch =
        term.length === 0 ||
        (e?.Name ?? "").toLowerCase().includes(term) ||
        String(e?.Id ?? e?.id ?? e?.monsterId ?? "").includes(term);
      const matchesElement = element == null || e?.Element === element;
      const matchesClass = enemyClass == null || e?.Class === enemyClass;
      return matchesSearch && matchesElement && matchesClass;
    });
  },
};

// ---------- Optimizer / Suggestions / Rotations ----------
export const skillGroupingService = {
  groupedSkillOptions({ skillResults = [], hasRotationEntries = false }) {
    const groups = getGroupedSkillOptions({ skillResults });
    if (hasRotationEntries) {
      if (!groups.combo) groups.combo = [];
      groups.combo.unshift({
        name: "Total Rotation DMG",
        type: "combo",
        tab: "combo",
        visible: true,
        element: null,
      });
    }
    return groups;
  },
};

export const optimizerService = {
  defaultSetOptions() {
    return groupEchoSetsByPiece();
  },

  topScore(charId) {
    return getTop5SubstatScoreDetails(charId).total;
  },
};

export const suggestionsService = {
  rotationAwareSkill({ skillResults = [], rotationTotals = {}, suggestionSettings = {} }) {
    const { tab, level, rotationMode } = suggestionSettings ?? {};
    const base = skillResults.find(
      (s) => (s.name === level?.label || s.name === level?.Name) && s.tab === tab
    ) ?? {};

    if (!rotationMode) return base;

    return {
      ...base,
      name: "Total Rotation DMG",
      label: "Total Rotation DMG",
      avg: rotationTotals.avg ?? 0,
      normal: rotationTotals.normal ?? 0,
      crit: rotationTotals.crit ?? 0,
    };
  },

  cacheKey({
    charId,
    level,
    tab,
    echoData = [],
    rotationMode = false,
    rotationEntries = [],
    skillResults = [],
  }) {
    const hashParts = (parts) => {
      let h = 5381;
      for (const part of parts) {
        const s = String(part ?? "");
        for (let i = 0; i < s.length; i++) {
          h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
        }
      }
      return h >>> 0;
    };

    const echoSig =
      echoData?.map((e) =>
        e
          ? [
              e.id ?? "null",
              e.cost ?? "",
              e.mainStat ?? "",
              e.mainStatValue ?? "",
              e.secondStat ?? "",
              e.secondStatValue ?? "",
              e.sonpieces?.id ?? e.setId ?? "",
            ].join("|")
          : "null"
      ) ?? [];

    const rotationSig = rotationMode
      ? rotationEntries?.map((e) => `${e?.label}|${e?.tab}|${e?.multiplier ?? 1}`) ?? []
      : [];

    const skillResultsSig = rotationMode
      ? skillResults?.map((s) => `${s?.skillId ?? s?.name}|${s?.avg ?? ""}`) ?? []
      : [];

    const parts = [
      "c",
      charId ?? "",
      "ln",
      level?.Name ?? "",
      "tb",
      tab ?? "",
      "rm",
      rotationMode ? "1" : "0",
      ...echoSig,
      ...rotationSig,
      ...skillResultsSig,
    ];

    return hashParts(parts);
  },
};

// ---------- Overview ----------
export const overviewService = {
  buildWeaponMap(weaponsRaw = []) {
    const map = {};
    weaponsRaw.forEach((w) => {
      map[w.id] = w;
    });
    return map;
  },
};

// ---------- Echo bag / presets ----------
export const echoBagService = {
  filterEchoes({ echoes = [], cost = null, setId = null, search = "" }) {
    const term = search.trim().toLowerCase();
    return echoes
      .filter((echo) => {
        const matchesCost = cost == null || echo.cost === cost;
        const matchesName = echo?.name?.toLowerCase().includes(term);
        const matchesSet = setId == null || echo.selectedSet === setId;
        return matchesCost && matchesName && matchesSet;
      })
      .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
  },

  filterPresets({ presets = [], filterOption = "char", selectedFilters = [] }) {
    if (!filterOption || selectedFilters.length === 0) return presets;

    if (filterOption === "char") {
      return presets.filter((p) => selectedFilters.includes(String(p.charId)));
    }

    if (filterOption === "equipped") {
      return presets.filter((p) =>
        p.equipped?.some((id) => selectedFilters.includes(String(id)))
      );
    }

    return presets;
  },

  resolvePreset(presetOrId) {
    return typeof presetOrId === "string" || typeof presetOrId === "number"
      ? getEchoPresetById(presetOrId)
      : presetOrId;
  },
};

// ---------- Skills modal ----------
export const skillsModalService = {
  skillForTab(activeCharacter, tab) {
    if (!activeCharacter?.raw?.SkillTrees) return null;
    const tree = Object.values(activeCharacter.raw.SkillTrees).find(
      (t) => t.Skill?.Type?.toLowerCase().replace(/\s/g, "") === tab.toLowerCase()
    );
    return tree?.Skill ?? null;
  },
};

// ---------- Character overview ----------
export const characterOverviewService = {
  buildCharacterMap(characters = []) {
    return Object.fromEntries(characters.map((c) => [String(c.link), c]));
  },

  sortedIds(characterRuntimeStates = {}, characterMap = {}) {
    return Object.keys(characterRuntimeStates)
      .filter((id) => characterMap[id])
      .sort((a, b) => {
        const charA = characterMap[a];
        const charB = characterMap[b];

        if ((charA.attribute ?? 99) !== (charB.attribute ?? 99)) {
          return (charA.attribute ?? 99) - (charB.attribute ?? 99);
        }

        return (charA.displayName ?? "").localeCompare(charB.displayName ?? "");
      });
  },
};

// Fallback: export everything as a single namespace for convenience.
export default {
  echoesService,
  weaponService,
  enemyService,
  skillGroupingService,
  optimizerService,
  suggestionsService,
  overviewService,
  echoBagService,
  skillsModalService,
  characterOverviewService,
};
