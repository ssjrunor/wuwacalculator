import weapons from '../weaponDetails.json';

export async function fetchWeapons() {
    return weapons.reduce((acc, weapon) => {
        const id = weapon.Id ?? weapon.id ?? weapon.weaponId;
        if (!id) return acc;

        acc[id] = {
            ...weapon,
            icon: `https://api.hakush.in/ww/UI/UIResources/Common/Image/IconWeapon/T_IconWeapon${id}_UI.webp`
        };

        return acc;
    }, {});
}