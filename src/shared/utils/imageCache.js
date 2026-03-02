// imageCache.js
// ---------------------------------------------------------------------------
// A minimal IndexedDB wrapper for caching images (blobs).
// Each image is stored in an object store named "images" under a unique key.
// Example key: "bgcache:/assets/backgrounds/wallpaper1.jpg:1920x1080"
// ---------------------------------------------------------------------------

const DB_NAME = "WuWaImageCache";
const STORE_NAME = "images";
const DB_VERSION = 1;

/** Open or upgrade the IndexedDB database. */
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/** Save a blob (image) in the cache under the given key. */
export async function saveImage(key, blob) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        store.put(blob, key);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
    });
}

/** Load a cached image blob by key. Returns null if not found. */
export async function loadImage(key) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
    });
}

/** Remove a cached image by key (optional cleanup). */
export async function deleteImage(key) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(key);
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
    });
}

/** Clear all cached images. */
export async function clearImageCache() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const req = store.clear();
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
    });
}