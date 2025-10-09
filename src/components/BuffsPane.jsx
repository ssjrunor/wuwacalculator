import React, { useEffect, useRef, useState } from 'react';
import CharacterMenu from './CharacterMenu';
import ExpandableSection from "./Expandable.jsx";
import EchoBuffs, {echoBuffList} from "./EchoBuffs.jsx";
import WeaponBuffs, {weaponBuffList} from "./WeaponBuffs.jsx";
import {loadCharacterBuffUI} from "../data/character-ui/index.js";
import { attributeColors } from '../utils/attributeHelpers';
import { X } from 'lucide-react';
import {preloadImages} from "../pages/calculator.jsx";
import {runInContext as echoBuffs, runInContext as weaponBuffs} from "lodash";
import {calculateRotationTotals} from "./Rotations.jsx";
import GuidesModal from "./GuideModal.jsx";

export default function BuffsPane({
                                      characters,
                                      activeCharacterId,
                                      team,
                                      setTeam,
                                        characterRuntimeStates,
                                        setCharacterRuntimeStates,
                                        activeCharacter,
                                        characterStates,
                                        rarityMap,
                                      savedRotations,
                                  }) {
    loadBase();
    const menuRef = useRef(null);
    const [characterMenuOpen, setCharacterMenuOpen] = useState(false);
    const [activeCharacterSlot, setActiveCharacterSlot] = useState(null);
    const charId = activeCharacter?.Id ?? activeCharacter?.id ?? activeCharacter?.link;
    const activeStates = characterRuntimeStates?.[charId]?.activeStates ?? {};
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

    const handleCharacterSelect = (char) => {
        if (activeCharacterSlot === 0) return;

        const newTeam = [...team];
        newTeam[activeCharacterSlot] = char.link;
        setTeam(newTeam);

        const mainCharId = team[0];
        setCharacterRuntimeStates(prev => ({
            ...prev,
            [mainCharId]: {
                ...(prev[mainCharId] ?? {}),
                Team: newTeam
            }
        }));

        setCharacterMenuOpen(false);
    };

    const getCharacterIcon = (charId) => {
        const character = characters.find(c => String(c.link) === String(charId));
        return character?.icon ?? null;
    };

    const getCharacterName = (charId) => {
        const character = characters.find(c => String(c.link) === String(charId));
        return character?.displayName ?? '';
    };

    const [characterBuffUIs, setCharacterBuffUIs] = useState({});

    useEffect(() => {
        const loadAllBuffUIs = async () => {
            const results = {};
            const teammateIds = team.slice(1).filter(Boolean);

            for (const id of teammateIds) {
                try {
                    const mod = await loadCharacterBuffUI(id);
                    if (mod) {
                        results[id] = mod;
                    }
                } catch (err) {
                    console.warn(`No buffUI for character ${id}`, err);
                }
            }

            setCharacterBuffUIs(results);
        };

        loadAllBuffUIs();
    }, [team]);

    const teamBase = characterStates.filter(char => team.map(Number).includes(char.Id));
    useEffect(() => {
        setCharacterRuntimeStates(prev => ({
            ...prev,
            [charId]: {
                ...(prev[charId] ?? {}),
                activeStates: {
                    ...(prev[charId]?.activeStates ?? {}),
                    teamBase: teamBase
                }
            }
        }));
    }, [team, charId, setCharacterRuntimeStates]);

    const runtime = characterRuntimeStates[charId];
    const teamRotation = runtime?.teamRotation ?? {};
    const hasValidTeamRotation = (
        runtime?.Team?.length > 1 &&
        typeof teamRotation === 'object' &&
        Object.keys(teamRotation ?? {}).length > 0
    );

    const [showGuide, setShowGuide] = useState(false);
    const [guideCategory, setGuideCategory] = useState(null);

    const openGuide = React.useCallback((category) => {
        setGuideCategory(category);
        setShowGuide(true);
    }, []);

    return (
        <div className="team-pane">
            <div
                className="rotation-buttons-left"
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}
            >
                <h3 className="panel-title menu-header">Team Setup</h3>
                <button
                    onClick={() => openGuide('Team Buffs')}
                    className="btn-primary echoes"
                    style={{ alignSelf: 'center' }}
                >
                    See Guide
                </button>
            </div>
            <div className="icon-body">
                {team.map((charId, index) => {
                    const rarity = rarityMap[charId]
                    const isActive = charId === activeCharacterId;
                    const isDisabled = index === 0;
                    const character = characters.find(c => String(c.link) === String(charId));
                    const isEmpty = !character;

                    return (
                        <div key={index} className="team-slot-wrapper">
                            <div
                                className={`team-slot ${isActive ? 'active' : ''} ${isDisabled ? 'locked' : ''}`}
                                onClick={() => {
                                    if (isDisabled && !isEmpty) return;
                                    setActiveCharacterSlot(index);
                                    setCharacterMenuOpen(true);
                                }}
                                style={{ cursor: !isDisabled ? 'pointer' : 'not-allowed' }}
                            >
                                {character?.icon ? (
                                    <img
                                        src={character.icon}
                                        alt={`Character ${index + 1}`}
                                        className={`header-icon rarity-${rarity} ${isDisabled ? 'locked' : ''}`}
                                        loading="lazy"
                                    />
                                ) : (
                                    <div className="team-icon empty-slot" />
                                )}

                                {!isDisabled && character && (
                                    <button
                                        className="remove-teammate-button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const newTeam = [...team];
                                            newTeam[index] = null;
                                            setTeam(newTeam);

                                            const mainCharId = team[0];
                                            setCharacterRuntimeStates(prev => ({
                                                ...prev,
                                                [mainCharId]: {
                                                    ...(prev[mainCharId] ?? {}),
                                                    Team: newTeam
                                                }
                                            }));
                                        }}
                                    >
                                        <X size={14} strokeWidth={2.5} />
                                    </button>
                                )}
                            </div>
                            <div className="character-name">{character?.displayName ?? ''}</div>
                        </div>
                    );
                })}
            </div>

            <ExpandableSection title="Echo Buffs">
                <EchoBuffs
                    activeStates={activeStates}
                    toggleState={toggleState}
                    characterId={charId}
                    characterRuntimeStates={characterRuntimeStates}
                    setCharacterRuntimeStates={setCharacterRuntimeStates}
                />
            </ExpandableSection>

            <ExpandableSection title="Weapon Buffs">
                <WeaponBuffs
                    activeStates={activeStates}
                    toggleState={toggleState}
                    charId={charId}
                    setCharacterRuntimeStates={setCharacterRuntimeStates}
                />
            </ExpandableSection>

            {team.slice(1).map((id, idx) => {
                if (!id || !characterBuffUIs[id]) return null;
                const TeammateBuffUI = characterBuffUIs[id];

                return (
                    <ExpandableSection key={id} title={`${getCharacterName(id)} Buffs`}>
                        <TeammateBuffUI
                            activeStates={activeStates}
                            toggleState={toggleState}
                            charId={charId}
                            setCharacterRuntimeStates={setCharacterRuntimeStates}
                            attributeColors={attributeColors}
                            characterRuntimeStates={characterRuntimeStates}
                        />
                    </ExpandableSection>
                );
            })}

            {hasValidTeamRotation && (
                <ExpandableSection
                    title="Rotations"
                    defaultOpen={true}
                >
                    <div
                        className="rotations-box"
                        style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}
                    >
                        {runtime?.Team?.slice(1, 3).map((teammateId, i) => {
                            const teammateIndex = i + 1;
                            const key = `teammateRotation-${teammateIndex}`;

                            const allTotals = getTeamRotationTotals(runtime, characterRuntimeStates, savedRotations)[teammateId];
                            if (!allTotals || allTotals.length === 0) return null;

                            const character = characters.find(c => String(c.link) === String(teammateId));
                            if (!character) return null;

                            const selectedTotal = teamRotation[teammateId] ?? allTotals[0];
                            const selectedId = selectedTotal.id;
                            const selectedIndex = allTotals.findIndex(entry => entry.id === selectedId);
                            const fallbackIndex = selectedIndex >= 0 ? selectedIndex : 0;
                            const currentTotal = allTotals[fallbackIndex];
                            const { avg, crit, normal } = currentTotal.total;

                            return (
                                <div key={teammateId} className="echo-buff">
                                    <div className="rotation-header">
                                        <span className="highlight">{character.displayName}</span>
                                        <span className="entry-type-detail">
                                            <select
                                                value={fallbackIndex}
                                                onChange={(e) => {
                                                    const selected = allTotals[Number(e.target.value)];
                                                    setCharacterRuntimeStates(prev => ({
                                                        ...prev,
                                                        [charId]: {
                                                            ...prev[charId],
                                                            teamRotation: {
                                                                ...(prev[charId]?.teamRotation ?? {}),
                                                                [teammateId]: selected
                                                            }
                                                        }
                                                    }));
                                                }}
                                                className="entry-detail-dropdown"
                                            >
                                                {allTotals.map((entry, index) => (
                                                    <option key={index} value={index}>
                                                        {entry.characterName ?? character.displayName}
                                                    </option>
                                                ))}
                                            </select>
                                        </span>
                                    </div>

                                    <div className="rotation-values">
                                        <span className="value-label">Normal</span>
                                        <span className="value">{Math.round(normal).toLocaleString()}</span>
                                        <span className="value-label">Crit</span>
                                        <span className="value">{Math.round(crit).toLocaleString()}</span>
                                        <span className="value-label">Avg</span>
                                        <span className="value avg" style={{ fontWeight: 'bold' }}>
                                            {Math.round(avg).toLocaleString()}
                                        </span>
                                        <label className="modern-checkbox" style={{ marginLeft: 'auto' }}>
                                            <input
                                                type="checkbox"
                                                checked={activeStates[key] || false}
                                                onChange={() => toggleState(key)}
                                            />
                                            Enable
                                        </label>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </ExpandableSection>
            )}

            <CharacterMenu
                characters={characters.filter(
                    (char) =>
                        !team.includes(char.link) || char.link === team[activeCharacterSlot]
                )}
                handleCharacterSelect={handleCharacterSelect}
                menuRef={menuRef}
                menuOpen={characterMenuOpen}
                setMenuOpen={setCharacterMenuOpen}
                rarityMap={rarityMap}
            />

            <GuidesModal
                open={showGuide}
                category={guideCategory}
                onClose={() => setShowGuide(false)}
            />
        </div>
    );
}

function loadBase() {
    useEffect(() => {
        const echoBuffIcons = echoBuffList.map(buff => buff.icon);
        const weaponBuffIcons = weaponBuffList.map(buff => buff.icon);
        preloadImages([...echoBuffIcons, ...weaponBuffIcons]);
    }, []);
}

export function getTeamRotationTotals(mainRuntime, characterRuntimeStates, savedRotations = []) {
    const teamIds = [
        mainRuntime?.Team?.[1],
        mainRuntime?.Team?.[2]
    ].filter(Boolean);

    const totalsByCharId = {};

    for (const charId of teamIds) {
        const entries = [];
        const state = characterRuntimeStates[charId];
        const hasLiveData =
            state && Array.isArray(state.allSkillResults) && Array.isArray(state.rotationEntries);

        if (hasLiveData) {
            const liveTotal = calculateRotationTotals(state.allSkillResults, state.rotationEntries);
            const { normal, crit, avg } = liveTotal.total;
            if (normal !== 0 || crit !== 0 || avg !== 0) {
                entries.push({
                    ...liveTotal,
                    characterName: characterRuntimeStates[charId]?.Name,
                    id: 'live'
                });
            }
        }

        const charSavedRotations = savedRotations.filter(
            (r) => String(r.characterId) === String(charId)
        );

        charSavedRotations.forEach((saved, index) => {
            const { normal, crit, avg } = saved.total ?? {};
            if (normal !== 0 || crit !== 0 || avg !== 0) {
                entries.push({
                    total: saved.total,
                    characterName: saved.characterName,
                    id: `saved-${index}`
                });
            }
        });

        if (entries.length > 0) {
            totalsByCharId[charId] = entries;
        }
    }

    return totalsByCharId;
}

export function getResolvedTeamRotations(runtime, characterRuntimeStates, savedRotations) {
    const teamRotation = {};
    const team = runtime?.Team?.slice(1, 3) ?? [];

    for (const teammateId of team) {
        const allTotals = getTeamRotationTotals(runtime, characterRuntimeStates, savedRotations)?.[teammateId];
        if (!allTotals || allTotals.length === 0) continue;

        const stored = runtime?.teamRotation?.[teammateId];
        const selectedId = stored?.id ?? allTotals[0].id;

        const selectedIndex = allTotals.findIndex(entry => entry.id === selectedId);
        const fallbackIndex = selectedIndex >= 0 ? selectedIndex : 0;

        const selected = allTotals[fallbackIndex];
        teamRotation[teammateId] = selected;
    }

    return teamRotation;
}