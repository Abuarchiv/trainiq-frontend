import { describe, it, expect, vi, beforeEach } from "vitest";

// Helper to create a mock IDBRequest that calls onsuccess when assigned
function createMockRequest<T>(result: T) {
  const req: any = {
    onsuccess: null as (() => void) | null,
    onerror: null as (() => void) | null,
    result,
    error: null,
  };
  // Call onsuccess on next microtask when it's assigned
  queueMicrotask(() => {
    if (req.onsuccess) req.onsuccess();
  });
  return req;
}

// Mock api module
vi.mock("@/lib/api", () => ({
  default: {
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

let actionsStore: any[] = [];

function createMockDB() {
  const mockStore = {
    getAll: vi.fn(() => createMockRequest([...actionsStore])),
    add: vi.fn((item: any) => { actionsStore.push(item); }),
    delete: vi.fn(),
    clear: vi.fn(() => { actionsStore = []; }),
  };

  const mockTx = {
    objectStore: vi.fn(() => mockStore),
    oncomplete: null as (() => void) | null,
    onerror: null as (() => void) | null,
    error: null,
  };

  const mockDB = {
    transaction: vi.fn(() => {
      // Call oncomplete on next microtask
      queueMicrotask(() => {
        if (mockTx.oncomplete) mockTx.oncomplete();
      });
      return mockTx;
    }),
    objectStoreNames: { contains: vi.fn(() => true) },
    createObjectStore: vi.fn(),
  };

  return { mockDB, mockTx, mockStore };
}

describe("Offline Sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    actionsStore = [];

    const { mockDB } = createMockDB();

    // Mock indexedDB.open to immediately resolve
    const mockIndexedDB = {
      open: vi.fn(() => {
        const req = createMockRequest(mockDB);
        req.onupgradeneeded = null;
        return req;
      }),
      deleteDatabase: vi.fn(),
    };
    // @ts-expect-error - Mocking global IndexedDB
    global.indexedDB = mockIndexedDB;
  });

  describe("syncQueuedActions", () => {
    it("sollte nur erfolgreiche Aktionen löschen, fehlgeschlagene behalten", async () => {
      const { syncQueuedActions } = await import("@/lib/offline");
      const { default: api } = await import("@/lib/api");

      // Set up actions in the mock store
      actionsStore = [
        { id: 1, type: "complete", endpoint: "/training/1/complete", method: "POST", body: {}, timestamp: Date.now() },
        { id: 2, type: "skip", endpoint: "/training/2/skip", method: "POST", body: {}, timestamp: Date.now() },
        { id: 3, type: "complete", endpoint: "/training/3/complete", method: "POST", body: {}, timestamp: Date.now() },
      ];

      // API: Action 2 fails
      (api.post as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({});

      const synced = await syncQueuedActions();

      expect(synced).toBe(2);
      expect(api.post).toHaveBeenCalledTimes(3);
    });

    it("sollte keine Aktionen löschen wenn alle fehlschlagen", async () => {
      const { syncQueuedActions } = await import("@/lib/offline");
      const { default: api } = await import("@/lib/api");

      actionsStore = [
        { id: 1, type: "complete", endpoint: "/training/1/complete", method: "POST", body: {}, timestamp: Date.now() },
      ];

      (api.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("Network error"));

      const synced = await syncQueuedActions();

      expect(synced).toBe(0);
    });
  });
});
