import React, { useState } from 'react';
import GuidesModal from "@/shared/ui/common/GuideModal.jsx";
import ConfirmationModal from "@/shared/ui/common/ConfirmationModal.jsx";
import NotificationToast from "@/shared/ui/common/NotificationToast.jsx";

const percentageFields = new Set([
    'atkPercent', 'hpPercent', 'defPercent',
    'critRate', 'critDmg', 'energyRegen', 'healingBonus',
    'basicAtk', 'heavyAtk', 'resonanceSkill', 'resonanceLiberation', 'coord', 'echoSkill',
    'aero', 'glacio', 'spectro', 'fusion', 'electro', 'havoc',
    'basicAtkAmplify', 'heavyAtkAmplify', 'resonanceSkillAmplify',
    'resonanceLiberationAmplify', 'coordAmplify',
    'echoSkillAmplify', 'aeroAmplify', 'glacioAmplify',
    'spectroAmplify', 'fusionAmplify', 'electroAmplify', 'havocAmplify',
    'enemyResShred', 'enemyDefShred', 'enemyDefIgnore',
    'spectroFrazzleAmplify', 'aeroErosionAmplify',
    'spectroFrazzleDmg', 'aeroErosionDmg'
]);

const flatFields = new Set(['atkFlat', 'hpFlat', 'defFlat']);

// --- mapping: UI keys -> nested buff structure ---

// Main stats
const statFieldMap = {
    atkFlat:     { statKey: 'atk', subKey: 'flat' },
    atkPercent:  { statKey: 'atk', subKey: 'percent' },
    hpFlat:      { statKey: 'hp', subKey: 'flat' },
    hpPercent:   { statKey: 'hp', subKey: 'percent' },
    defFlat:     { statKey: 'def', subKey: 'flat' },
    defPercent:  { statKey: 'def', subKey: 'percent' }
};

// Skill-type DMG% (dmgBonus)
const damageTypeDmgMap = {
    basicAtk:           { skillKey: 'basicAtk' },
    heavyAtk:           { skillKey: 'heavyAtk' },
    resonanceSkill:     { skillKey: 'resonanceSkill' },
    resonanceLiberation:{ skillKey: 'resonanceLiberation' },
    coord:              { skillKey: 'coord' },
    echoSkill:          { skillKey: 'echoSkill' },
    spectroFrazzleDmg:  { skillKey: 'spectroFrazzle' },
    aeroErosionDmg:     { skillKey: 'aeroErosion' }
};

// Skill-type Amplify
const damageTypeAmplifyMap = {
    basicAtkAmplify:            { skillKey: 'basicAtk' },
    heavyAtkAmplify:            { skillKey: 'heavyAtk' },
    resonanceSkillAmplify:      { skillKey: 'resonanceSkill' },
    resonanceLiberationAmplify: { skillKey: 'resonanceLiberation' },
    coordAmplify:               { skillKey: 'coord' },
    echoSkillAmplify:           { skillKey: 'echoSkill' },
    spectroFrazzleAmplify:      { skillKey: 'spectroFrazzle' },
    aeroErosionAmplify:         { skillKey: 'aeroErosion' }
};

// Element DMG% (dmgBonus)
const elementDmgMap = {
    aero:    { attrKey: 'aero' },
    glacio:  { attrKey: 'glacio' },
    spectro: { attrKey: 'spectro' },
    fusion:  { attrKey: 'fusion' },
    electro: { attrKey: 'electro' },
    havoc:   { attrKey: 'havoc' }
};

// Element Amplify
const elementAmplifyMap = {
    aeroAmplify:    { attrKey: 'aero' },
    glacioAmplify:  { attrKey: 'glacio' },
    spectroAmplify: { attrKey: 'spectro' },
    fusionAmplify:  { attrKey: 'fusion' },
    electroAmplify: { attrKey: 'electro' },
    havokAmplify:   { attrKey: 'havoc' } // typo-safe, but we'll use the correct key below
};
elementAmplifyMap.havocAmplify = { attrKey: 'havoc' }; // ensure correct key

// Global enemy modifiers (applied to attribute.all)
const resFieldMap = {
    enemyResShred:  'resShred',
    enemyDefShred:  'defShred',
    enemyDefIgnore: 'defIgnore'
};

function makeBaseBuffs() {
    return { percent: 0, flat: 0 };
}

function makeModBuffs() {
    return {
        resShred: 0,
        dmgBonus: 0,
        amplify: 0,
        defIgnore: 0,
        defShred: 0,
        dmgVuln: 0,
        critRate: 0,
        critDmg: 0
    };
}

function createEmptyCustomBuffs() {
    return {
        atk: makeBaseBuffs(),
        hp: makeBaseBuffs(),
        def: makeBaseBuffs(),

        skillType: {
            all: makeModBuffs(),
            basicAtk: makeModBuffs(),
            heavyAtk: makeModBuffs(),
            resonanceSkill: makeModBuffs(),
            resonanceLiberation: makeModBuffs(),
            introSkill: makeModBuffs(),
            coord: makeModBuffs(),
            echoSkill: makeModBuffs(),
            outroSkill: makeModBuffs(),
            spectroFrazzle: makeModBuffs(),
            aeroErosion: makeModBuffs(),
            havocBane: makeModBuffs(),
            electroFlare: makeModBuffs()
        },

        attribute: {
            all: makeModBuffs(),
            aero: makeModBuffs(),
            glacio: makeModBuffs(),
            spectro: makeModBuffs(),
            fusion: makeModBuffs(),
            electro: makeModBuffs(),
            havoc: makeModBuffs(),
            physical: makeModBuffs()
        },

        flatDmg: 0,
        physical: 0,
        critRate: 0,
        critDmg: 0,
        energyRegen: 0,
        healingBonus: 0,
        shieldBonus: 0
    };
}

function isAllZero(obj) {
    if (obj == null) return true;
    if (typeof obj === 'number') return obj === 0;
    if (typeof obj === 'object') {
        return Object.values(obj).every(isAllZero);
    }
    return true;
}

export default function CustomBuffsPane({ customBuffs, setCustomBuffs }) {
    const [showToast, setShowToast] = useState(false);
    const [popupMessage, setPopupMessage] = useState({
        icon: null,
        message: null,
        color: null
    });

    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmMessage, setConfirmMessage] = useState({
        title: null,
        message: null,
        confirmLabel: null,
        cancelLabel: null,
        onConfirm: () => {},
        onCancel: () => {}
    });

    const [showGuide, setShowGuide] = useState(false);
    const [guideCategory, setGuideCategory] = useState(null);

    const openGuide = React.useCallback((category) => {
        setGuideCategory(category);
        setShowGuide(true);
    }, []);

    const handleChange = (key, value) => {
        const num = Number(value);
        let clamped = Number.isNaN(num) ? 0 : num;

        if (percentageFields.has(key)) {
            clamped = Math.min(Math.max(clamped, 0), 999);
        } else if (flatFields.has(key)) {
            clamped = Math.min(Math.max(clamped, 0), 9999);
        }

        // main stats: atk/hp/def
        if (statFieldMap[key]) {
            const { statKey, subKey } = statFieldMap[key];
            setCustomBuffs(prev => {
                const current = prev ?? {};
                const statObj = {
                    ...(current[statKey] ?? makeBaseBuffs())
                };
                statObj[subKey] = clamped;
                return { ...current, [statKey]: statObj };
            });
            return;
        }

        // global scalar stats
        if (['critRate', 'critDmg', 'energyRegen', 'healingBonus', 'shieldBonus'].includes(key)) {
            setCustomBuffs(prev => ({
                ...(prev ?? {}),
                [key]: clamped
            }));
            return;
        }

        // skill-type DMG% (dmgBonus)
        if (damageTypeDmgMap[key]) {
            const { skillKey } = damageTypeDmgMap[key];
            setCustomBuffs(prev => {
                const current = prev ?? {};
                const skillType = { ...(current.skillType ?? {}) };
                const mod = { ...(skillType[skillKey] ?? makeModBuffs()) };
                mod.dmgBonus = clamped;
                skillType[skillKey] = mod;
                return { ...current, skillType };
            });
            return;
        }

        // skill-type Amplify
        if (damageTypeAmplifyMap[key]) {
            const { skillKey } = damageTypeAmplifyMap[key];
            setCustomBuffs(prev => {
                const current = prev ?? {};
                const skillType = { ...(current.skillType ?? {}) };
                const mod = { ...(skillType[skillKey] ?? makeModBuffs()) };
                mod.amplify = clamped;
                skillType[skillKey] = mod;
                return { ...current, skillType };
            });
            return;
        }

        // element DMG% (attribute.*.dmgBonus)
        if (elementDmgMap[key]) {
            const { attrKey } = elementDmgMap[key];
            setCustomBuffs(prev => {
                const current = prev ?? {};
                const attribute = { ...(current.attribute ?? {}) };
                const mod = { ...(attribute[attrKey] ?? makeModBuffs()) };
                mod.dmgBonus = clamped;
                attribute[attrKey] = mod;
                return { ...current, attribute };
            });
            return;
        }

        // element Amplify (attribute.*.amplify)
        if (elementAmplifyMap[key]) {
            const { attrKey } = elementAmplifyMap[key];
            setCustomBuffs(prev => {
                const current = prev ?? {};
                const attribute = { ...(current.attribute ?? {}) };
                const mod = { ...(attribute[attrKey] ?? makeModBuffs()) };
                mod.amplify = clamped;
                attribute[attrKey] = mod;
                return { ...current, attribute };
            });
            return;
        }

        // global enemy res/def mods (attribute.all.*)
        if (resFieldMap[key]) {
            const field = resFieldMap[key];
            setCustomBuffs(prev => {
                const current = prev ?? {};
                const attribute = { ...(current.attribute ?? {}) };
                const all = { ...(attribute.all ?? makeModBuffs()) };
                all[field] = clamped;
                attribute.all = all;
                return { ...current, attribute };
            });
            return;
        }

        // fallback: store at top-level (for anything we missed)
        setCustomBuffs(prev => ({
            ...(prev ?? {}),
            [key]: clamped
        }));
    };

    const renderInput = (key) => {
        let value = 0;
        const buffs = customBuffs ?? {};

        // main stats
        if (statFieldMap[key]) {
            const { statKey, subKey } = statFieldMap[key];
            value = buffs[statKey]?.[subKey] ?? 0;
        }
        // global scalar stats
        else if (['critRate', 'critDmg', 'energyRegen', 'healingBonus', 'shieldBonus'].includes(key)) {
            value = buffs[key] ?? 0;
        }
        // skill-type DMG%
        else if (damageTypeDmgMap[key]) {
            const { skillKey } = damageTypeDmgMap[key];
            value = buffs.skillType?.[skillKey]?.dmgBonus ?? 0;
        }
        // skill-type Amplify
        else if (damageTypeAmplifyMap[key]) {
            const { skillKey } = damageTypeAmplifyMap[key];
            value = buffs.skillType?.[skillKey]?.amplify ?? 0;
        }
        // element DMG%
        else if (elementDmgMap[key]) {
            const { attrKey } = elementDmgMap[key];
            value = buffs.attribute?.[attrKey]?.dmgBonus ?? 0;
        }
        // element Amplify
        else if (elementAmplifyMap[key]) {
            const { attrKey } = elementAmplifyMap[key];
            value = buffs.attribute?.[attrKey]?.amplify ?? 0;
        }
        // enemy res/def mods
        else if (resFieldMap[key]) {
            const field = resFieldMap[key];
            value = buffs.attribute?.all?.[field] ?? 0;
        }
        // fallback
        else {
            value = buffs[key] ?? 0;
        }

        return percentageFields.has(key) ? (
            <div className="input-with-suffix">
                <input
                    type="number"
                    value={value}
                    onChange={e => handleChange(key, e.target.value)}
                />
                <span>%</span>
            </div>
        ) : (
            <input
                type="number"
                value={value}
                onChange={e => handleChange(key, e.target.value)}
            />
        );
    };

    const clearAll = () => {
        setCustomBuffs(createEmptyCustomBuffs());
    };

    const allZero = isAllZero(customBuffs);

    return (
        <>
            <div className="character-settings" style={{ position: 'relative' }}>
                <button
                    onClick={() => openGuide('Custom Buffs')}
                    className="btn-primary echoes"
                    style={{
                        alignSelf: 'center',
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        display: 'inline-flex',
                        zIndex: 10
                    }}
                >
                    See Guide
                </button>
                <h3>Main Stats</h3>
                <div className="buff-grid">
                    {[
                        ['Attack', 'atkFlat', 'atkPercent'],
                        ['HP', 'hpFlat', 'hpPercent'],
                        ['Defense', 'defFlat', 'defPercent']
                    ].map(([label, flatKey, percentKey]) => (
                        <div className="buff-row" key={label}>
                            <label>{label}</label>
                            <div className="dual-input">
                                {renderInput(flatKey)}
                                {renderInput(percentKey)}
                            </div>
                        </div>
                    ))}

                    {[
                        ['Crit Rate', 'critRate'],
                        ['Crit DMG', 'critDmg'],
                        ['Energy Regen', 'energyRegen'],
                        ['Healing Bonus', 'healingBonus']
                    ].map(([label, key]) => (
                        <div className="buff-row" key={key}>
                            <label>{label}</label>
                            {renderInput(key)}
                        </div>
                    ))}
                </div>
            </div>

            <div className="character-settings">
                <h3>Damage Modifiers</h3>
                <div className="buff-grid">
                    {[
                        ['Basic Attack DMG', 'basicAtk'],
                        ['Heavy Attack DMG', 'heavyAtk'],
                        ['Resonance Skill DMG', 'resonanceSkill'],
                        ['Resonance Liberation DMG', 'resonanceLiberation'],
                        ['Coordinated DMG', 'coord'],
                        ['Echo Skill DMG', 'echoSkill'],
                        ['Aero DMG', 'aero'],
                        ['Glacio DMG', 'glacio'],
                        ['Spectro DMG', 'spectro'],
                        ['Fusion DMG', 'fusion'],
                        ['Electro DMG', 'electro'],
                        ['Havoc DMG', 'havoc'],
                        ['Basic Attack DMG Amplify', 'basicAtkAmplify'],
                        ['Heavy Attack DMG Amplify', 'heavyAtkAmplify'],
                        ['Resonance Skill DMG Amplify', 'resonanceSkillAmplify'],
                        ['Resonance Liberation DMG Amplify', 'resonanceLiberationAmplify'],
                        ['Coordinated DMG Amplify', 'coordAmplify'],
                        ['Echo Skill DMG Amplify', 'echoSkillAmplify'],
                        ['Aero DMG Amplify', 'aeroAmplify'],
                        ['Glacio DMG Amplify', 'glacioAmplify'],
                        ['Spectro DMG Amplify', 'spectroAmplify'],
                        ['Fusion DMG Amplify', 'fusionAmplify'],
                        ['Electro DMG Amplify', 'electroAmplify'],
                        ['Havoc DMG Amplify', 'havocAmplify'],
                        ['Enemy Res Shred', 'enemyResShred'],
                        ['Enemy DEF Shred', 'enemyDefShred'],
                        ['Enemy DEF Ignore', 'enemyDefIgnore'],
                        ['Spectro Frazzle DMG', 'spectroFrazzleDmg'],
                        ['Aero Erosion DMG', 'aeroErosionDmg'],
                        ['Spectro Frazzle DMG Amplify', 'spectroFrazzleAmplify'],
                        ['Aero Erosion DMG Amplify', 'aeroErosionAmplify']
                    ].map(([label, key]) => (
                        <div className="buff-row" key={key}>
                            <label>{label}</label>
                            {renderInput(key)}
                        </div>
                    ))}
                </div>
            </div>

            <button
                className="clear-button"
                onClick={() => {
                    if (!customBuffs || allZero) {
                        setPopupMessage({
                            message: 'Looks clear to me... (゜。゜)',
                            icon: '❤',
                            color: { light: 'green', dark: 'limegreen' },
                        });
                        setShowToast(true);
                    } else {
                        setConfirmMessage({
                            confirmLabel: 'Clear Custom Buffs',
                            onConfirm: () => {
                                clearAll();
                                setPopupMessage({
                                    message: 'Cleared~! (〜^∇^)〜',
                                    icon: '✔',
                                    color: { light: 'green', dark: 'limegreen' },
                                });
                                setShowToast(true);
                            },
                        });
                        setShowConfirm(true);
                    }
                }}
            >
                Clear All
            </button>

            <GuidesModal
                open={showGuide}
                category={guideCategory}
                onClose={() => setShowGuide(false)}
            />

            {showConfirm && (
                <ConfirmationModal
                    open={showConfirm}
                    title={confirmMessage.title}
                    message={confirmMessage.message}
                    confirmLabel={confirmMessage.confirmLabel}
                    onConfirm={confirmMessage.onConfirm}
                    onCancel={confirmMessage.onCancel}
                    onClose={() => setShowConfirm(false)}
                />
            )}

            {showToast && popupMessage.message && (
                <NotificationToast
                    message={popupMessage.message}
                    icon={popupMessage.icon}
                    color={popupMessage.color}
                    duration={popupMessage.duration ?? 4000}
                    prompt={popupMessage.prompt ?? null}
                    onClose={
                        popupMessage.onClose
                            ? popupMessage.onClose
                            : () => setTimeout(() => setShowToast(false), 300)
                    }
                    position="top"
                    bold
                />
            )}
        </>
    );
}