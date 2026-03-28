/**
 * IndexedDB — file hors-ligne sadaq.app/android
 * Stores: pending donations queue, cached causes, cached settings
 */

const DB_NAME = "sadaq-android-offline";
const DB_VERSION = 1;

interface PendingDonation {
  id: string;
  amount: number;
  cause: string;
  reference: string;
  type: string;
  status: string;
  auth_code?: string;
  terminal_id?: string;
  borne_id?: string;
  created_at: string;
  synced: boolean;
}

interface CachedCause {
  id: string;
  name: string;
  icon: string;
  goal: number;
  raised: number;
  active: boolean;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("pending_donations")) {
        const store = db.createObjectStore("pending_donations", { keyPath: "id" });
        store.createIndex("synced", "synced", { unique: false });
      }
      if (!db.objectStoreNames.contains("cached_causes")) {
        db.createObjectStore("cached_causes", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("cached_settings")) {
        db.createObjectStore("cached_settings", { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ─── Pending Donations Queue ───────────────────────────────────────────────

export async function queueDonation(donation: Omit<PendingDonation, "synced">): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("pending_donations", "readwrite");
    tx.objectStore("pending_donations").put({ ...donation, synced: false });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPendingDonations(): Promise<PendingDonation[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("pending_donations", "readonly");
    const request = tx.objectStore("pending_donations").getAll();
    request.onsuccess = () => {
      const all = request.result as PendingDonation[];
      resolve(all.filter((d) => !d.synced));
    };
    request.onerror = () => reject(request.error);
  });
}

export async function markDonationSynced(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("pending_donations", "readwrite");
    const store = tx.objectStore("pending_donations");
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      if (getReq.result) {
        store.put({ ...getReq.result, synced: true });
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllDonationsFromCache(): Promise<PendingDonation[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("pending_donations", "readonly");
    const request = tx.objectStore("pending_donations").getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ─── Cached Causes ─────────────────────────────────────────────────────────

export async function cacheCauses(causes: CachedCause[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("cached_causes", "readwrite");
    const store = tx.objectStore("cached_causes");
    store.clear();
    causes.forEach((c) => store.put(c));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getCachedCauses(): Promise<CachedCause[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("cached_causes", "readonly");
    const request = tx.objectStore("cached_causes").getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ─── Cached Settings ───────────────────────────────────────────────────────

export async function cacheSettings(key: string, value: unknown): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("cached_settings", "readwrite");
    tx.objectStore("cached_settings").put({ key, value, cached_at: new Date().toISOString() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getCachedSettings(key: string): Promise<unknown | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("cached_settings", "readonly");
    const request = tx.objectStore("cached_settings").get(key);
    request.onsuccess = () => resolve(request.result?.value ?? null);
    request.onerror = () => reject(request.error);
  });
}

// ─── Pending count (for badge) ─────────────────────────────────────────────

export async function getPendingCount(): Promise<number> {
  const pending = await getPendingDonations();
  return pending.length;
}
