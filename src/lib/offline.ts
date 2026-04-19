const DB_NAME = "trainiq-offline";
const DB_VERSION = 1;

interface OfflineAction {
  id?: number;
  type: "complete" | "skip" | "chat";
  endpoint: string;
  method: "POST" | "DELETE";
  body?: Record<string, unknown>;
  timestamp: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("actions")) {
        db.createObjectStore("actions", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("plans")) {
        db.createObjectStore("plans", { keyPath: "date" });
      }
    };
  });
}

export async function cachePlans(plans: unknown[]): Promise<void> {
  const db = await openDB();
  const tx = db.transaction("plans", "readwrite");
  const store = tx.objectStore("plans");
  for (const plan of plans as Array<Record<string, unknown>>) {
    store.put(plan);
  }
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getCachedPlans(): Promise<unknown[]> {
  const db = await openDB();
  const tx = db.transaction("plans", "readonly");
  const store = tx.objectStore("plans");
  const request = store.getAll();
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function queueAction(action: Omit<OfflineAction, "id" | "timestamp">): Promise<void> {
  const db = await openDB();
  const tx = db.transaction("actions", "readwrite");
  const store = tx.objectStore("actions");
  store.add({ ...action, timestamp: Date.now() });
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getQueuedActions(): Promise<OfflineAction[]> {
  const db = await openDB();
  const tx = db.transaction("actions", "readonly");
  const store = tx.objectStore("actions");
  const request = store.getAll();
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function clearQueuedActions(): Promise<void> {
  const db = await openDB();
  const tx = db.transaction("actions", "readwrite");
  const store = tx.objectStore("actions");
  store.clear();
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function syncQueuedActions(): Promise<number> {
  const { default: api } = await import("@/lib/api");
  const actions = await getQueuedActions();
  let synced = 0;
  const failedActionIds: number[] = [];

  for (const action of actions) {
    try {
      if (action.method === "POST") {
        await api.post(action.endpoint, action.body);
      } else if (action.method === "DELETE") {
        await api.delete(action.endpoint);
      }
      synced++;
    } catch {
      // Aktion fehlgeschlagen - ID merken für später
      if (action.id !== undefined) {
        failedActionIds.push(action.id);
      }
    }
  }

  // Nur erfolgreiche Aktionen löschen, fehlgeschlagene behalten
  if (synced > 0) {
    const db = await openDB();
    const tx = db.transaction("actions", "readwrite");
    const store = tx.objectStore("actions");
    
    for (const action of actions) {
      if (action.id !== undefined && !failedActionIds.includes(action.id)) {
        store.delete(action.id);
      }
    }
    
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  return synced;
}
