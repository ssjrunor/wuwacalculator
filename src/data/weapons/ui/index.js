const modules = import.meta.glob('./*.jsx', { eager: true });

const weaponUIMap = {};

for (const path in modules) {
    const file = modules[path];
    const weaponId = path.match(/\/(\d+)\.jsx$/)?.[1];
    if (weaponId && file.WeaponUI) weaponUIMap[weaponId] = file.WeaponUI;
}

export function getWeaponUIComponent(weaponId) {
    return weaponUIMap[String(weaponId)] ?? null;
}