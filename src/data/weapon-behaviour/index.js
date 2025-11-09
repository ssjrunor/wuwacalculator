const modules = import.meta.glob('./*.js', { eager: true });

const weaponLogicMap = {};

for (const path in modules) {
    const file = modules[path];
    const weaponId = path.match(/\/(\d+)\.js$/)?.[1];

    if (weaponId) {
        if (file.applyWeaponLogic) {
            weaponLogicMap[weaponId] = file.applyWeaponLogic;
        }
    }
}

export function getWeaponOverride(weaponId) {
    const logicModule = modules[`./${weaponId}.js`];
    if (!logicModule) return null;

    return {
        applyWeaponLogic: logicModule.applyWeaponLogic,
        updateSkillMeta: logicModule.updateSkillMeta
    };
}