import React, {useEffect} from 'react';
import DropdownSelect from "../../components/DropdownSelect.jsx";
import {highlightKeywordsInText} from "../../constants/echoSetData.jsx";

export function WeaponUI({
                             activeStates,
                             toggleState,
                             currentParamValues = [],
                             setCharacterRuntimeStates, charId, keywords
                         }) {

    keywords.push('Rover: ', 'Rover', 'Unbound Flow')

    useEffect(() => {
        if (!(charId === '1406' || charId === '1408') && activeStates?.secondP) {
            setCharacterRuntimeStates(prev => ({
                ...prev,
                [charId]: {
                    ...(prev[charId] ?? {}),
                    activeStates: {
                        ...(prev[charId]?.activeStates ?? {}),
                        secondP: false
                    }
                }
            }));
        }
    }, [charId]);

    return (
        <div className="status-toggles">
            <div className="status-toggle-box">
                <div className="status-toggle-box-inner">
                    <p>
                        {highlightKeywordsInText(`Providing Healing increases Resonance Skill DMG by ${currentParamValues[0]}.`, keywords)}
                    </p>
                    <label className="modern-checkbox">
                        <input
                            type="checkbox"
                            checked={activeStates.firstP || false}
                            onChange={() => toggleState('firstP')}
                        />
                        Enable
                    </label>
                    <p>
                        {highlightKeywordsInText(`When Rover: Aero casts Resonance Skill Unbound Flow, Aero DMG dealt by nearby Resonators on the field is Amplified by ${currentParamValues[2]}.`, keywords)}
                    </p>
                    <label className="modern-checkbox"
                           style={{
                               opacity: !(charId === '1406' || charId === '1408') ? 0.5 : 1,
                               cursor: (charId === '1406' || charId === '1408') ? 'pointer' : 'not-allowed'
                           }}>

                        <input
                            type="checkbox"
                            checked={activeStates.secondP || false}
                            onChange={() => toggleState('secondP')}
                            disabled={!(charId === '1406' || charId === '1408')}
                        />
                        Enable
                        {!(charId === '1406' || charId === '1408') && (
                            <p style={{ fontSize: '12px', color: 'gray' }}>
                                This effect only applies to Rover: Aero.
                            </p>
                        )}
                    </label>
                </div>
            </div>
        </div>
    );
}


export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     currentParamValues = []
                                 }) {
    const skill = parseFloat(currentParamValues[0]);
    const amp = parseFloat(currentParamValues[2]);


    if (characterState?.activeStates?.firstP) {
        mergedBuffs.resonanceSkill = (mergedBuffs.resonanceSkill ?? 0) + skill;
    }

    if (characterState?.activeStates?.secondP) {
        mergedBuffs.elementDmgAmplify.aero = (mergedBuffs.elementDmgAmplify.aero ?? 0) + amp;
    }

    return { mergedBuffs, combatState, skillMeta };
}