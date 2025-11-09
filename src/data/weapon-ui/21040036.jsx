import React from 'react';
import {highlightKeywordsInText} from "../../constants/echoSetData.jsx";

export function blazingJusticeUI({
                                     activeStates,
                                     toggleState,
                                     currentParamValues = [],
    keywords,
                                 }) {
    return (
        <div className="status-toggles">
            <div className="status-toggle-box">
                <div className="status-toggle-box-inner">
                    <p>{highlightKeywordsInText(`Increases ATK by ${currentParamValues[0]}.`, keywords)}</p>
                </div>

                <div className="status-toggle-box-inner">
                    <p>
                        {highlightKeywordsInText(`When enabled, Basic Attacks ignore ${currentParamValues[1]} of enemy DEF and Spectro Frazzle DMG
                            is Amplified by ${currentParamValues[2]}.`, keywords)}
                    </p>
                    <label className="modern-checkbox">
                        <input
                            type="checkbox"
                            checked={activeStates.darknessBreaker || false}
                            onChange={() => toggleState('darknessBreaker')}
                        />
                        Enable
                    </label>
                </div>
            </div>
        </div>
    );
}

export const WeaponUI = blazingJusticeUI;

export function applyWeaponLogic({
                                     mergedBuffs,
                                     combatState,
                                     characterState,
                                     skillMeta = {},
                                     currentParamValues = []
                                 }) {
    const atkBonus = parseFloat(currentParamValues[0]);
    const amplify = parseFloat(currentParamValues[2]);
    mergedBuffs.atkPercent = (mergedBuffs.atkPercent ?? 0) + atkBonus;

    if (characterState?.activeStates?.darknessBreaker) {
        mergedBuffs.damageTypeAmplify.spectroFrazzle = (mergedBuffs.damageTypeAmplify.spectroFrazzle ?? 0) + amplify;
    }

    return { mergedBuffs, combatState, skillMeta };
}

export function updateSkillMeta({
                                    characterState,
                                    skillMeta = {},
                                    currentParamValues = []
                                } ) {
    const defIgnore = parseFloat(currentParamValues[1]);
    if (
        characterState?.activeStates?.darknessBreaker &&
        (
            skillMeta.skillType.includes('basic') ||
            skillMeta.tab === 'forteCircuit'
        )
    ) {
        skillMeta.skillDefIgnore = (skillMeta.skillDefIgnore ?? 0) + defIgnore;
    }

    return skillMeta;
}