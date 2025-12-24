import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputPath = path.join(__dirname, '../characters-mapped.json');
const outputPath = path.join(__dirname, '../characterStates.json');

const DEFAULT_CRIT_RATE = 5;
const DEFAULT_CRIT_DMG = 150;
const DEFAULT_ENERGY_REGEN = 100;

const bonusesTemplate = {
    basicAttackBonus: 0,
    heavyAttackBonus: 0,
    resonanceSkillBonus: 0,
    resonanceLiberationBonus: 0,
    glacioDmgBonus: 0,
    fusionDmgBonus: 0,
    electroDmgBonus: 0,
    aeroDmgBonus: 0,
    spectroDmgBonus: 0,
    havocDmgBonus: 0,
    healingBonus: 0
};

function generateStates() {
    const rawData = fs.readFileSync(inputPath, 'utf-8');
    const characters = JSON.parse(rawData);

    const output = {};

    Object.entries(characters).forEach(([charId, charData]) => {
        const baseStats = charData?.Stats?.["0"]?.["1"] ?? { Life: 0, Atk: 0, Def: 0 };

        output[charId] = {
            Name: charData.Name,
            Id: charData.Id,
            Rarity: charData.Rarity,
            Attribute: charData.Element ?? 0,
            WeaponType: charData.Weapon ?? 0,
            Stats: {
                hp: baseStats.Life ?? 0,
                atk: baseStats.Atk ?? 0,
                def: baseStats.Def ?? 0,
                critRate: DEFAULT_CRIT_RATE,
                critDmg: DEFAULT_CRIT_DMG,
                energyRegen: DEFAULT_ENERGY_REGEN,
                ...bonusesTemplate
            },
            CurrentLevelMultipliers: {},
            CurrentSequenceLevel: 0,
            CurrentWeapon: null,
            CharacterLevel: 1,
            sprite: `/assets/sprite/${charData.Id}.webp`
        };
    });

    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
    //console.log(`characterStates.json generated at ${outputPath}`);
}

generateStates();