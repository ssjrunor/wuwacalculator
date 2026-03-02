import iconLinks from '../iconLinks.json';

const LOCAL_ICON_MAP = Object.fromEntries(iconLinks.map(entry => [String(entry.id), entry.url]));
const DEFAULT_API_PREFIX = 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common/Image/IconRoleHead256/T_IconRoleHead256_';

export async function fetchCharacters() {
    try {
        const data = await import('../characters-mapped.json');

        if (!Array.isArray(data.default)) {
            throw new Error("Loaded characters-mapped.json is not an array.");
        }

        const characters = data.default.map(char => {
            const charId = String(char.Id ?? char.id ?? char.link ?? '');
            const localIcon = LOCAL_ICON_MAP[charId];
            const fallbackIcon = `${DEFAULT_API_PREFIX}${charId}_UI.png`;

            return {
                displayName: char.Name ?? 'Unknown',
                icon: localIcon ?? fallbackIcon,
                link: charId,
                attribute: char.Element ?? 0,
                weaponType: char.Weapon ?? 0,
                raw: char
            };
        });

        return characters;
    } catch (error) {
        console.error('Error loading characters-mapped.json:', error);
        return [];
    }
}
