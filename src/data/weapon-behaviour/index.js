const modules = import.meta.glob('./*.js', { eager: true });

export function getWeaponOverride(weaponId) {
    const logicModule = modules[`./${weaponId}.js`];
    if (!logicModule) return null;

    return {
        applyWeaponLogic: logicModule.applyWeaponLogic,
        updateSkillMeta: logicModule.updateSkillMeta
    };
}