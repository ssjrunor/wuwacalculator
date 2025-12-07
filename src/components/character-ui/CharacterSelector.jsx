import React, {useEffect} from 'react';
import SequenceSkillsBox from './SequenceSkillsBox.jsx';
import CharacterHeader from './CharacterHeader.jsx';
import CharacterMenu from './CharacterMenu.jsx';
import SkillSettings from './SkillSettings.jsx';
import { formatDescription } from '../../utils/formatDescription.js';
import { getCharacterUIComponent } from '../../data/character-ui/index.js';
import { getCustomInherentSkillsComponent } from '../../data/character-ui/index.js';
import {highlightKeywordsInText} from "../../constants/echoSetData.jsx";
import {makeBaseBuffs, makeModBuffs} from "../../utils/getUnifiedStatPool.js";

const cleanTooltipText = html => html.replace(/<[^>]*>?/gm, '');

const traceNodeIconMap = {
    'ATK+': 'atk', 'HP+': 'hp', 'HP Up': 'hp','DEF+': 'def',
    'Healing Bonus+': 'healing-bonus',
    'Crit. Rate+': 'crit-rate', 'Crit. Rate Up': 'crit-rate',
    'Crit. DMG+': 'crit-dmg',
    'Aero DMG Bonus+': 'aero-bonus',
    'Glacio DMG Bonus+': 'glacio-bonus',
    'Spectro DMG Bonus+': 'spectro-bonus',
    'Fusion DMG Bonus+': 'fusion-bonus',
    'Electro DMG Bonus+': 'electro-bonus',
    'Havoc DMG Bonus+': 'havoc-bonus'
};

export const traceIcons = Object.values(traceNodeIconMap);

// ---- NEW: trace buff mapping into unified structure ----
const traceBuffMap = {
    // main stats: percent only
    'ATK+':            { type: 'stat', stat: 'atk' },
    'HP+':             { type: 'stat', stat: 'hp' },
    'HP Up':           { type: 'stat', stat: 'hp' },
    'DEF+':            { type: 'stat', stat: 'def' },

    // scalar stats
    'Healing Bonus+':  { type: 'scalar', key: 'healingBonus' },
    'Crit. Rate+':     { type: 'scalar', key: 'critRate' },
    'Crit. Rate Up':   { type: 'scalar', key: 'critRate' },
    'Crit. DMG+':      { type: 'scalar', key: 'critDmg' },

    // element dmg bonus
    'Aero DMG Bonus+':    { type: 'attribute', attr: 'aero' },
    'Glacio DMG Bonus+':  { type: 'attribute', attr: 'glacio' },
    'Spectro DMG Bonus+': { type: 'attribute', attr: 'spectro' },
    'Fusion DMG Bonus+':  { type: 'attribute', attr: 'fusion' },
    'Electro DMG Bonus+': { type: 'attribute', attr: 'electro' },
    'Havoc DMG Bonus+':   { type: 'attribute', attr: 'havoc' }
};

/**
 * Fresh trace buff object in the unified shape.
 * Only fields we actually care about for traces are filled.
 */
export function createEmptyTraceBuffs() {
    return {
        atk: makeBaseBuffs(),
        hp:  makeBaseBuffs(),
        def: makeBaseBuffs(),

        attribute: {
            aero:    makeModBuffs(),
            glacio:  makeModBuffs(),
            spectro: makeModBuffs(),
            fusion:  makeModBuffs(),
            electro: makeModBuffs(),
            havoc:   makeModBuffs(),
            physical: makeModBuffs()
        },

        critRate: 0,
        critDmg: 0,
        healingBonus: 0,

        activeNodes: {}
    };
}

/**
 * Apply a single trace buff (by skill name and % value) into the traceBuffs object.
 */
export function applyTraceBuff(traceBuffs, skillName, value) {
    const info = traceBuffMap[skillName];
    if (!info || !Number.isFinite(value) || value === 0) return;

    switch (info.type) {
        case 'stat': {
            const key = info.stat;
            const statObj = traceBuffs[key] ?? (traceBuffs[key] = makeBaseBuffs());
            statObj.percent += value;
            break;
        }
        case 'scalar': {
            const key = info.key;
            traceBuffs[key] = (traceBuffs[key] ?? 0) + value;
            break;
        }
        case 'attribute': {
            const attrKey = info.attr;
            const attribute = traceBuffs.attribute ?? (traceBuffs.attribute = {});
            const mod = attribute[attrKey] ?? (attribute[attrKey] = makeModBuffs());
            mod.dmgBonus += value;
            break;
        }
        default:
            break;
    }
}

export default function CharacterSelector({
                                              characters, activeCharacter, handleCharacterSelect, menuRef, menuOpen,
                                              attributeIconPath, currentSliderColor, sliderValues, setSliderValues,
                                              characterLevel, setCharacterLevel, setSkillsModalOpen, setMenuOpen,
                                              traceNodeBuffs, setTraceNodeBuffs,
                                              characterRuntimeStates, setCharacterRuntimeStates, isDark, triggerRef,
                                              characterStates, keywords, rarityMap
                                          }) {
    const safeLevel = Math.min(Math.max(Number(characterLevel ?? 1), 1), 90);
    const charId = activeCharacter?.Id ?? activeCharacter?.id ?? activeCharacter?.link;
    const activeStates = characterRuntimeStates?.[charId]?.activeStates ?? {};
    const CustomCharacterUI = getCharacterUIComponent(charId);
    const CustomInherents = getCustomInherentSkillsComponent(charId);
    const sequenceToggles = characterRuntimeStates?.[charId]?.sequenceToggles ?? {};
    const inherentSkillUnlockLevels = [50, 70];

    const toggleState = (stateKey) => {
        setCharacterRuntimeStates(prev => ({
            ...prev,
            [charId]: {
                ...(prev[charId] ?? {}),
                activeStates: {
                    ...(prev[charId]?.activeStates ?? {}),
                    [stateKey]: !(prev[charId]?.activeStates?.[stateKey] ?? false)
                }
            }
        }));
    };

    const toggleSequence = (seqKey) => {
        setCharacterRuntimeStates(prev => ({
            ...prev,
            [charId]: {
                ...(prev[charId] ?? {}),
                sequenceToggles: {
                    ...(prev[charId]?.sequenceToggles ?? {}),
                    [seqKey]: !(prev[charId]?.sequenceToggles?.[seqKey] ?? false)
                }
            }
        }));
    };

    const maxedSkills = (
        characterLevel === 90 &&
        Object.entries(sliderValues).every(([key, value]) => key === 'sequence' || value === 10) &&
        Object.entries(activeCharacter.raw?.SkillTrees ?? {}).every(([nodeId, node]) => {
            if (node.NodeType === 4 && node.Skill?.Name) {
                return traceNodeBuffs.activeNodes?.[nodeId];
            }
            return true;
        })
    );

    return (
        <>
            <CharacterHeader
                activeCharacter={activeCharacter}
                rarityMap={rarityMap}
                setMenuOpen={setMenuOpen}
                attributeIconPath={attributeIconPath}
                menuOpen={menuOpen}
                triggerRef={triggerRef}
                charId={charId}
            />

            <div className="character-settings">
                <div className="slider-group">
                    <div
                        className='level-group'
                        style={{display:'flex', justifyContent: 'space-between'}}
                    >
                        <div className="slider-label-with-input">
                            <label>Level</label>
                            <input
                                type="number"
                                className="character-level-input"
                                value={safeLevel}
                                min="1"
                                max="90"
                                onChange={(e) => {
                                    const val = Number(e.target.value);
                                    if (!isNaN(val)) {
                                        setCharacterLevel(Math.min(Math.max(val, 1), 90));
                                    }
                                }}
                            />
                        </div>
                        <button
                            className={`btn-primary max ${maxedSkills ? 'maxed' : ''}`}
                            style={{
                                padding:'1px 5px 1px 5px',
                                background: 'none',
                                opacity: '0.5'
                            }}
                            disabled={maxedSkills}
                            onClick={() => {
                                setCharacterLevel(90);

                                setSliderValues(prev => {
                                    const newValues = { ...prev };
                                    for (const key of Object.keys(prev)) {
                                        if (key !== 'sequence') {
                                            newValues[key] = 10;
                                        }
                                    }
                                    return newValues;
                                });

                                // NEW: recompute ALL trace buffs in unified shape
                                setTraceNodeBuffs(prev => {
                                    const allActiveNodes = {};
                                    const buffs = createEmptyTraceBuffs();

                                    for (const [nodeId, node] of Object.entries(activeCharacter.raw?.SkillTrees ?? {})) {
                                        if (node.NodeType === 4 && node.Skill?.Name) {
                                            allActiveNodes[nodeId] = true;

                                            const skillName = node.Skill.Name;
                                            const percent = parseFloat(
                                                (node.Skill?.Param?.[0] ?? "0").replace('%', '')
                                            );
                                            applyTraceBuff(buffs, skillName, percent);
                                        }
                                    }

                                    buffs.activeNodes = allActiveNodes;
                                    return buffs;
                                });
                            }}
                        >
                            {maxedSkills ? 'Maxed ✓' : 'Max'}
                        </button>
                    </div>
                    <div className="slider-controls">
                        <input
                            type="range"
                            min="1"
                            max="90"
                            value={safeLevel}
                            onChange={(e) => setCharacterLevel(Number(e.target.value))}
                            style={{
                                '--slider-color': currentSliderColor,
                                '--slider-fill': `${((safeLevel - 1) / 89) * 100}%`
                            }}
                        />
                        <span>{safeLevel}</span>
                    </div>
                </div>

                <div className="slider-group">
                    <label>Sequence</label>
                    <div className="slider-controls">
                        <input
                            type="range"
                            min="0"
                            max="6"
                            value={sliderValues.sequence}
                            onChange={(e) =>
                                setSliderValues(prev => ({ ...prev, sequence: Number(e.target.value) }))
                            }
                            style={{
                                '--slider-color': currentSliderColor,
                                '--slider-fill': `${(sliderValues.sequence / 6) * 100}%`
                            }}
                        />
                        <span>{sliderValues.sequence}</span>
                    </div>
                </div>
            </div>

            <CharacterMenu
                characters={characters}
                handleCharacterSelect={handleCharacterSelect}
                menuRef={menuRef}
                menuOpen={menuOpen}
                setMenuOpen={setMenuOpen}
                rarityMap={rarityMap}
            />

            <SkillSettings
                sliderValues={sliderValues}
                setSliderValues={setSliderValues}
                currentSliderColor={currentSliderColor}
                setSkillsModalOpen={setSkillsModalOpen}
                keywords={keywords}
            />

            {activeCharacter && (
                <div className="inherent-skills-box">
                    {!CustomInherents && <h3>Inherent Skills</h3>}
                    {CustomInherents ? (
                        <CustomInherents
                            character={activeCharacter}
                            currentSliderColor={currentSliderColor}
                            characterRuntimeStates={characterRuntimeStates}
                            setCharacterRuntimeStates={setCharacterRuntimeStates}
                            toggleState={toggleState}
                            unlockLevels={inherentSkillUnlockLevels}
                            charLevel={safeLevel}
                            keywords={keywords}
                        />
                    ) : (
                        <div className="inherent-skills">
                            {Object.values(activeCharacter.raw?.SkillTrees ?? {})
                                .filter(node => node.Skill?.Type === "Inherent Skill")
                                .map((node, index) => {
                                    const unlockLevel = inherentSkillUnlockLevels[index] ?? 1;
                                    const isLocked = safeLevel < unlockLevel;

                                    return (
                                        <div key={index} className="inherent-skill">
                                            <h4 className={'highlight'}>{node.Skill?.Name}</h4>
                                            <p>
                                                {highlightKeywordsInText(formatDescription(node.Skill.Desc, node.Skill.Param, currentSliderColor), keywords)}
                                            </p>
                                            {isLocked && (
                                                <span style={{ fontSize: '12px', color: 'gray' }}>
                                                    Unlocks at Lv. {unlockLevel}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                        </div>
                    )}

                    <div className="buff-icons">
                        {Object.entries(activeCharacter.raw?.SkillTrees ?? {})
                            .filter(([, node]) =>
                                node.NodeType === 4 &&
                                node.Skill?.Name &&
                                traceNodeIconMap[node.Skill.Name]
                            )
                            .map(([nodeId, node]) => {
                                const iconFile = traceNodeIconMap[node.Skill.Name];
                                const themeSuffix = isDark ? 'dark' : 'light';
                                const iconPath = `/assets/skill-icons/${themeSuffix}/${iconFile}.webp?v=${themeSuffix}`;
                                const isActive = traceNodeBuffs?.activeNodes?.[nodeId] ?? false;
                                const tooltipText = cleanTooltipText(
                                    formatDescription(node.Skill.Desc, node.Skill.Param, currentSliderColor)
                                );

                                return (
                                    <div
                                        key={nodeId}
                                        className="buff-icon-wrapper"
                                        data-tooltip={tooltipText}
                                    >
                                        <img
                                            key={`${iconFile}-${themeSuffix}`}
                                            src={iconPath}
                                            alt={iconFile}
                                            className={`buff-icon ${isActive ? 'active' : ''}`}
                                            style={{
                                                '--slider-color': currentSliderColor,
                                            }}
                                            onClick={() => {
                                                setTraceNodeBuffs(prev => {
                                                    const prevActive = prev?.activeNodes ?? {};
                                                    const wasActive = !!prevActive[nodeId];
                                                    const newActiveNodes = {
                                                        ...prevActive,
                                                        [nodeId]: !wasActive
                                                    };

                                                    // recompute all trace buffs from scratch
                                                    const buffs = createEmptyTraceBuffs();
                                                    buffs.activeNodes = newActiveNodes;

                                                    for (const [id, isNodeActive] of Object.entries(newActiveNodes)) {
                                                        if (!isNodeActive) continue;
                                                        const otherNode = activeCharacter.raw?.SkillTrees?.[id];
                                                        const skillName = otherNode?.Skill?.Name;
                                                        if (!skillName) continue;

                                                        const value = parseFloat(
                                                            (otherNode.Skill?.Param?.[0] ?? "0").replace('%', '')
                                                        );
                                                        applyTraceBuff(buffs, skillName, value);
                                                    }

                                                    return buffs;
                                                });
                                            }}
                                        />
                                    </div>
                                );
                            })}
                    </div>

                    {CustomCharacterUI && (
                        <div className="echo-buff">
                            <CustomCharacterUI
                                activeStates={activeStates}
                                characterStates={characterStates}
                                toggleState={toggleState}
                                characterRuntimeStates={characterRuntimeStates}
                                setCharacterRuntimeStates={setCharacterRuntimeStates}
                                charId={charId}
                                currentSequenceLevel={sliderValues.sequence}
                            />
                        </div>
                    )}
                </div>
            )}

            <SequenceSkillsBox
                activeCharacter={activeCharacter}
                currentSliderColor={currentSliderColor}
                sliderValues={sliderValues}
                characterRuntimeStates={characterRuntimeStates}
                setCharacterRuntimeStates={setCharacterRuntimeStates}
                sequenceToggles={sequenceToggles}
                toggleSequence={toggleSequence}
                activeStates={activeStates}
                keywords={keywords}
            />
        </>
    );
}