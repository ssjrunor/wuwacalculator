import React from 'react';
import OverviewDetailPane from "./OverviewDetailPane.jsx";

export default function CharacterOverviewPane({
                                                  characterRuntimeStates,
                                                  onClose,
                                                  characters,
                                                  keywords,
                                                  activeCharacterId,
                                                  weapons,
                                                  handleCharacterSelect,
                                                  switchLeftPane,
                                                  setLeftPaneView,
                                                  setCharacterRuntimeStates,
                                                  handleReset,
                                                  allRotations,
    theme
}) {
    const isCollapsedMode = window.innerWidth <= 910;
    const [selectedId, setSelectedId] = React.useState(
        activeCharacterId ?? Object.keys(characterRuntimeStates)[0] ?? null
    );

    const characterMap = Object.fromEntries(characters.map(c => [String(c.link), c]));

    const sortedCharacterIds = Object.keys(characterRuntimeStates)
        .filter(id => characterMap[id])
        .sort((a, b) => {
            const charA = characterMap[a];
            const charB = characterMap[b];

            if ((charA.attribute ?? 99) !== (charB.attribute ?? 99)) {
                return (charA.attribute ?? 99) - (charB.attribute ?? 99);
            }

            return (charA.displayName ?? '').localeCompare(charB.displayName ?? '');
        });

    return (
        <div className="character-overview-pane">
            <div className="character-overview-header">
                <h2>Overview</h2>
                <button onClick={onClose} className="character-overview-close">← Back</button>
            </div>

            {isCollapsedMode ? (
                <div className="character-overview-collapsed">
                    <div className="horizontal-character-scroll">
                        {sortedCharacterIds.map(charId => {
                            const state = characterRuntimeStates[charId];
                            const matchingChar = characterMap[charId];
                            const icon = matchingChar?.icon ?? '/assets/character-icons/default.webp';
                            const isSelected = charId === selectedId;

                            return (
                                <button
                                    key={charId}
                                    className={`scroll-icon ${isSelected ? 'selected' : ''} header-icon`}
                                    onClick={() => {
                                        const selectedCharacter = characters.find(c => String(c.link) === String(charId));
                                        if (selectedCharacter) {
                                            handleCharacterSelect(selectedCharacter);
                                            setSelectedId(charId);
                                        }
                                    }}
                                >
                                    <img
                                        className="header-icon"
                                        src={icon} alt={matchingChar?.displayName || charId}
                                    />
                                </button>
                            );
                        })}
                    </div>

                    <div className="character-overview-mobile-pane">
                        {selectedId ? (
                            <OverviewDetailPane
                                splashArt={`/assets/sprite/${selectedId}.webp`}
                                character={characters.find(c => String(c.link) === String(selectedId))}
                                runtime={characterRuntimeStates[selectedId]}
                                keywords={keywords}
                                weapons={weapons}
                                characters={characters}
                                switchLeftPane={switchLeftPane}
                                setCharacterRuntimeStates={setCharacterRuntimeStates}
                                setSelectedId={setSelectedId}
                                characterRuntimeStates={characterRuntimeStates}
                                handleCharacterSelect={handleCharacterSelect}
                                sortedCharacterIds={sortedCharacterIds}
                                handleReset={handleReset}
                                allRotations={allRotations}
                                theme={theme}
                            />
                        ) : (
                            <div className="placeholder">No character selected</div>
                        )}
                    </div>
                </div>
            ) : (

                <div className="character-overview-content">
                    <div className="character-list-column">
                        {sortedCharacterIds.map(charId => {
                            const state = characterRuntimeStates[charId];
                            const matchingChar = characterMap[charId];
                            const icon = matchingChar?.icon ?? '/assets/character-icons/default.webp';
                            const isSelected = charId === selectedId;

                            return (
                                <div
                                    key={charId}
                                    className={`character-row-item ${isSelected ? 'selected' : ''}`}
                                    onClick={() => {
                                        const selectedCharacter = characters.find(c => String(c.link) === String(charId));
                                        if (selectedCharacter) {
                                            setLeftPaneView('characters');
                                            handleCharacterSelect(selectedCharacter);
                                            setSelectedId(charId);
                                        }
                                    }}
                                >
                                    <img
                                        src={icon}
                                        alt={state.displayName || matchingChar?.displayName || charId}
                                        className="character-avatar"
                                    />
                                    <div className="character-details">
                                        <div className="character-name overview">
                                            {state.displayName || matchingChar?.displayName || `Character ${charId}`}
                                        </div>
                                        <div className="character-id">Lv.{state?.CharacterLevel ?? 1} | S{state?.SkillLevels?.sequence ?? 0}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="character-overview-sidepanel">
                        {selectedId ? (
                            <OverviewDetailPane
                                splashArt={`/assets/sprite/${selectedId}.webp`}
                                character={characters.find(c => String(c.link) === String(selectedId))}
                                runtime={characterRuntimeStates[selectedId]}
                                keywords={keywords}
                                weapons={weapons}
                                characters={characters}
                                switchLeftPane={switchLeftPane}
                                setCharacterRuntimeStates={setCharacterRuntimeStates}
                                setSelectedId={setSelectedId}
                                handleCharacterSelect={handleCharacterSelect}
                                characterRuntimeStates={characterRuntimeStates}
                                sortedCharacterIds={sortedCharacterIds}
                                handleReset={handleReset}
                                allRotations={allRotations}
                                theme={theme}
                            />
                        ) : (
                            <div className="placeholder">No character selected</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}