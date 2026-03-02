import React from 'react';
import { formatDescription } from '@shared/utils/formatDescription.js';
import { getSequenceToggleComponent } from '@/data/characters/ui/index.js';
import {highlightKeywordsInText} from "@shared/constants/echoSetData.jsx";

export default function SequenceSkillsBox({
                                              activeCharacter,
                                              currentSliderColor,
                                              sliderValues,
                                              characterRuntimeStates,
                                              setCharacterRuntimeStates,
                                              keywords
                                          }) {
    if (!activeCharacter || !activeCharacter.raw?.Chains || sliderValues.sequence === 0) return null;

    const charId = activeCharacter?.Id ?? activeCharacter?.id ?? activeCharacter?.link;
    const ToggleComponent = getSequenceToggleComponent(charId);
    const sequenceLevel = sliderValues.sequence;
    const chains = activeCharacter.raw.Chains;

    const unlockedChains = Object.entries(chains)
        .filter(([key]) => Number(key) <= sequenceLevel)
        .sort(([a], [b]) => Number(a) - Number(b));

    const sequenceToggles = characterRuntimeStates?.[charId]?.sequenceToggles ?? {};

    const toggleSequence = (seqKey) => {
        setCharacterRuntimeStates(prev => {
            const newState = {
                ...prev,
                [charId]: {
                    ...(prev[charId] ?? {}),
                    sequenceToggles: {
                        ...(prev[charId]?.sequenceToggles ?? {}),
                        [seqKey]: !(prev[charId]?.sequenceToggles?.[seqKey] ?? false)
                    }
                }
            };

            return newState;
        });
    };

    return (
        <div className="inherent-skills-box">
            <h2>Resonance Chain</h2>
            {unlockedChains.map(([key, chain]) => (
                <div key={key} className="echo-buff" style={{ marginTop: '15px'}}>
                    <h3 className={'highlight'}>Sequence Node {key}: {chain.Name}</h3>
                    <p>
                        {highlightKeywordsInText(formatDescription(chain.Desc, chain.Param, currentSliderColor), keywords)}
                    </p>

                    {ToggleComponent && (
                        <ToggleComponent
                            nodeKey={key}
                            sequenceToggles={sequenceToggles}
                            toggleSequence={toggleSequence}
                            currentSequenceLevel={sliderValues.sequence}
                            setCharacterRuntimeStates={setCharacterRuntimeStates}
                            charId={charId}
                            characterRuntimeStates={characterRuntimeStates}
                        />
                    )}
                </div>
            ))}
        </div>
    );
}