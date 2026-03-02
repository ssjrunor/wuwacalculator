import weapons from '../weaponDetails.json';

export async function fetchWeapons() {
    return weapons.reduce((acc, weapon) => {
        const id = weapon.Id ?? weapon.id ?? weapon.weaponId;
        if (!id) return acc;

        acc[id] = {
            ...weapon,
            icon: weapon.icon ?? `https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconWeapon/T_IconWeapon${id}_UI.png`
        };

        return acc;
    }, {});
}
