import { echoes } from '../json-data-scripts/getEchoes.js';
import { echoSets } from '../constants/echoSetData2.js';
import { setIconMap } from '../constants/echoSetData2.js';

export const echoImageMap = {};
for (const echo of echoes) {
    if (!echo.icon || !echo.name) continue;
    echoImageMap[echo.name] = echo.icon;
}

export const setNameImageMap = {};
export const setIdFromName = {};
for (const [idStr, set] of Object.entries(echoSets)) {
    const id = Number(idStr);
    const name = set.name;
    const path = setIconMap[id];

    if (name && path) {
        setNameImageMap[name] = path;
        setIdFromName[name] = id;
    }
}

export default { echoImageMap, setNameImageMap };
