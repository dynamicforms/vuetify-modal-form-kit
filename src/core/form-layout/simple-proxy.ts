// the string keys a runtime reaches for on a value it knows nothing about
const probeKeys = new Set<string>(['then', 'toString', 'valueOf', 'toJSON']);

/**
 * True for keys a runtime reads on an unknown value (any symbol; `then`, `toString`, `valueOf`, `toJSON`) rather
 * than a builder method; such keys answer `undefined`, so awaiting, coercing, inspecting or JSON-serialising the
 * proxy adds nothing.
 */
export function isRuntimeProbe(prop: string | symbol): boolean {
  return typeof prop === 'symbol' || probeKeys.has(prop);
}
