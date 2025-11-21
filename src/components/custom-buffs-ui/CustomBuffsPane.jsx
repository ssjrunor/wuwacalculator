import React, {useState} from 'react';
import GuidesModal from "../utils-ui/GuideModal.jsx";
import ConfirmationModal from "../utils-ui/ConfirmationModal.jsx";
import NotificationToast from "../utils-ui/NotificationToast.jsx";

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

    const percentageFields = new Set([
        'atkPercent', 'hpPercent', 'defPercent',
        'critRate', 'critDmg', 'energyRegen', 'healingBonus',
        'basicAtk', 'heavyAtk', 'resonanceSkill', 'resonanceLiberation', 'coord',
        'aero', 'glacio', 'spectro', 'fusion', 'electro', 'havoc',
        'basicAtkAmplify', 'heavyAtkAmplify', 'resonanceSkillAmplify',
        'resonanceLiberationAmplify', 'coordAmplify',
        'echoSkill', 'echoSkillAmplify', 'aeroAmplify', 'glacioAmplify',
        'spectroAmplify', 'fusionAmplify', 'electroAmplify', 'havocAmplify',
        'enemyResShred', 'enemyDefShred', 'enemyDefIgnore',
        'spectroFrazzleAmplify', 'aeroErosionAmplify',
        'spectroFrazzleDmg', 'aeroErosionDmg'
    ]);

    const flatFields = new Set(['atkFlat', 'hpFlat', 'defFlat']);

    const handleChange = (key, value) => {
        const num = Number(value);
        let clamped = num;

        if (percentageFields.has(key)) {
            clamped = Math.min(Math.max(num, 0), 999);
        } else if (flatFields.has(key)) {
            clamped = Math.min(Math.max(num, 0), 9999);
        }

        const damageTypeMap = {
            basicAtkAmplify: 'basic',
            heavyAtkAmplify: 'heavy',
            resonanceSkillAmplify: 'skill',
            resonanceLiberationAmplify: 'ultimate',
            spectroFrazzleAmplify: 'spectroFrazzle',
            aeroErosionAmplify: 'aeroErosion',
            coordAmplify: 'coord',
            echoSkillAmplify: 'echoSkill'
        };

        if (damageTypeMap[key]) {
            setCustomBuffs(prev => ({
                ...prev,
                damageTypeAmplify: {
                    ...prev.damageTypeAmplify,
                    [damageTypeMap[key]]: clamped
                }
            }));
            return;
        }

        const elementAmplifyMap = {
            aeroAmplify: 'aero',
            glacioAmplify: 'glacio',
            spectroAmplify: 'spectro',
            fusionAmplify: 'fusion',
            electroAmplify: 'electro',
            havocAmplify: 'havoc'
        };

        if (elementAmplifyMap[key]) {
            setCustomBuffs(prev => ({
                ...prev,
                elementDmgAmplify: {
                    ...prev.elementDmgAmplify,
                    [elementAmplifyMap[key]]: clamped
                }
            }));
            return;
        }

        setCustomBuffs(prev => ({
            ...prev,
            [key]: clamped
        }));
    };

    const renderInput = (key) => {
        const damageTypeMap = {
            basicAtkAmplify: 'basic',
            heavyAtkAmplify: 'heavy',
            resonanceSkillAmplify: 'skill',
            resonanceLiberationAmplify: 'ultimate',
            spectroFrazzleAmplify: 'spectroFrazzle',
            aeroErosionAmplify: 'aeroErosion',
            coordAmplify: 'coord',
            echoSkillAmplify: 'echoSkill',
        };

        const elementAmplifyMap = {
            aeroAmplify: 'aero',
            glacioAmplify: 'glacio',
            spectroAmplify: 'spectro',
            fusionAmplify: 'fusion',
            electroAmplify: 'electro',
            havocAmplify: 'havoc'
        };

        let value = customBuffs[key] ?? 0;

        if (damageTypeMap[key]) {
            value = customBuffs.damageTypeAmplify?.[damageTypeMap[key]] ?? 0;
        }

        if (elementAmplifyMap[key]) {
            value = customBuffs.elementDmgAmplify?.[elementAmplifyMap[key]] ?? 0;
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
        setCustomBuffs({
            atkFlat: 0, atkPercent: 0, hpFlat: 0, hpPercent: 0, defFlat: 0, defPercent: 0,
            critRate: 0, critDmg: 0, energyRegen: 0, healingBonus: 0,
            basicAtk: 0, heavyAtk: 0, resonanceSkill: 0, resonanceLiberation: 0,
            aero: 0, glacio: 0, spectro: 0, fusion: 0, electro: 0, havoc: 0,
            coord: 0, coordAmplify: 0, basicAtkAmplify: 0, heavyAtkAmplify: 0,
            resonanceSkillAmplify: 0, resonanceLiberationAmplify: 0, aeroAmplify: 0,
            glacioAmplify: 0, spectroAmplify: 0, fusionAmplify: 0, electroAmplify: 0,
            havocAmplify: 0, enemyResShred: 0, enemyDefShred: 0, enemyDefIgnore: 0,
            spectroFrazzleDmg: 0, aeroErosionDmg: 0, spectroFrazzleAmplify: 0,
            aeroErosionAmplify: 0, echoSkillAmplify: 0, echoSkill: 0
        });
    }

    const allZero = Object.values(customBuffs).every(v => v === 0);

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
                                <input type="number" value={customBuffs[flatKey] ?? 0}
                                       onChange={e => handleChange(flatKey, e.target.value)} />
                                <div className="input-with-suffix">
                                    <input type="number" value={customBuffs[percentKey] ?? 0}
                                           onChange={e => handleChange(percentKey, e.target.value)} />
                                    <span>%</span>
                                </div>
                            </div>
                        </div>
                    ))}

                    {[['Crit Rate', 'critRate'], ['Crit DMG', 'critDmg'],
                        ['Energy Regen', 'energyRegen'], ['Healing Bonus', 'healingBonus']].map(([label, key]) => (
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
                        ['Basic Attack DMG', 'basicAtk'], ['Heavy Attack DMG', 'heavyAtk'],
                        ['Resonance Skill DMG', 'resonanceSkill'], ['Resonance Liberation DMG', 'resonanceLiberation'],
                        ['Coordinated DMG', 'coord'], ['Echo Skill DMG', 'echoSkill'],
                        ['Aero DMG', 'aero'], ['Glacio DMG', 'glacio'],
                        ['Spectro DMG', 'spectro'], ['Fusion DMG', 'fusion'], ['Electro DMG', 'electro'],
                        ['Havoc DMG', 'havoc'], ['Basic Attack DMG Amplify', 'basicAtkAmplify'],
                        ['Heavy Attack DMG Amplify', 'heavyAtkAmplify'], ['Resonance Skill DMG Amplify', 'resonanceSkillAmplify'],
                        ['Resonance Liberation DMG Amplify', 'resonanceLiberationAmplify'],
                        ['Coordinated DMG Amplify', 'coordAmplify'], ['Echo Skill DMG Amplify', 'echoSkillAmplify'],
                        ['Aero DMG Amplify', 'aeroAmplify'], ['Glacio DMG Amplify', 'glacioAmplify'],
                        ['Spectro DMG Amplify', 'spectroAmplify'], ['Fusion DMG Amplify', 'fusionAmplify'],
                        ['Electro DMG Amplify', 'electroAmplify'],
                        ['Havoc DMG Amplify', 'havocAmplify'], ['Enemy Res Shred', 'enemyResShred'],
                        ['Enemy DEF Shred', 'enemyDefShred'], ['Enemy DEF Ignore', 'enemyDefIgnore'],
                        ['Spectro Frazzle DMG', 'spectroFrazzleDmg'], ['Aero Erosion DMG', 'aeroErosionDmg'],
                        ['Spectro Frazzle DMG Amplify', 'spectroFrazzleAmplify'], ['Aero Erosion DMG Amplify', 'aeroErosionAmplify']
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