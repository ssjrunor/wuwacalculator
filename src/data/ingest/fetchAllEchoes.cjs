const fs = require('fs');
const path = require('path');
const axios = require('axios');

const INDEX_URL = 'https://api.hakush.in/ww/data/echo.json';
const ECHO_BASE_URL = 'https://api.hakush.in/ww/data/en/echo';
const OUTPUT_PATH = path.join(__dirname, '../echoes.json');

const SKIP_EXISTING = false;

async function fetchEchoIndex() {
    const { data } = await axios.get(INDEX_URL);
    return Array.isArray(data) ? data : Object.keys(data);
}

async function fetchEchoDetails(echoId) {
    const { data } = await axios.get(`${ECHO_BASE_URL}/${echoId}.json`);
    return data;
}

async function fetchAllEchoes() {
    const echoList = await fetchEchoIndex();

    let existingEchoes = [];
    if (SKIP_EXISTING && fs.existsSync(OUTPUT_PATH)) {
        existingEchoes = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf8'));
    }

    const existingIds = new Set(existingEchoes.map(e => e.id));
    const allEchoes = SKIP_EXISTING ? [...existingEchoes] : [];

    for (let id of echoList) {
        if (SKIP_EXISTING && existingIds.has(id)) {
            console.log(`Skipping ${id} (already exists)`);
            continue;
        }

        try {
            const echoData = await fetchEchoDetails(id);
            allEchoes.push({ id, ...echoData });
            console.log(`Fetched echo ${id}`);
        } catch (error) {
            console.warn(`Failed to fetch ${id}: ${error.message}`);
        }
    }

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(allEchoes, null, 2));
    console.log(`Saved ${allEchoes.length} echoes to echoes.json`);
}

fetchAllEchoes().catch(console.error);