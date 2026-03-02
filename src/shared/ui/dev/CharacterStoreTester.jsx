import React, {useEffect, useMemo, useState} from 'react';
import {characterStore} from '@shared/state/characterStore.js';

function makeSampleState(seed = Date.now()) {
    const baseId = seed.toString();
    return {
        Id: baseId,
        Name: `Tester ${baseId.slice(-4)}`,
        Attribute: 'Spectro',
        WeaponType: 1,
        CharacterLevel: 20 + (seed % 10),
        SkillLevels: {
            normalAttack: 3,
            resonanceSkill: 3,
            forteCircuit: 3,
            resonanceLiberation: 3,
            introSkill: 1,
            sequence: 0
        },
        TraceNodeBuffs: {
            activeNodes: { core: true, minor: seed % 2 === 0 },
            atkPercent: 0.12,
            hpPercent: 0.08
        },
        CustomBuffs: { atkFlat: 15 + (seed % 5), critRate: 0.05 },
        CombatState: {
            weaponId: `W-${baseId.slice(-3)}`,
            weaponLevel: 1,
            weaponRank: 1,
            weaponRarity: 3,
            weaponBaseAtk: 100 + (seed % 20),
            weaponStat: { Type: 'AttackAddedRatioBase', Value: 0.08 },
            enemyLevel: 90,
            enemyRes: 20
        },
        Stats: {
            atk: 150 + (seed % 25),
            hp: 1200 + (seed % 50),
            def: 60 + (seed % 10)
        },
        FinalStats: {},
        equippedEchoes: [],
        Team: [baseId, null, null],
        rotationEntries: []
    };
}

export default function CharacterStoreTester() {
    const [snapshot, setSnapshot] = useState(() => characterStore.getCharacters());
    const [activeId, setActiveId] = useState(() => characterStore.getActiveCharacterId());
    const [log, setLog] = useState('Ready');

    useEffect(() => {
        const unsubscribe = characterStore.subscribe((data) => {
            setSnapshot(data);
            setActiveId(characterStore.getActiveCharacterId());
        });
        return () => unsubscribe();
    }, []);

    const sortedEntries = useMemo(
        () => Object.values(snapshot ?? {}).sort((a, b) =>
            (a?.character?.name ?? '').localeCompare(b?.character?.name ?? '', undefined, { sensitivity: 'base' })
        ),
        [snapshot]
    );

    const addSample = () => {
        const sample = makeSampleState();
        const exists = characterStore.addCharacter(sample);
        setLog(exists ? 'Duplicate detected (not added)' : `Added sample ${sample.Name}`);
    };

    const updateFirst = () => {
        const first = sortedEntries[0];
        if (!first?.character?.id) {
            setLog('Nothing to update');
            return;
        }
        const bumped = {
            ...first,
            progression: {
                ...first.progression,
                characterLevel: (first.progression?.characterLevel ?? 0) + 1
            },
            buffs: {
                ...first.buffs,
                custom: { ...(first.buffs?.custom ?? {}), atkFlat: (first.buffs?.custom?.atkFlat ?? 0) + 5 },
                combat: { ...(first.buffs?.combat ?? {}), enemyLevel: (first.combat?.enemyLevel ?? 90) + 1 }
            }
        };
        characterStore.updateCharacter(bumped);
        setLog(`Updated ${first.character.name}`);
    };

    const removeFirst = () => {
        const first = sortedEntries[0];
        if (!first?.character?.id) {
            setLog('Nothing to remove');
            return;
        }
        characterStore.removeCharacter(first.character.id);
        setLog(`Removed ${first.character.name}`);
    };

    const bulkSet = () => {
        const one = makeSampleState(Date.now());
        const two = makeSampleState(Date.now() + 1);
        characterStore.setCharacters({
            [one.Id]: one,
            [two.Id]: two
        });
        setLog('Bulk set with two samples');
    };

    const activateFirst = () => {
        const first = sortedEntries[0];
        if (!first?.character?.id) {
            setLog('No character to activate');
            return;
        }
        characterStore.setActiveCharacterId(first.character.id);
        setLog(`Active set to ${first.character.name}`);
    };

    const inspectFirst = () => {
        const first = sortedEntries[0];
        if (!first?.character?.id) {
            setLog('Nothing to inspect');
            return;
        }
        const fresh = characterStore.getCharacter(first.character.id);
        setLog(`Inspect: ${JSON.stringify(fresh, null, 2)}`);
    };

    return (
        <div style={{ border: '1px solid #444', padding: '12px', borderRadius: 8, marginTop: 12 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                <button onClick={addSample}>Add Sample</button>
                <button onClick={updateFirst}>Update First</button>
                <button onClick={removeFirst}>Remove First</button>
                <button onClick={bulkSet}>Set Characters (2)</button>
                <button onClick={characterStore.clearCharacters}>Clear</button>
                <button onClick={activateFirst}>Set Active</button>
                <button onClick={inspectFirst}>Inspect First</button>
            </div>
            <div style={{ marginBottom: 8 }}>
                <strong>Active ID:</strong> {activeId ?? 'none'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
                {sortedEntries.map(entry => (
                    <div key={entry.character.id} style={{ border: '1px solid #ccc', borderRadius: 6, padding: 8 }}>
                        <div><strong>{entry.character.name}</strong></div>
                        <div>ID: {entry.character.id}</div>
                        <div>Level: {entry.progression?.characterLevel ?? 'n/a'}</div>
                        <div>Weapon: {entry.equipment?.weapon?.id ?? 'none'}</div>
                        <div>Buffs: {entry.buffs?.custom ? Object.keys(entry.buffs.custom).length : 0}</div>
                        <div>Echoes: {Array.isArray(entry.equipment?.echoes) ? entry.equipment.echoes.length : 0}</div>
                        <div>Team: {Array.isArray(entry.team?.memberIds) ? entry.team.memberIds.join(', ') : 'n/a'}</div>
                    </div>
                ))}
                {sortedEntries.length === 0 && (
                    <div style={{ color: '#999' }}>No characters in store.</div>
                )}
            </div>
            <pre style={{ whiteSpace: 'pre-wrap', marginTop: 12, background: '#111', color: '#9ef', padding: 8, borderRadius: 6 }}>
                {log}
            </pre>
        </div>
    );
}
