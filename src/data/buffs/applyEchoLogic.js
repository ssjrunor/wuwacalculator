import { echoSets } from "@/constants/echoSetData2.js";
import { setIconMap } from "@/constants/echoSetData2.js";

export function applyEchoLogic({ mergedBuffs, characterState }) {
    const echo = characterState?.activeStates ?? {};

    if (echo.rejuvenatingGlow) mergedBuffs.atk.percent += 15;
    if (echo.moonlitClouds) mergedBuffs.atk.percent += 22.5;
    if (echo.impermanenceHeron) mergedBuffs.attribute.all.dmgBonus += 12;
    if (echo.bellBorne) mergedBuffs.attribute.all.dmgBonus += 10;
    if (echo.fallacy) mergedBuffs.atk.percent += 10;
    if (echo.midnightVeil) mergedBuffs.attribute.havoc.dmgBonus += 15;
    if (echo.empyreanAnthem) mergedBuffs.atk.percent += 20;
    if (echo.gustsOfWelkin) mergedBuffs.attribute.aero.dmgBonus += 15;
    if (echo.clawprint) mergedBuffs.attribute.fusion.dmgBonus += 15;
    if (echo.neonlightLeapToggle) mergedBuffs.atk.percent += 15;
    if (echo.hyvatia) mergedBuffs.attribute.all.dmgBonus += 10;

    const lawOfHarmonyStack = echo.lawOfHarmony ?? 0;
    mergedBuffs.skillType.echoSkill.dmgBonus += 8 * lawOfHarmonyStack;

    const neonlightOffTune = echo.neonlightOffTune ?? 0;
    mergedBuffs.atk.percent += neonlightOffTune * 0.3;

    const starryRadiance = echo.starryRadiance ?? 0;
    mergedBuffs.atk.percent += starryRadiance * 0.2;

    return mergedBuffs;
}


export function getActiveEchoes(activeStates = {}) {
    const echoKeyToNameMap = {
        rejuvenatingGlow: 'Rejuvenating Glow',
        moonlitClouds: 'Moonlit Clouds',
        impermanenceHeron: 'Impermanence Heron',
        bellBorne: 'Bell-Borne Geochelone',
        fallacy: 'Fallacy of Dawn',
        midnightVeil: 'Midnight Veil',
        empyreanAnthem: 'Empyrean Anthem',
        gustsOfWelkin: 'Gusts of Welkin',
        clawprint: 'Flaming Clawprint',
        lawOfHarmony: 'Law of Harmony',
        neonlightLeap: 'Pact of Neonlight Leap',
        starryRadiance: 'Halo of Starry Radiance',
        hyvatia: 'Hyvatia'
    };

    const result = [];

    Object.entries(echoKeyToNameMap).forEach(([key, name]) => {
        const value = activeStates[key];
        if (value === true || (typeof value === 'number' && value > 0)) {
            const echoSet = Object.entries(echoSets).find(([, e]) => e.name === name);
            if (echoSet) {
                const [setId, setData] = echoSet;
                result.push({
                    id: Number(setId),
                    name: setData.name,
                    icon: setIconMap[Number(setId)] || '/assets/echoes/default.webp'
                });
            }
        }
    });

    return result;
}
