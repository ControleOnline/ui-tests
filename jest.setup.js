function createStorageMock(initialValue = {}) {
  const store = new Map(
    Object.entries(initialValue).map(([key, value]) => [String(key), String(value)]),
  );

  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key) {
      const normalizedKey = String(key);
      return store.has(normalizedKey) ? store.get(normalizedKey) : null;
    },
    key(index) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key) {
      store.delete(String(key));
    },
    setItem(key, value) {
      store.set(String(key), String(value));
    },
  };
}

if (typeof globalThis.localStorage === 'undefined') {
  globalThis.localStorage = createStorageMock();
}

if (typeof globalThis.sessionStorage === 'undefined') {
  globalThis.sessionStorage = createStorageMock();
}

if (typeof globalThis.__DEV__ === 'undefined') {
  globalThis.__DEV__ = true;
}

if (typeof URL.createObjectURL !== 'function') {
  URL.createObjectURL = () => 'blob:mock';
}

if (typeof URL.revokeObjectURL !== 'function') {
  URL.revokeObjectURL = () => {};
}
