export function three22SkillMeta ({ activeStates, skillMeta }) {
    if (activeStates?.flamewingsShadow2pcP1 && skillMeta.skillType.includes('heavy')) {
        skillMeta.skillCritRate = (skillMeta.skillCritRate ?? 0) + 20;
    }
    if (activeStates?.flamewingsShadow2pcP2 && skillMeta.skillType.includes('echoSkill')) {
        skillMeta.skillCritRate = (skillMeta.skillCritRate ?? 0) + 20;
    }
    return { skillMeta };
}