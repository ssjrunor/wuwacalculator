const fs = require('fs');
const path = require('path');
const axios = require('axios');

const INDEX_URL = 'https://api.encore.moe/en/echo';
const ECHO_BASE_URL = 'https://api.encore.moe/en/echo';
const OUTPUT_PATH = path.join(__dirname, '../echoes.json');

const SKIP_EXISTING = false;

async function fetchEchoIndex() {
    const { data } = await axios.get(INDEX_URL);
    const list = Array.isArray(data?.Echo) ? data.Echo : [];
    if (!list.length) {
        throw new Error('Unexpected echo index payload (missing Echo list)');
    }
    return list;
}

async function fetchEchoDetails(echoId) {
    const { data } = await axios.get(`${ECHO_BASE_URL}/${echoId}`);
    return data;
}

function toParamArray(levelDescStrArray = []) {
    return levelDescStrArray.map((row) =>
        Array.isArray(row?.ArrayString) ? row.ArrayString.map(v => String(v)) : []
    );
}

function toGroupMap(fetterGroups = []) {
    const out = {};
    const setPieces = [2, 5];

    for (const group of fetterGroups) {
        const groupId = String(group?.Id ?? '');
        if (!groupId) continue;

        const set = {};
        const fetters = Array.isArray(group?.Fetters) ? group.Fetters : [];
        fetters.forEach((fetter, index) => {
            const piece = setPieces[index] ?? (index + 1);
            const desc = fetter?.EffectDescription ?? '';
            const param = desc.match(/-?\d+(\.\d+)?%?/g) ?? [];
            set[String(piece)] = { Desc: desc, Param: param };
        });

        out[groupId] = {
            Id: Number(group?.Id ?? 0),
            Name: group?.Name ?? '',
            Icon: group?.Icon ?? '',
            Color: 'FFFFFF00',
            Set: set
        };
    }

    return out;
}

function normalizeEcho(summary, detail) {
    const id = Number(summary?.Id ?? detail?.MonsterId ?? 0);
    const handbook = detail?.Handbook ?? {};
    const skill = detail?.Skill ?? {};

    return {
        id: String(id),
        Id: id,
        Code: handbook?.Name ?? '',
        Name: summary?.Name ?? detail?.MonsterName ?? '',
        Type: handbook?.TypeDescrtption ?? detail?.TypeDescription ?? summary?.Type ?? '',
        Intensity: handbook?.Intensity ?? '',
        Place: handbook?.Place ?? '',
        Icon: summary?.Icon ?? detail?.Icon ?? '',
        Skill: {
            Desc: skill?.DescriptionEx ?? skill?.SimplyDescription ?? '',
            SimpleDesc: skill?.SimplyDescription ?? '',
            Param: toParamArray(skill?.LevelDescStrArray ?? []),
            Icon: skill?.SpecialBattleViewIcon ?? skill?.BattleViewIcon ?? ''
        },
        Group: toGroupMap(summary?.FetterGroups ?? []),
        Rarity: Array.isArray(summary?.Rarity) ? summary.Rarity : [2, 3, 4, 5],
        IntensityCode: summary?.Rarity ?? detail?.Rarity ?? 0,
        MonsterInfo: detail?.MonsterId ?? null
    };
}

async function fetchAllEchoes() {
    const echoList = await fetchEchoIndex();

    let existingEchoes = [];
    if (SKIP_EXISTING && fs.existsSync(OUTPUT_PATH)) {
        existingEchoes = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf8'));
    }

    const existingIds = new Set(
        existingEchoes.map(e => String(e?.id ?? e?.Id ?? ''))
    );
    const allEchoes = SKIP_EXISTING ? [...existingEchoes] : [];

    for (const summary of echoList) {
        const id = String(summary?.Id ?? '');
        if (!id) continue;

        if (SKIP_EXISTING && existingIds.has(id)) {
            console.log(`Skipping ${id} (already exists)`);
            continue;
        }

        try {
            const echoData = await fetchEchoDetails(id);
            const normalized = normalizeEcho(summary, echoData);
            allEchoes.push(normalized);
            console.log(`Fetched echo ${id}`);
        } catch (error) {
            console.warn(`Failed to fetch ${id}: ${error.message}`);
        }
    }

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(allEchoes, null, 2));
    console.log(`Saved ${allEchoes.length} echoes to echoes.json`);
}

fetchAllEchoes().catch(console.error);
