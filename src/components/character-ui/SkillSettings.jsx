import React from 'react';
import skillTabs from '../../constants/skillTabs.js';
import {Info} from "lucide-react";

export default function SkillSettings({
                                          sliderValues,
                                          setSliderValues,
                                          currentSliderColor,
                                          setSkillsModalOpen
                                      }) {
    return (
        <div className="skills-settings clickable">
            <div className="echo-info" onClick={() => setSkillsModalOpen(true)}>
                <Info size={20} />
            </div>
            <div onClick={(e) => e.stopPropagation()}>
                {skillTabs.map(tab => {
                    if (tab === 'outroSkill') return null;

                    const value = sliderValues[tab] ?? 1;

                    return (
                        <div className="slider-group" key={tab}>
                            <label>
                                {tab
                                    .replace(/([A-Z])/g, ' $1')
                                    .replace(/^./, str => str.toUpperCase())
                                }
                            </label>
                            <div className="slider-controls">
                                <input
                                    type="range"
                                    min="1"
                                    max="10"
                                    value={value}
                                    onChange={(e) =>
                                        setSliderValues(prev => ({
                                            ...prev,
                                            [tab]: Number(e.target.value)
                                        }))
                                    }
                                    style={{
                                        '--slider-color': currentSliderColor,
                                        '--slider-fill': `${((value - 1) / 9) * 100}%`
                                    }}
                                />
                                <span>{value}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}