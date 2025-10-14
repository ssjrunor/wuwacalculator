import { isEqual } from 'lodash';
import {getPersistentValue, setPersistentValue} from "../hooks/usePersistentState.js";

let echoBag = [];
const listeners = new Set();

try {
    const stored = getPersistentValue('echoBag');
    if (stored) echoBag = stored;
} catch (e) {
    console.warn('Failed to load echoes in bag', e);
}

function notify() {
    listeners.forEach(cb => cb([...echoBag]));
    try {
        setPersistentValue('echoBag', JSON.stringify(echoBag));
    } catch (e) {
        console.warn('Failed to sync echoBag to localStorage', e);
    }
}

export function getEchoBag() {
    return [...echoBag];
}

export function setEchoBag(newBag) {
    echoBag = [...newBag];
    notify();
}

export function addEchoToBag(newEcho) {
    const exists = echoBag.some(e =>
        e.name === newEcho.name &&
        e.selectedSet === newEcho.selectedSet &&
        e.cost === newEcho.cost &&
        isEqual(e.mainStats, newEcho.mainStats) &&
        isEqual(e.subStats, newEcho.subStats)
    );

    if (!exists) {
        echoBag.push({
            ...newEcho,
            uid: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
        });
        notify();
        return false;
    } else {
        return true;
    }
}

export function removeEchoFromBag(uid) {
    echoBag = echoBag.filter(e => e.uid !== uid);
    notify();
}

export function updateEchoInBag(updatedEcho) {
    echoBag = echoBag.filter(e => e.uid !== updatedEcho.oldUid);
    echoBag.push(updatedEcho);
    notify();
}

export function subscribeEchoBag(callback) {
    listeners.add(callback);
    callback([...echoBag]);
    return () => listeners.delete(callback);
}

export function clearEchoBag() {
    echoBag = [];
    notify();
}