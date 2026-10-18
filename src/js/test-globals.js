// bun test runs every test file in one global scope, so a test that replaces a
// global must put it back, or the replacement leaks into the files after it.

/** @type {Map<string, PropertyDescriptor | undefined>} */
const originals = new Map();

/**
 * Replaces a global until the next call to unstubAllGlobals.
 * @param {string} name
 * @param {unknown} value
 */
export function stubGlobal(name, value) {
  if (!originals.has(name)) {
    originals.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
  }
  Object.defineProperty(globalThis, name, {
    value,
    writable: true,
    configurable: true,
    enumerable: true,
  });
}

/** Restores every global replaced by stubGlobal. */
export function unstubAllGlobals() {
  for (const [name, original] of originals) {
    if (original) {
      Object.defineProperty(globalThis, name, original);
    } else {
      Reflect.deleteProperty(globalThis, name);
    }
  }
  originals.clear();
}
